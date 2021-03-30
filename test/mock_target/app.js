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
/* eslint no-console: "off" */
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const interpolate = require('interpolate');
const {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService,
} = require('grpc-ts-health-check');

const languages = {
  english: 'Hello {name}',
  french: 'Bonjour {name}',
  german: 'Guten tag {name}',
  hindi: 'Namaste {name}',
  italian: 'Ciao {name}',
  japanese: 'Ohayo {name}',
  mandarin: 'Ni Hau {name}',
  spanish: 'Hola {name}',
  swahili: 'Jambo {name}',
};

const PROTO_PATH = __dirname + '/helloworld.proto';

const serviceName = 'helloworld.Greeter';

const helloProto = protoLoader.loadSync(PROTO_PATH, {})[serviceName];

const transform = function (message, instruction) {
  if (
    typeof instruction === 'string' &&
    instruction.toLowerCase() == 'uppercase'
  ) {
    return message.toUpperCase();
  }

  if (
    typeof instruction === 'string' &&
    instruction.toLowerCase() == 'lowercase'
  ) {
    return message.toLowerCase();
  }

  return message;
};

const greet = function (name, language, transformTo) {
  let greeting = languages[language];
  if (greeting === undefined) {
    greeting = 'O hai der {name}!';
  }
  const message = interpolate(greeting, { name: name });
  return transform(message, transformTo);
};

const sayHello = (call, callback) => {
  console.info(
    '[sayHello REQUEST]:' +
      JSON.stringify(call.request) +
      ' | ' +
      JSON.stringify(call.metadata.get('transform')),
  );
  const d = new Date();
  const seconds = Math.round(d.getTime() / 1000);
  const transformMeta = call.metadata.get('transform');
  const transformTo = transformMeta[0] || 'nothing';
  const reply = {
    greeting: greet(
      call.request.name,
      call.request.language,
      transformTo,
    ),
    timestamp: { seconds: seconds },
  };
  console.info(
    '[sayHello REPLY](transform: ' +
      transformTo +
      '):' +
      JSON.stringify(reply),
  );
  callback(null, reply);
};

const sayHelloInMultipleLanguages = (call, callback) => {
  console.info(
    '[sayHelloMultipleLanguages REQUEST]: ' +
      JSON.stringify(call.request) +
      ' | ' +
      JSON.stringify(call.metadata.get('transform')),
  );
  const d = new Date();
  const seconds = Math.round(d.getTime() / 1000);
  const reply = { greetings: [], timestamp: { seconds: seconds } };
  const transformMeta = call.metadata.get('transform');
  const transformTo = transformMeta[0] || 'nothing';
  call.request.languages.forEach(function (language) {
    const greeting = greet(call.request.name, language, transformTo);
    reply.greetings.push(greeting);
  });
  console.info(
    '[sayHelloMultipleLanguages REPLY]:' + JSON.stringify(reply),
  );
  callback(null, reply);
};

const saySomethingElse = (call, callback) => {
  console.info(
    '[saySomethingElse REQUEST]:' +
      JSON.stringify(call.request) +
      ' | ' +
      JSON.stringify(call.metadata.get('transform')),
  );
  const transformMeta = call.metadata.get('transform');
  const transformTo = transformMeta[0] || 'nothing';
  const reply = { somethingElse: 'something else' };
  console.info(
    '[saySomethingElse REPLY](transform: ' +
      transformTo +
      '):' +
      JSON.stringify(reply),
  );
  callback(null, reply);
};

const errorOut = (call, callback) => {
  console.info('[errorOut REQUEST]');
  return callback({
    message: 'invalid',
    code: grpc.status.INVALID_ARGUMENT,
  });
};

const checkTypes = (call, callback) => {
  console.info('[checkTypes REQUEST]');
  const reply = {
    number: 1,
    string: 'string',
    boolean: true,
    array: [1, 2],
  };
  console.info('[checkTypes REPLY]:' + JSON.stringify(reply));
  return callback(null, reply);
};

const healthCheckStatusMap = {
  serviceName: HealthCheckResponse.ServingStatus.UNKNOWN,
};

const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
grpcHealthCheck.setStatus(
  serviceName,
  HealthCheckResponse.ServingStatus.SERVING,
);

const server = new grpc.Server();

const credentials = grpc.ServerCredentials.createInsecure();
const methods = {
  sayHello: sayHello,
  sayHelloInMultipleLanguages: sayHelloInMultipleLanguages,
  saySomethingElse: saySomethingElse,
  errorOut: errorOut,
  checkTypes: checkTypes,
};

const port = process.env.SERVER_PORT || 8443;

server.addService(helloProto, methods);
server.addService(HealthService, grpcHealthCheck);

const returnValue = server.bind(`0.0.0.0:${port}`, credentials);
if (returnValue == 0) {
  console.error('Failed to start GRPC server at port', port);
  process.exit(1);
}

server.start();
console.info('GRPC server started at port', port);
