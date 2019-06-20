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

import { invokeChaincode } from '../../lib/invoke-chaincode';

export const command: string = 'invoke';
export const desc: string = 'Invoke a transaction to the chaincode';
export function builder(yargs) {
    return yargs
        .option('cc-name', {
            demandOption: true,
            describe: 'Name for the chaincode to invoke',
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
        .option('channel', {
            demandOption: true,
            describe: 'Name of the channel to invoke chaincode',
            requiresArg: true,
            type: 'string'
        })
        .option('invoke-fn', {
            demandOption: true,
            describe: 'Name of the transaction function to invoke in chaincode',
            requiresArg: true,
            type: 'string'
        })
        .option('invoke-args', {
            array: true,
            demandOption: false,
            describe:
                'Space separated list of arguments to pass into the transaction',
            requiresArg: false,
            type: 'string',
            default: []
        })
        .option('query', {
            demandOption: false,
            describe:
                'Specifies whether this transaction is just a query or should be submitted to the orderer',
            requiresArg: false,
            type: 'boolean',
            default: false
        })
        .option('timeout', {
            demandOption: false,
            describe:
                'Specify number of milliseconds to wait on the response before rejecting ',
            requiresArg: true,
            type: 'number',
            default: 120000
        });
}

export async function handler(argv) {
    console.log('Invoking transaction in chaincode');
    await invokeChaincode(
        argv['conn-profile'],
        argv['channel'],
        argv['cc-name'],
        argv['invoke-fn'],
        argv['invoke-args'],
        argv['org'],
        argv['query'],
        argv['timeout'],
        argv['admin-identity']
    );
}
