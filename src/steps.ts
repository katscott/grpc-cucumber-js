/*
SPDX-Copyright: Copyright (c) Capital One Services, LLC 
SPDX-License-Identifier: Apache-2.0 
Copyright [2018] Capital One Services, LLC 

Licensed under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance with the License. 
You may obtain a copy of the License at 

  http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
implied. See the License for the specific language governing 
permissions and limitations under the License.
*/
/* eslint new-cap: "off", no-invalid-this: "off" */

import { Given, When, Then } from '@cucumber/cucumber';

Given(
  /^I store the raw value (.*) as (.*) in scenario scope$/,
  function (value: any, variable: any, callback: () => void) {
    this.grpcucumber.storeValueInScenarioScope(variable, value);
    callback();
  },
);

Given(
  /^I store the raw value (.*) as (.*) in global scope$/,
  function (value: any, variable: any, callback: () => void) {
    this.grpcucumber.storeValueInGlobalScope(variable, value);
    callback();
  },
);

Given(
  /^I set request message to (.*)$/,
  function (message: any, callback: () => void) {
    this.grpcucumber.setRequestMessageFromString(message);
    callback();
  },
);

Given(
  'I set request message to',
  function (valuesTable: any, callback: () => void) {
    this.grpcucumber.setRequestMessageFromTable(valuesTable);
    callback();
  },
);

Given(
  /^I pipe contents of file (.*) to request message$/,
  function (file: any, callback: (arg0?: Error) => void) {
    this.grpcucumber.setRequestMessageFromFile(
      file,
      function (error: string) {
        if (error) {
          callback(new Error(error));
        }

        callback();
      },
    );
  },
);

Given(
  /^I set request metadata to (.*)$/,
  function (metadata: any, callback: () => void) {
    this.grpcucumber.setRequestMetadataFromString(metadata);
    callback();
  },
);

Given(
  'I set request metadata to',
  function (valuesTable: any, callback: () => void) {
    this.grpcucumber.setRequestMetadataFromTable(valuesTable);
    callback();
  },
);

Given(
  /^I pipe contents of file (.*) to request metadata$/,
  function (file: any, callback: (arg0?: Error) => void) {
    this.grpcucumber.setRequestMetadataFromFile(
      file,
      function (error: string) {
        if (error) {
          callback(new Error(error));
        }

        callback();
      },
    );
  },
);

Given(
  /^I have (.*) stored in global scope$/,
  function (variableName: any, callback: any) {
    let assertion = this.grpcucumber.assertGlobalVariableValueExists(
      variableName,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

When(
  /^I request (.*)$/,
  function (resource: any, callback: () => void) {
    this.grpcucumber.request(
      resource,
      function (error: any, responseMessage: any) {
        callback();
      },
    );
  },
);

Then(
  /^I store the value of response message path (.*) as (.*) in scenario scope$/,
  function (path: any, variable: any, callback: () => void) {
    this.grpcucumber.storeValueOfResponseMessagePathInScenarioScope(
      path,
      variable,
    );
    callback();
  },
);

Then(
  /^I store the value of response message path (.*) as (.*) in global scope$/,
  function (path: any, variableName: any, callback: () => void) {
    this.grpcucumber.storeValueOfResponseMessagePathInGlobalScope(
      path,
      variableName,
    );
    callback();
  },
);

Then(
  /^response status should be (.*)$/,
  function (value: any, callback: any) {
    let assertion = this.grpcucumber.assertResponseStatusMatch(value);
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^response message path (.*) should be (((?!of type).*))$/,
  function (path: any, value: any, callback: any) {
    let assertion = this.grpcucumber.assertPathInResponseMessageMatchesExpression(
      path,
      value,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^response message path (.*) should not be (((?!of type).+))$/,
  function (path: any, value: any, callback: any) {
    let assertion = this.grpcucumber.assertPathInResponseMessageDoesNotMatchExpression(
      path,
      value,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^response message path (.*) should be of type array$/,
  function (path: any, callback: any) {
    let assertion = this.grpcucumber.assertPathIsArray(path);
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^response message path (.*) should be of type array with length (.*)$/,
  function (path: any, length: any, callback: any) {
    let assertion = this.grpcucumber.assertPathIsArrayWithLength(
      path,
      length,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^value of scenario variable (.*) should be (.*)$/,
  function (variableName: any, variableValue: any, callback: any) {
    let assertion = this.grpcucumber.assertScenarioVariableValueEqual(
      variableName,
      variableValue,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^value of scenario variable (.*) should not be (.*)$/,
  function (variableName: any, variableValue: any, callback: any) {
    let assertion = this.grpcucumber.assertScenarioVariableValueNotEqual(
      variableName,
      variableValue,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^value of global variable (.*) should be (.*)$/,
  function (variableName: any, variableValue: any, callback: any) {
    let assertion = this.grpcucumber.assertGlobalVariableValueEqual(
      variableName,
      variableValue,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);

Then(
  /^value of global variable (.*) should not be (.*)$/,
  function (variableName: any, variableValue: any, callback: any) {
    let assertion = this.grpcucumber.assertGlobalVariableValueNotEqual(
      variableName,
      variableValue,
    );
    this.grpcucumber.callbackWithAssertion(callback, assertion);
  },
);
