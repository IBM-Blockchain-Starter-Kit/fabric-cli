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

import * as fs from 'fs';
import * as path from 'path';
import { installChaincode } from '../../lib/install-chaincode';

export const command: string = 'install';
export const desc: string = 'Install chaincode';

export function builder(yargs) {
    return yargs
        .option('cc-name', {
            demandOption: true,
            describe: 'Name for the chaincode to install',
            requiresArg: true,
            type: 'string'
        })
        .option('cc-version', {
            demandOption: true,
            describe:
                'The version that will be assigned to the chaincode to install',
            requiresArg: true,
            type: 'string'
        })
        .option('cc-type', {
            demandOption: false,
            describe:
                'The langauge in which your chaincode is written, default=golang.',
            choices: ['golang', 'java', 'node'],
            type: 'string'
        })
        .option('src-dir', {
            demandOption: true,
            describe:
                'Relative path to where the chaincode directory is located (for golang this is with respect to GOPATH/src)',
            requiresArg: true,
            type: 'string'
        })
        .option('channel', {
            demandOption: true,
            describe: 'Name of the channel to install chaincode',
            requiresArg: true,
            type: 'string'
        })
        .option('org-credentials', {
            demandOption: true,
            describe:
                'Relative path to where the user credentials are located (for golang this is with respect to GOPATH/src)',
            requiresArg: true,
            type: 'string'
        })
        .check(function(argv) {
            if (!argv['cc-type'] || argv['cc-type'] === 'golang') {
                if (!process.env.GOPATH) {
                    throw new Error(
                        'GOPATH environment is not set. Environment setting required to deploy chaincode'
                    );
                }
                let absolutePathChaincode = path.join(
                    process.env.GOPATH,
                    'src',
                    argv['src-dir']
                );

                if (!fs.existsSync(absolutePathChaincode)) {
                    throw new Error(
                        'Could not find absolute path for chaincode based on GOPATH variable and --src-dir argument.  Absolute path built: ' +
                            absolutePathChaincode
                    );
                }
            }

            return true;
        });
        
}

export async function handler(argv): Promise<void> {
    if (
        (!argv['cc-type'] || argv['cc-type'] === 'golang') &&
        !process.env.GOPATH
    ) {
        throw new Error(
            'GOPATH environment variable must be defined in order to run this command.'
        );
    }

    console.log('Installing chaincode');
    return await installChaincode(
        argv['conn-profile'],
        argv['channel'],
        argv['cc-name'],
        argv['src-dir'],
        argv['cc-version'],
        argv['org'],
        argv['cc-type'],
        argv['org-credentials']
    );
}
