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
                'The language in which your chaincode is written, default=golang.',
            choices: ['golang', 'java', 'node'],
            type: 'string'
        })
        .option('src-dir', {
            demandOption: true,
            describe:
                'Path where the chaincode directory is located (for golang this is a relative folder with respect to GOPATH/src)',
            requiresArg: true,
            type: 'string'
        })
        .option('admin-identity', {
            demandOption: true,
            describe:
                'Absolute path to where the user credentials are located',
            requiresArg: true,
            type: 'string'
        })
        .check(function(argv) {

            // Normalize path to chaincode folder
            argv['src-dir'] = path.normalize(argv['src-dir']);

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
    return await installChaincode(
        argv['conn-profile'],
        argv['channel'],
        argv['cc-name'],
        argv['src-dir'],
        argv['cc-version'],
        argv['org'],
        argv['cc-type'],
        argv['admin-identity']
    );
}
