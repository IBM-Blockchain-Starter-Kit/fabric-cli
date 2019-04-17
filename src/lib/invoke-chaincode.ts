/**
 * Copyright 2019 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as path from 'path';
import FabricHelper from './FabricHelper';
import * as FabricClient from 'fabric-client';
import { inspect } from 'util';
const logger = FabricHelper.getLogger('invoke-chaincode');

export async function invokeChaincode(
    networkConfigFilePath: string,
    channelName: string,
    chaincodeName: string,
    args: string[],
    functionName: string,
    org: string,
    queryOnly: boolean,
    timeout: number,
    cryptoDir: string
): Promise<FabricClient.Response> {
    logger.debug(
        `Invoking method (${functionName}) on chaincode (${chaincodeName}) with arguments (${args})`
    );

    let proposalResponses: FabricClient.ProposalResponseObject;
    const fabricHelper = new FabricHelper(
        networkConfigFilePath,
        channelName,
        path.join(process.env.HOME, 'fabric-client-kvs'),
        cryptoDir
    );
    const channel = fabricHelper.getChannelForOrg(org);
    const client = fabricHelper.getClientForOrg(org);
    let tx_id: FabricClient.TransactionId = null;

    await fabricHelper.getOrgAdmin(org);

    await channel.initialize();

    tx_id = client.newTransactionID();

    const request: FabricClient.ChaincodeInvokeRequest = {
        chaincodeId: chaincodeName,
        args: args,
        txId: tx_id
    };

    if (functionName) {
        request.fcn = functionName;
    }

    logger.debug(
        `Sending transaction proposal with the following request: ${inspect(
            request
        )}`
    );

    try {
        proposalResponses = await channel.sendTransactionProposal(
            request,
            timeout
        );
    } catch (err) {
        logger.debug(`Failed to send transaction Proposal: ${err}`);
        throw err;
    }

    FabricHelper.inspectProposalResponses(proposalResponses);

    let response: FabricClient.Response;
    // Is this a query or a transaction to update the ledger?
    if (queryOnly) {
        logger.info(`Successfully queried ${chaincodeName}`);
        let responses = proposalResponses[0] as FabricClient.ProposalResponse[];
        response = {
            status: responses[0].response.status,
            message: responses[0].response.message,
            payload: responses[0].response.payload
        };

        return response;
    } else {
        logger.info('Proceeding with processing of invocation proposal.');

        // Commented out so the the project still builds.
        // TODO!
        // const transactionResult = fabricHelper.processChaincodeInvokeProposal(
        //     tx_id.getTransactionID(),
        //     proposalResponses,
        //     org
        // );
        // // We need get the payload back when we process the invoke and add it to the response object.
        // response = {
        //     status: transactionResult[0].status,
        //     message: transactionResult[0].info,
        //     payload: null
        // };

        if (response.status === 200) {
            logger.info('Successfully sent transaction to the orderer');
            return response;
        } else {
            var errorMsg =
                'Failed to complete the transaction or query the ledger. Error code: ' +
                response.status;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }
    }
    // .catch((err) => {
    //     logger.error('Failed to send invoke transaction: ' + err);
    //     throw new Error('Failed to invoke transaction: ' + err);
    // });
}
