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

'use strict';

import * as fs from 'fs-extra';
import * as FabricClient from 'fabric-client';

export const command: string = 'chaincode <command>';
export const desc: string = 'Install, instantiate and update chaincode';

export function builder(yargs): any {
    return yargs
        .commandDir('chaincode-cmds')
        .option('conn-profile', {
            demandOption: true,
            describe:
                'Absolute path for connection profile file based on  FAB-5363 format',
            type: 'string'
        })
        .check(function(argv) {
            //validate file exists
            if (!fs.existsSync(argv['conn-profile'])) {
                throw new Error(
                    'Invalid --conn-profile argument.  File does not exist: ' +
                        argv['conn-profile']
                );
            }
            //validate file format
            let connProfile = require(argv['conn-profile']);
            if (!connProfile.hasOwnProperty('organizations') &&
                !connProfile.hasOwnProperty('client') &&
                !connProfile.hasOwnProperty('certificateAuthorities')) {
                throw new Error(
                    'Invalid --conn-profile argument. Invalid format.'
                );
            }
            return true;
        })
        .option('org', {
            demandOption: true,
            describe:
                'Name of org stanza in the network-config file that contains the peers where the chaincode should be installed',
            requiresArg: true,
            type: 'string'
        })
        .check(function(argv) {
            //get the network configuration file.  by now this has already been validated that it exists
            FabricClient.addConfigFile(argv['conn-profile']);
            //make sure the org specified is in the network-config file
            let orgs = FabricClient.getConfigSetting('organizations');
            if (!orgs[argv.org]) {
                throw new Error(
                    "Invalid --org argument. Organization '" +
                        argv.org +
                        "' not found in connection-profile file."
                );
            }
            return true;
        })
        .option('org-credentials', {
            demandOption: true,
            describe:
                'Absolute path for exported admin identity',
            type: 'string'
        })
        .check(function(argv) {
            if (!fs.existsSync(argv['org-credentials'])) {
                throw new Error(
                    'Invalid --org-credentials argument.  Directory does not exist: ' +
                        argv['org-credentials']
                );
            }
            return true;
        });
}

export function handler(argv) {
    console.log('####### calling handler ########');
}
