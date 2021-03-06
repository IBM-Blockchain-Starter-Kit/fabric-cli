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
import { Gateway } from 'fabric-network';

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

    try{

        const gateway: Gateway = await helper.getGateway();
        if (!gateway) {
            throw `Gateway object for org '${orgName}' is undefined, null, or empty`
        }

        const client: FabricClient = gateway.getClient();
        if (!client) {
            throw `Client object for org '${orgName}' is undefined, null, or empty`
        }
        const user: FabricClient.User = await helper.getOrgAdmin(orgName, credentialFilePath);
        if (!user) {
            throw `User object for org '${orgName}' is undefined, null, or empty`
        }
        const installTargetPeers: FabricClient.Peer[] = client.getPeersForOrg(orgName);
        if (!installTargetPeers) {
            throw `Target peers not found for org ${orgName}`
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


        const peerNames = FabricHelper.getPeerNamesAsString(installTargetPeers)

        logger.info(
            `Successfully installed chaincode (${chaincodeName}) on peers (${peerNames}) for organization ${orgName}`
        );
    }
    catch(err){
        logger.error(`Installation failed with org '${orgName}'.  Error: ${err.message}`);
        throw new Error(err)
    }
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
        const errMessage = `Failed to send install proposal due to ${err}`
        logger.error(errMessage);
        throw new Error(errMessage);
    }

    return proposalResponses;
}
