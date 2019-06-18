/*
Copyright IBM Corp. 2017 All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
		 http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

"use strict";

const fs = require("fs");
const hfc = require("fabric-client");
const path = require("path");
const invokeLib = require("../../lib/invoke-chaincode.js");

exports.command = "invoke";
exports.desc = "Invoke a transaction in the chaincode";
exports.builder = function(yargs) {
  return yargs
    .option("cc-name", {
      demandOption: true,
      describe: "Name for the chaincode to invoke",
      requiresArg: true,
      type: "string"
    })
    .option("cc-version", {
      demandOption: true,
      describe: "The version of chaincode to invoke",
      requiresArg: true,
      type: "string"
    })
    .option("channel", {
      demandOption: true,
      describe: "Name of the channel to invoke chaincode",
      requiresArg: true,
      type: "string"
    })
    .option("invoke-fn", {
      demandOption: true,
      describe: "Name of the function to invoke in chaincode",
      requiresArg: true,
      type: "string"
    })
    .option("invoke-arg", {
      array: true,
      demandOption: false,
      describe: "Value(s) to pass as argument to invoke call.",
      requiresArg: false,
      type: "string",
      default: []
    })
    .option("query", {
      demandOption: false,
      describe: "Specify if this invocation is just a query to the ledger",
      requiresArg: false,
      type: "boolean",
      default: false
    })
    .option("timeout", {
      demandOption: false,
      describe:
        "Specify number of milliseconds to wait on the response before rejecting ",
      requiresArg: true,
      type: "number",
      default: 120000
    });
};

exports.handler = function(argv) {
  //let's get peers from config file
  console.log("Invoking transaction in chaincode");
  return invokeLib.invokeChaincode(
    argv["net-config"],
    argv["channel"],
    argv["cc-name"],
    argv["cc-version"],
    argv["invoke-arg"],
    argv["invoke-fn"],
    argv["org"],
    argv["query"],
    argv["timeout"],
    argv["crypto-dir"]
  );
};
