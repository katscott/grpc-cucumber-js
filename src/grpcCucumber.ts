import fs from 'fs';
import path from 'path';
import {
  ChannelCredentials,
  ClientOptions,
  credentials,
  loadPackageDefinition,
  Metadata,
  status,
} from '@grpc/grpc-js';
import interpolate from 'interpolate';
import { loadSync, Options } from '@grpc/proto-loader';
import mergeOptions from 'merge-options';
import Variables from './variables';
import globalVars from './globalVariables';
import evaluatePath from './evaluatePath';
import { DataTable } from '@cucumber/cucumber';
import { Hash, DataTableEntry } from './types';
import prettyJson from 'prettyjson';
import { $enum } from 'ts-enum-util';

export interface GrpcCucumberParams {
  protoPath: string;
  protoLoaderOptions: Options;
  serviceName: string;
  grpcHost: string;
  grpcCredentials: ChannelCredentials;
  fixturesDirectory: string;
  variableDelimiter?: string;
  grpcOptions: ClientOptions;
}

interface CreateClientParams {
  protoPath: string;
  protoLoaderOptions: {};
  serviceName: string;
  grpcHost: string;
  grpcCredentials: ChannelCredentials;
  grpcOptions: ClientOptions;
}

export default class GprcCucumber {
  options: GrpcCucumberParams;
  client: any;
  responseStatus: status;
  responseMessage: {};
  requestMessage: {};
  responseError: {};
  requestMetadata: {};
  scenarioVariables: Variables;

  constructor(options: GrpcCucumberParams) {
    this.options = mergeOptions(
      {
        protoPath: '',
        protoLoaderOptions: null,
        serviceName: '',
        grpcHost: '',
        grpcCredentials: credentials.createInsecure(),
        fixturesDirectory: '',
        variableDelimiter: '``',
        grpcOptions: {},
      },
      options,
    );

    // defaults
    this.client = this.createClient({
      protoPath: this.options.protoPath,
      protoLoaderOptions: this.options.protoLoaderOptions,
      serviceName: this.options.serviceName,
      grpcHost: this.options.grpcHost,
      grpcCredentials: this.options.grpcCredentials,
      grpcOptions: this.options.grpcOptions,
    });

    this.responseStatus = status.OK;
    this.responseMessage = {};
    this.requestMessage = {};
    this.responseError = {};
    this.requestMetadata = {};
    this.scenarioVariables = new Variables();
  }

  /**
   * Creates a grpc client
   */
  createClient({
    protoPath,
    protoLoaderOptions,
    serviceName,
    grpcHost,
    grpcCredentials,
    grpcOptions,
  }: CreateClientParams) {
    let packageDefinition = loadSync(protoPath, protoLoaderOptions);
    let grpcPackage = loadPackageDefinition(packageDefinition);

    let parts = serviceName.split('.');

    let Creator: any;
    try {
      Creator = parts.reduce(
        (prev, curr) => prev && prev[curr],
        grpcPackage,
      ) as never;
    } catch (e) {
      throw new Error(
        'Unable to find gRPC client constructor in package, check service name (ensure it matches correctly). Error info: ' +
          e,
      );
    }

    return new Creator(grpcHost, grpcCredentials, grpcOptions);
  }

  /**
   * Stores a value in the scenario scoped variables
   */
  storeValueInScenarioScope(variableName: string, value: never) {
    this.scenarioVariables.set(variableName, value);
  }

  /**
   * Stores a value in the global scoped variables
   */
  storeValueInGlobalScope(variableName: string, value: never) {
    globalVars.set(variableName, value);
  }

  /**
   * Retrieves a value in the global scoped variables
   */
  getGlobalVariable(variableName: string) {
    return globalVars.get(variableName);
  }

  /**
   * Stores the value of a response message path in a scenario scoped variable
   */
  storeValueOfResponseMessagePathInScenarioScope(
    path: string,
    variableName: string,
  ) {
    path = this.replaceVariables(path); // only replace path. replacing variable name wouldn't make sense
    const value = this.getResponseMessagePathValue(path);
    this.scenarioVariables.set(variableName, value as never);
  }

  /**
   * Stores the value of a response message path in a global scoped variable
   */
  storeValueOfResponseMessagePathInGlobalScope(
    path: string,
    variableName: string,
  ) {
    path = this.replaceVariables(path); // only replace path. replacing variable name wouldn't make sense
    const value = this.getResponseMessagePathValue(path);
    globalVars.set(variableName, value as never);
  }

