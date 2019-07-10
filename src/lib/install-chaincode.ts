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
import { DEFAULT_CHAINCODE_TYPE } from './constants';

const logger = FabricHelper.getLogger('install-chaincode');

export async function installChaincode(
    connectionProfilePath: string,
    channelName: string,
    chaincodeName: string,
    chaincodePath: string,
    chaincodeVersion: string,
    orgName: string,
    chaincodeType: FabricClient.ChaincodeType = DEFAULT_CHAINCODE_TYPE,
    credentialFilePath: string
): Promise<void> {
    logger.debug(
        `============ Install chaincode called for organization: ${orgName} ============`
    );

    let installProposalResponses: [
        (FabricClient.ProposalResponse | Error)[],
        FabricClient.Proposal
    ];

    const helper: FabricHelper = new FabricHelper(
        connectionProfilePath,
        channelName,
        path.join(process.env.HOME, 'fabric-client-kvs'),
        orgName,
        credentialFilePath
    );

    const gateway = await helper.getGateway();
    if (!gateway) {          
        logger.error('gateway not found..');
        return
    }
    if (gateway == null || gateway == undefined) {
        logger.error('invalid gateway object')
    }

    const client = gateway.getClient();
    if (client == null || client == undefined) {
        throw 'Client is not defined'
    }
    const user: FabricClient.User = await helper.getOrgAdmin(orgName, credentialFilePath);
    if (user == null || user == undefined) {
        throw 'User is not defined'
    }
    const installTargetPeers = client.getPeersForOrg(orgName);
    if (installTargetPeers == null || installTargetPeers.length === 0) {
        throw 'Target peers not found'
    }

    logger.debug(`Successfully retrieved admin user: ${user}`);

    const request: FabricClient.ChaincodeInstallRequest = {
        targets: installTargetPeers,
        chaincodePath: chaincodePath,
        chaincodeId: chaincodeName,
        chaincodeVersion: chaincodeVersion,
        chaincodeType: chaincodeType
    };

    logger.debug(
        `Calling client.installChaincode with request: ${inspect(request)}`
    );

    try {
        installProposalResponses = await installChaincodeOnPeersInRequest(
            client,
            request
        );
    } catch (err) {
        throw err;
    }

    FabricHelper.inspectProposalResponses(installProposalResponses);


    // const peerNames: string = FabricHelper.getPeerNamesAsStringForChannel(
    //     channel
    // );

    //installTargetPeers is  printing entire payload -- simply print peer names
    logger.info(
        `Successfully installed chaincode (${chaincodeName}) on peers (${installTargetPeers}) for organization ${orgName}`
    );
}

async function installChaincodeOnPeersInRequest(
    client: FabricClient,
    request: FabricClient.ChaincodeInstallRequest
): Promise<[(FabricClient.ProposalResponse | Error)[], FabricClient.Proposal]> {
    let proposalResponses: [
        (FabricClient.ProposalResponse | Error)[],
        FabricClient.Proposal
    ];

    try {
        logger.debug(
            `calling FabricClient.installchaincode with request: ${inspect(
                request
            )}`
        );
        proposalResponses = await client.installChaincode(request);
    } catch (err) {
        const errMessage = `Failed to send install proposal due to error: ${err}`
        logger.error(errMessage);
        throw new Error(errMessage);
    }

    return proposalResponses;
}
