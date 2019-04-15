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
import * as fs from 'fs-extra';
import FabricHelper from './FabricHelper';
import * as FabricClient from 'fabric-client';
import { inspect } from 'util';

const logger = FabricHelper.getLogger('instantiate-chaincode');

export async function instantiateChaincode(
    networkConfigFilePath: string,
    channelName: string,
    chaincodeName: string,
    chaincodeVersion: number,
    args: string[],
    functionName: string,
    org: string,
    timeout: number,
    endorsementPolicy: any,
    cryptoDir: string
): Promise<void> {
    logger.debug(
        `============ Deploying smart contract to all Peers on Channel ${chaincodeName} for organization ${org} ============`
    );

    let tx_id: FabricClient.TransactionId = null;
    const chaincodeType: FabricClient.ChaincodeType = 'golang';

    const helper = new FabricHelper(
        networkConfigFilePath,
        channelName,
        path.join(process.env.HOME, 'fabric-client-kvs'),
        cryptoDir
    );
    const channel = helper.getChannelForOrg(org);
    const client = helper.getClientForOrg(org);
    const user = await helper.getOrgAdmin(org);
    const peerNames: string = helper.getPeerNamesAsStringForChannel(channel);

    // turn on service discovery so when we call getPeer(), we get an upto date peer

    const { upgrade, versionToDeploy } = await checkIsUpgradeAndGetVersion(
        channel,
        channel.getPeers()[0].getName(),
        chaincodeName
    );

    // Override deployment version if one is given.
    if (!chaincodeVersion) chaincodeVersion = versionToDeploy;

    await channel.initialize();

    tx_id = client.newTransactionID();

    logger.info(
        `Attempting to deploy ${chaincodeName} version: ${chaincodeVersion} to Peers (${peerNames} for organization ${org})`
    );

    const deploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest = buildDeploymentOptions(
        chaincodeType,
        chaincodeName,
        chaincodeVersion,
        tx_id,
        functionName,
        endorsementPolicy,
        args
    );

    await deployChaincode(channel, deploymentOptions, upgrade, helper, timeout);

    logger.info(
        `Successfully installed deployed ${chaincodeName}(Verion: ${chaincodeVersion}) on peers (${peerNames}) for organization ${org}`
    );
}

function buildDeploymentOptions(
    chaincodeType: FabricClient.ChaincodeType,
    chaincodeName: string,
    chaincodeVersion: number,
    tx_id: FabricClient.TransactionId,
    functionName: string,
    endorsementPolicy: string,
    args: string[]
): FabricClient.ChaincodeInstantiateUpgradeRequest {
    // Build Deployment Options
    const deploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest = {
        chaincodeType: chaincodeType,
        chaincodeId: chaincodeName,
        chaincodeVersion: chaincodeVersion.toString(),
        txId: tx_id
    };
    if (functionName) {
        deploymentOptions.fcn = functionName;
        logger.info('functionName: ' + functionName);
    }
    if (endorsementPolicy) {
        //TODO: Test that endorsement policy is actuall set on the channel
        //https://fabric-sdk-node.github.io/global.html#ChaincodeInstantiateUpgradeRequest
        deploymentOptions['endorsement-policy'] = JSON.parse(endorsementPolicy);
        logger.info('The endorsementPolicy value: ' + endorsementPolicy);
    }
    if (args) {
        deploymentOptions.args = args;
    }
    return deploymentOptions;
}

async function checkIsUpgradeAndGetVersion(
    channel: FabricClient.Channel,
    targetPeerName: string,
    chaincodeName: string
) {
    let isUpgrade: boolean = false;
    let newChaincodeVersion: number = 0;

    const instantiatedChaincode = await channel.queryInstantiatedChaincodes(
        targetPeerName
    );

    const chaincodes = instantiatedChaincode.chaincodes;
    console.log(`chaincode to install:${chaincodeName}`);
    for (let i = 0; i < chaincodes.length; i++) {
        console.log(
            `Chaincode is installed: ${chaincodes[i].name}, version: ${
                chaincodes[i].version
            }`
        );
        if (chaincodes[i].name === chaincodeName) {
            newChaincodeVersion = parseInt(chaincodes[i].version) + 1;
            // Update flag to indicate whether to instantiate or upgrade chaincode
            isUpgrade = true;
            break;
        }
    }

    return { upgrade: isUpgrade, versionToDeploy: newChaincodeVersion };
}

async function deployChaincode(
    channel: FabricClient.Channel,
    deploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest,
    upgrade: boolean,
    helper: FabricHelper,
    timeout: number
) {
    let proposalResponses = await helper.sendChaincodeProposalToPeers(
        channel,
        deploymentOptions,
        upgrade,
        timeout
    );

    helper.inspectProposalResponses(proposalResponses);

    helper.registerAndConnectTxEventHub(
        channel,
        deploymentOptions.txId.getTransactionID()
    );

    const request = {
        txId: deploymentOptions.txId,
        proposalResponses: proposalResponses[0] as FabricClient.ProposalResponse[],
        proposal: proposalResponses[1]
    };

    logger.debug(`Calling sendTransaction() with request: ${inspect(request)}`);

    await channel.sendTransaction(request);
}