  /**
   * Replaces variable identifiers in the resource string
   * with their value in all scopes if it exists
   */
  replaceVariables(resource: string) {
    const allVars = {
      ...globalVars.getAll(),
      ...this.scenarioVariables.getAll(),
    };
    resource = interpolate(resource, allVars, {
      delimiter: this.options.variableDelimiter,
    });
    return resource;
  }

  /**
   * Calls a gRPC function
   */
  request(
    rpcName: string,
    callback: (error: string | null, responseMessage?: any) => void,
  ) {
    // callback(error, message)
    if (typeof this.client[rpcName] === 'function') {
      this.client[rpcName](
        this.requestMessage,
        this.requestMetadata,
        function (error: any, responseMessage: never) {
          if (error) {
            this.responseStatus = status[error.code];
            this.responseError = error;
            callback(error);
          } else {
            this.responseMessage = responseMessage;
            callback(null, responseMessage);
          }
        }.bind(this),
      );
    } else {
      callback(rpcName + ' is not a valid resource.');
    }
  }

  /**
   * Sets the request message from a JSON string
   */
  setRequestMessageFromString(content: string) {
    content = this.replaceVariables(content);
    this.requestMessage = JSON.parse(content);
  }

  /**
   * Sets the request message from a hash value table
   */
  setRequestMessageFromTable(valuesTable: DataTable) {
    let body: Hash<string> = {};

    valuesTable.hashes().forEach(
      function (v: DataTableEntry) {
        const name = this.replaceVariables(v.name);
        const value = this.replaceVariables(v.value);
        body[name] = value;
      }.bind(this),
    );

    this.requestMessage = body;
  }

  /**
   * Sets the request message to a file's contents
   */
  setRequestMessageFromFile(file: string, callback: any) {
    file = this.replaceVariables(file);
    fs.readFile(
      path.join(this.options.fixturesDirectory, file),
      'utf8',
      function (err: any, data: any) {
        if (err) {
          callback(err);
        } else {
          this.setRequestMessageFromString(data);
          callback();
        }
      }.bind(this),
    );
  }

  /**
   * Sets the metadata from a JSON string
   */
  setRequestMetadataFromString(content: string) {
    content = this.replaceVariables(content);
    let jsonMetadata = JSON.parse(content);
    let metadata = new Metadata();

    Object.keys(jsonMetadata).forEach(function (key) {
      metadata.add(key, jsonMetadata[key]);
    });

    this.requestMetadata = metadata;
  }

  /**
   * Sets the request metadata from a hash value table
   */
  setRequestMetadataFromTable(valuesTable: DataTable) {
    let metadata = new Metadata();

    valuesTable.hashes().forEach(
      function (v: DataTableEntry) {
        const name = this.replaceVariables(v.name);
        const value = this.replaceVariables(v.value);
        metadata.add(name, value);
      }.bind(this),
    );

    this.requestMetadata = metadata;
  }

  /**
   * Sets the request metadata to a file's contents
   */
  setRequestMetadataFromFile(file: string, callback: any) {
    file = this.replaceVariables(file);
    fs.readFile(
      path.join(this.options.fixturesDirectory, file),
      'utf8',
      function (err: any, data: any) {
        if (err) {
          callback(err);
        } else {
          this.setRequestMetadataFromString(data);
          callback();
        }
      }.bind(this),
    );
  }

  /**
   * Gets the response message
   */
  getResponseMessage() {
    return this.responseMessage;
  }

  /**
   * Handles a callback with an assertion
   */
  callbackWithAssertion(callback: any, assertion: any) {
    if (assertion.expected === assertion.actual) {
      callback();
    } else {
      callback(
        prettyJson.render(
          { assertion: assertion },
          { noColor: true },
        ),
      );
    }
  }

  /**
   * Gets information about an assertion
   */
  getAssertionResult(
    expected: any,
    actual: any,
    expectedExpression: any,
    actualValue: any,
  ) {
    return {
      expected,
      actual,
      expectedExpression,
      actualValue,
    };
  }

  /**
   * Asserts that a global variable exists
   */
  assertGlobalVariableValueExists(name: string) {
    return this.getAssertionResult(
      true,
      globalVars.get(name) != undefined,
      'defined',
      'undefined',
    );
  }

