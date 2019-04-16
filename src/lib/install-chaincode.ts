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
import { DEFAULT_CHAINCODE_LANGUAGE } from './constants';

const logger = FabricHelper.getLogger('install-chaincode');

export async function installChaincode(
    networkConfigFilePath: string,
    channelName: string,
    chaincodeName: string,
    chaincodePath: string,
    chaincodeVersion: string,
    org: string,
    cryptoDir: string,
    chaincodeType: FabricClient.ChaincodeType = DEFAULT_CHAINCODE_LANGUAGE
): Promise<void> {
    logger.debug(
        `============ Install chaincode called for organization: ${org} ============`
    );

    let installProposalResponses: [
        (FabricClient.ProposalResponse | Error)[],
        FabricClient.Proposal
    ];

    const helper: FabricHelper = new FabricHelper(
        networkConfigFilePath,
        channelName,
        path.join(process.env.HOME, 'fabric-client-kvs'),
        cryptoDir
    );

    const channel = helper.getChannelForOrg(org);
    const client = helper.getClientForOrg(org);

    const user: FabricClient.User = await helper.getOrgAdmin(org);

    logger.debug(`Successfully retrieved admin user: ${user}`);

    // Need to convert targets from ChannelPeer to Peer
    const installTargets = channel.getPeers().map((peer) => peer.getPeer());

    const request: FabricClient.ChaincodeInstallRequest = {
        targets: installTargets,
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

    const peerNames: string = FabricHelper.getPeerNamesAsStringForChannel(
        channel
    );

    logger.info(
        `Successfully installed chaincode on peers (${peerNames}) for organization ${org}`
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
        proposalResponses = await client.installChaincode(request);
    } catch (err) {
        logger.error(`Failed to send install proposal due to error: ` + err);
        throw new Error(`Failed to send install proposal due to error: ` + err);
    }

    return proposalResponses;
}
