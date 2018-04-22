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
const instantiateLib = require("../../lib/instantiate-chaincode.js");

// https://devhints.io/yargs
exports.command = "instantiate";
exports.desc = "Instantiate chaincode";
exports.builder = function(yargs) {
  return yargs
    .option("cc-name", {
      demandOption: true,
      describe: "Name for the chaincode to instantiate",
      requiresArg: true,
      type: "string"
    })
    .option("cc-version", {
      demandOption: true,
      describe: "The version of chaincode to instantiate",
      requiresArg: true,
      type: "string"
    })
    .option("channel", {
      demandOption: true,
      describe: "Name of the channel to instantiate chaincode",
      requiresArg: true,
      type: "string"
    })
    .option("init-arg", {
      array: true,
      demandOption: false,
      describe: "Value(s) to pass as argument to instantiation call.",
      requiresArg: false,
      type: "string",
      default: []
    })
    .option("timeout", {
      demandOption: false,
      describe:
        "Specify number of milliseconds to wait on the response before rejecting.",
      requiresArg: true,
      type: "number",
      default: 120000
    })
    .option("endorsement-policy", {
      demandOption: false,
      describe:
        "The endorsement policy for the chaincode (this is an optional parameter).",
      requiresArg: true,
      type: "string",
      default: null
    });
};

//TODO: parse policy here to validate it is JSON???
exports.handler = function(argv) {
  //let's get peers from config file
  console.log("Instantiating chaincode");
  return instantiateLib.instantiateChaincode(
    argv["net-config"],
    argv["channel"],
    argv["cc-name"],
    argv["cc-version"],
    argv["init-arg"],
    null,
    argv["org"],
    argv["timeout"],
    argv["endorsement-policy"]
  );
};