  /**
   * Asserts that a value matches the expression
   */
  assertMatch(actualValue: string, expectedExpression: string) {
    let regExpObject = new RegExp(expectedExpression);
    let match = regExpObject.test(actualValue);
    return this.getAssertionResult(
      true,
      match,
      expectedExpression,
      actualValue,
    );
  }

  /**
   * Asserts that a value does not match the expression
   */
  assertNotMatch(actualValue: string, expectedExpression: string) {
    let regExpObject = new RegExp(expectedExpression);
    let match = regExpObject.test(actualValue);
    return this.getAssertionResult(
      false,
      match,
      expectedExpression,
      actualValue,
    );
  }

  /**
   * Asserts that the reponse status matches
   */
  assertResponseStatusMatch(value: string) {
    let expectedResult = true;

    const expectedValue = status[$enum(status).asKeyOrDefault(value)];
    const actualValue = $enum(status).asValueOrDefault(
      this.responseStatus,
    );

    let actualResult = expectedValue == expectedValue;

    return this.getAssertionResult(
      expectedResult,
      actualResult,
      expectedValue,
      actualValue,
    );
  }

  /**
   * Gets a response message path's value
   */
  getResponseMessagePathValue(path: string) {
    return evaluatePath(path, this.getResponseMessage());
  }

  /**
   * Asserts that a path in the response message matches
   */
  assertPathInResponseMessageMatchesExpression(
    path: string,
    regexp: string,
  ) {
    path = this.replaceVariables(path);
    regexp = this.replaceVariables(regexp);
    let evalValue = this.getResponseMessagePathValue(path);

    return this.assertMatch(evalValue, regexp);
  }

  /**
   * Asserts that a path in the response message does not match
   */
  assertPathInResponseMessageDoesNotMatchExpression(
    path: string,
    regexp: string,
  ) {
    path = this.replaceVariables(path);
    regexp = this.replaceVariables(regexp);
    let evalValue = this.getResponseMessagePathValue(path);

    return this.assertNotMatch(evalValue, regexp);
  }

  /**
   * Asserts that a path in the response message is an array
   */
  assertPathIsArray(path: string) {
    path = this.replaceVariables(path);
    const value = evaluatePath(path, this.getResponseMessage());
    const success = Array.isArray(value);
    return this.getAssertionResult(
      true,
      success,
      'array',
      typeof value,
    );
  }

  /**
   * Asserts that a path in the response message is an array with specified length
   */
  assertPathIsArrayWithLength(path: string, length: string) {
    path = this.replaceVariables(path);
    length = this.replaceVariables(length);
    let success = false;
    let actual = '?';
    const value = evaluatePath(path, this.getResponseMessage());
    if (Array.isArray(value)) {
      success = value.length === Number(length);
      actual = String(value.length);
    }

    return this.getAssertionResult(true, success, length, actual);
  }

  /**
   * Asserts that a scenario variable matches a value
   */
  assertScenarioVariableValueEqual(
    variableName: string,
    value: string,
  ) {
    let expectedValue = this.replaceVariables(value);
    let actualValue = String(
      this.scenarioVariables.get(variableName),
    );
    return this.getAssertionResult(
      true,
      expectedValue === actualValue,
      expectedValue,
      actualValue,
    );
  }

  /**
   * Asserts that a scenario variable does not match a value
   */
  assertScenarioVariableValueNotEqual(
    variableName: string,
    value: string,
  ) {
    let expectedValue = this.replaceVariables(value);
    let actualValue = String(
      this.scenarioVariables.get(variableName),
    );
    return this.getAssertionResult(
      false,
      expectedValue === actualValue,
      expectedValue,
      actualValue,
    );
  }

  /**
   * Asserts that a global variable matches a value
   */
  assertGlobalVariableValueEqual(
    variableName: string,
    value: string,
  ) {
    let expectedValue = this.replaceVariables(value);
    let actualValue = String(globalVars.get(variableName));
    return this.getAssertionResult(
      true,
      expectedValue === actualValue,
      expectedValue,
      actualValue,
    );
  }

  /**
   * Asserts that a global variable does not match a value
   */
  assertGlobalVariableValueNotEqual(
    variableName: string,
    value: string,
  ) {
    let expectedValue = this.replaceVariables(value);
    let actualValue = String(globalVars.get(variableName));
    return this.getAssertionResult(
      false,
      expectedValue === actualValue,
      expectedValue,
      actualValue,
    );
  }
}
