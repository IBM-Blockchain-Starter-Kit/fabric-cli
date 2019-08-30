/*
Copyright IBM Corp. 2019 All Rights Reserved.
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

import { instantiateChaincode } from '../../lib/instantiate-chaincode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from 'log4js';

export const command: string = 'instantiate';
export const desc: string = 'Instantiate chaincode';
export function builder(yargs) {
    return yargs
        .option('cc-name', {
            demandOption: true,
            describe: 'Name for the chaincode to instantiate',
            requiresArg: true,
            type: 'string'
        })
        .option('cc-version', {
            demandOption: true,
            describe: 'The version of chaincode to instantiate',
            requiresArg: true,
            type: 'string'
        })
        .option('cc-type', {
            demandOption: false,
            describe: 'The langauge in which your chaincode is written',
            choices: ['golang', 'java', 'node'],
            type: 'string',
            default: "golang"
        })
        .option('channel', {
            demandOption: true,
            describe: 'Name of the channel to instantiate chaincode',
            requiresArg: true,
            type: 'string'
        })
        .option('init-fn', {
            demandOption: false,
            describe: 'Function to call on instantiation call.',
            requiresArg: false,
            type: 'string',
            default: ''
        })
        .option('init-args', {
            array: true,
            demandOption: false,
            describe: 'Value(s) to pass as argument to instantiation call.',
            requiresArg: false,
            type: 'string',
            default: []
        })
        .option('timeout', {
            demandOption: false,
            describe:
                'Specify number of milliseconds to wait on the response before rejecting.',
            requiresArg: true,
            type: 'number',
            default: 120000
        })
        .option('endorsement-policy', {
            demandOption: false,
            describe:
                'The endorsement policy for the chaincode (this is an optional parameter).',
            requiresArg: true,
            type: 'string',
            default: null
        })
        .option('admin-identity', {
            demandOption: true,
            describe:
                'Absolute path to where the user credentials are located',
            requiresArg: true,
            type: 'string'
        })
        .option('collections-config', {
            demandOption: false,
            describe:
                'Absolute path to where the collections-config file is located',
            requiresArg: true,
            type: 'string',
            default: null
        })
        // in case cc-type is golang, default init-fn is "Init"
        // .check(function(argv) {
        //     var cc_type = argv['cc-type'];
        //     var init_fn = argv['init-fn'];
        //     if (cc_type == "golang" && !init_fn) {
        //         argv['init-fn'] = "Init";
        //     }
        //     console.log(
        //         `init-function passed in for platform ${argv['cc-type']} is... ${argv['init-fn']}`
        //     );
        //     return true;
        // })
        .check(function(argv) {
            //validate endorsement policy (i.e. validate it is JSON)
            var endorsementPolicy = argv['endorsement-policy'];
            try {
                JSON.parse(endorsementPolicy);
                return true;
            } catch (err) {
                console.log(
                    'Failed to parse as JSON provided endorsementPolicy: ' + err
                );
                throw new Error(
                    'Invalid --endorsement-policy argument. It was not a valid JSON.'
                );
            }
        })
        .check(function(argv) {
            if (!argv['collections-config']) {
              return true;
            }
            //validate endorsement policy (i.e. validate it is JSON)
            var collectionsConfigPath = argv['collections-config']
            var collectionsConfig = fs.readFileSync(collectionsConfigPath);
            try {
                JSON.parse(collectionsConfig.toString());
                return true;
            } catch (err) {
                console.log(
                    'Failed to parse as JSON provided collectionsConfig: ' + err
                );
                throw new Error(
                    'Invalid --collections-config argument. It was not a valid JSON.'
                );
            }
        });
}

export async function handler(argv) {
    console.log('Instantiating chaincode');
    return await instantiateChaincode(
        argv['conn-profile'],
        argv['channel'],
        argv['cc-name'],
        argv['cc-version'],
        argv['init-fn'],
        argv['init-args'],
        argv['org'],
        argv['timeout'],
        argv['endorsement-policy'],
        argv['cc-type'],
        argv['admin-identity'],
        argv['collections-config']
    );
}
