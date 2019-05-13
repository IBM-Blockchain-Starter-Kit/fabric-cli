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

import * as FabricClient from 'fabric-client';
import * as path from 'path';
import { inspect } from 'util';
import FabricHelper from './FabricHelper';
const logger = FabricHelper.getLogger('invoke-chaincode');

interface ResponseObject {
    status: number;
    message: string;
    payload: string;
}

export async function invokeChaincode(
    networkConfigFilePath: string,
    channelName: string,
    chaincodeName: string,
    functionName: string,
    args: string[],
    org: string,
    queryOnly: boolean,
    timeout: number,
    cryptoDir: string
): Promise<ResponseObject> {
    logger.debug(
        `Invoking method (${functionName}) on chaincode (${chaincodeName}) with arguments (${args})`
    );

    let response: ResponseObject;
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
        args,
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

    if (!queryOnly) {
        logger.info('Sending transaction to orderer...');

        await sendChaincodeInvokeProposal(
            channel,
            tx_id.getTransactionID(),
            proposalResponses as [
                FabricClient.ProposalResponse[],
                FabricClient.Proposal
            ],
            timeout
        );
    }

    response = getResponseFromProposalResponseObject(proposalResponses);

    logger.info('Successfully sent transaction to the orderer');
    logger.info(`Transaction response:\n ${inspect(response)}`);
    return response;
}

function getResponseFromProposalResponseObject(
    proposalResponses: FabricClient.ProposalResponseObject
): ResponseObject {
    const responses = proposalResponses[0] as FabricClient.ProposalResponse[];
    return {
        status: responses[0].response.status,
        message: responses[0].response.message,
        payload: responses[0].response.payload.toString()
    };
}

async function sendChaincodeInvokeProposal(
    channel: FabricClient.Channel,
    transactionId: string,
    proposalResult: [FabricClient.ProposalResponse[], FabricClient.Proposal],
    timeout: number
) {
    const listenForTxEvent = FabricHelper.registerAndConnectTxEventHub(
        channel,
        transactionId
    );

    const proposalResponses = proposalResult[0];
    const proposal = proposalResult[1];

    const request: FabricClient.TransactionRequest = {
        proposalResponses,
        proposal
    };
    const broadcastResponse = await channel.sendTransaction(request, timeout);

    FabricHelper.inspectBroadcastResponse(broadcastResponse);

    logger.debug(`Waiting for transaction commit event...`);

    await listenForTxEvent;
}
