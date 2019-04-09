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
import { format, inspect } from 'util';

const logger = FabricHelper.getLogger('install-chaincode');

export async function installChaincode(
    networkConfigFilePath,
    channelName,
    chaincodeName,
    chaincodePath,
    chaincodeVersion,
    org,
    cryptoDir
) {
    logger.debug(
        '\n============ Install chaincode on organizations ============\n'
    );

    const helper: FabricHelper = new FabricHelper(
        networkConfigFilePath,
        channelName,
        path.join(process.env.HOME, 'fabric-client-kvs'),
        cryptoDir
    );

    const channel = helper.getChannelForOrg(org);
    const client = helper.getClientForOrg(org);

    const user: FabricClient.User = await helper.getOrgAdmin(org);

    logger.debug(`\n Successfully retrieved admin user: ${user}`);

    // Need to convert targets from ChannelPeer to Peer
    const installTargets = channel.getPeers().map((peer) => peer.getPeer());

    const request: FabricClient.ChaincodeInstallRequest = {
        targets: installTargets,
        chaincodePath: chaincodePath,
        chaincodeId: chaincodeName,
        chaincodeVersion: chaincodeVersion
    };

    logger.debug(
        `\n Calling client.installChaincode with request: ${inspect(request)}\n`
    );

    let results: [
        (FabricClient.ProposalResponse | Error)[],
        FabricClient.Proposal
    ];

    try {
        results = await client.installChaincode(request);
    } catch (err) {
        logger.error(
            `Failed to send install proposal due to error: ` + err.stack
                ? err.stack
                : err
        );
        throw new Error(
            `Failed to send install proposal due to error: ` + err.stack
                ? err.stack
                : err
        );
    }

    const responses: (FabricClient.ProposalResponse | Error)[] = results[0];

    const errorsFound = responses.filter(
        (response) => response instanceof Error
    ) as Error[];

    // When any of the responses are errors
    if (errorsFound.length > 0) {
        logger.error(
            `Failed to send install Proposal or receive valid response: ${
                errorsFound[0].message
            }`
        );
        throw new Error(
            `Failed to send install Proposal or receive valid response: ${
                errorsFound[0].message
            }`
        );
    }

    // For TS, need to cast all elements to ProposalResponses. We know all are at this point
    const proposalResponses = responses as FabricClient.ProposalResponse[];

    const badResponsesFound = proposalResponses.filter(
        (response) => response.response && response.response.status !== 200
    );

    if (badResponsesFound.length > 0) {
        logger.error(
            `Response null or has a status not equal to 200: ${inspect(
                badResponsesFound[0]
            )}`
        );
        throw new Error(
            `Response null or has a status not equal to 200: ${inspect(
                badResponsesFound[0]
            )}`
        );
    }

    logger.info(
        format(
            'Successfully sent install Proposal and received ProposalResponse: Status - %s',
            proposalResponses[0].response.status
        )
    );

    // For formatting returned message
    const peerNames: string = channel
        .getPeers()
        .map((peer) => peer.getName())
        .join(',');

    logger.debug(
        `Successfully installed chaincode on peers (${peerNames}) for organization ${org}`
    );
}
