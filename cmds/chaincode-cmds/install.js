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

'use strict';

const fs = require('fs');
const hfc = require('fabric-client');
const path = require('path');
const installLib = require('../../lib/install-chaincode.js')

exports.command = 'install';
exports.desc = 'Install chaincode';
exports.builder = function (yargs) {
    return yargs.option('cc-name', {
        demandOption: true,
        describe: 'Name for the chaincode to install',
        requiresArg: true,
        type: 'string'
    }).option('cc-version', {
        demandOption: true,
        describe: 'The version that will be assigned to the chaincode to install',
        requiresArg: true,
        type: 'string'
    }).option('channel', {
        demandOption: true,
        describe: 'Name of the channel to install chaincode',
        requiresArg: true,
        type: 'string'
    }).option('src-dir', { 
        demandOption: true,
        describe:'Relative path where the chaincode is located with respect to GOPATH/src ',
        requiresArg: true,
        type: 'string'
    }).check(function(argv){
        if(!process.env.GOPATH) 
        {
            throw (new Error ('GOPATH environment is not set. Environment setting required to deploy chaincode'));
        }
        let absolutePathChaincode = path.join(process.env.GOPATH, 'src',  argv['src-dir']);
        if (! fs.existsSync(absolutePathChaincode)){
            throw(new Error('Could not find absolute path for chaincode based on GOPATH variable and --src-dir argument.  Absolute path built: ' + absolutePathChaincode));
        } 

        return true;
    });
};

exports.handler = function (argv) {

    //Install chaincode depends on the GOPATH environmet variable
    //let's make sure it is there
    if(!process.env.GOPATH) 
    {
        throw (new Error ('GOPATH environment variable must be in order to run this command.'));
    }

    //let's get peers from config file
    console.log("Installing chaincode");
    return installLib.installChaincode(argv['net-config'], argv['channel'], argv['cc-name'], argv['src-dir'], argv['cc-version'], argv['org'], argv["crypto-dir"]);
};