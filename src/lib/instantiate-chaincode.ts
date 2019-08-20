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
import { DEFAULT_CHAINCODE_TYPE } from './constants';
import FabricHelper from './FabricHelper';
import { Gateway, Network } from 'fabric-network';
import * as fs from 'fs';
import { existsTypeAnnotation } from '@babel/types';

const logger = FabricHelper.getLogger('instantiate-chaincode');

export async function instantiateChaincode(
    connectionProfilePath: string,
    channelName: string,
    chaincodeName: string,
    chaincodeVersion: number,
    functionName: string,
    args: string[],
    orgName: string,
    timeout: number,
    endorsementPolicy: any,
    chaincodeType: FabricClient.ChaincodeType = DEFAULT_CHAINCODE_TYPE,
    credentialFilePath: string,
    collectionsConfigFilePath: string
): Promise<void> {
    logger.debug(
        `============ Deploying smart contract to all Peers on Channel ${chaincodeName} for organization ${orgName} ============`
    );

    let tx_id: FabricClient.TransactionId = null;

    const helper = new FabricHelper(
        connectionProfilePath,
        channelName,
        path.join(process.env.HOME, 'fabric-client-kvs'),
        orgName,
        credentialFilePath
    );

    try {
        let gateway: Gateway = await helper.getGateway();
        if (!gateway) {
            throw `Gateway object for org '${orgName}' is undefined, null, or empty`
        }
        let network : Network = await gateway.getNetwork(channelName);
        if (!network) {
            throw `Network object for org '${orgName}' and channel '${channelName} 'is undefined, null, or empty`
        }
        const client: FabricClient = gateway.getClient();
        if (!client) {
            throw `Client object for org '${orgName}' is undefined, null, or empty`
        }
        const channel: FabricClient.Channel = network.getChannel();
        if (!channel) {
            throw `Channel object for org '${orgName}' is undefined, null, or empty`
        }
        const user: FabricClient.User = await helper.getOrgAdmin(orgName, credentialFilePath);
        if (!user) {
            throw `User object for org '${orgName}' is undefined, null, or empty`
        }

        logger.debug(`Successfully retrieved admin user: ${user}`);

        const peerNames = FabricHelper.getPeerNamesAsString(client.getPeersForOrg(orgName))

        // TODO: turn on service discovery so when we call getPeer(), we get an upto date peer]

        const { upgrade, versionToDeploy } = await checkIsUpgradeAndGetVersion(
            channel,
            channel.getPeers()[0].getName(),
            chaincodeName,
            chaincodeVersion
        );

        // Override deployment version if one is given. Not yet supported as command line param is currently required.
        if (upgrade) {
            if (versionToDeploy == null) {
                throw 'Version to deploy is not valid'
            }
            chaincodeVersion = versionToDeploy;
        }


        await channel.initialize();

        tx_id = client.newTransactionID();

        logger.info(
            `Attempting to deploy ${chaincodeName} version: ${chaincodeVersion} to channel (${channelName}) (on peers: ${peerNames})`
        );

        const deploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest = buildDeploymentOptions(
            chaincodeType,
            chaincodeName,
            chaincodeVersion,
            tx_id,
            functionName,
            endorsementPolicy,
            args,
            collectionsConfigFilePath
        );

        await deployChaincode(channel, deploymentOptions, upgrade, timeout);

        logger.info(
            `Successfully deployed ${chaincodeName} version: ${chaincodeVersion} to channel (${channelName}) (on peers: ${client.getPeersForOrg(orgName)})`
        );
    }
    catch(err) {
        logger.error(`Instantiation failed with org '${orgName}', channel '${channelName}'.  Error: ${err.message}`);
        throw (err);
    }
}

function buildDeploymentOptions(
    chaincodeType: FabricClient.ChaincodeType,
    chaincodeName: string,
    chaincodeVersion: number,
    tx_id: FabricClient.TransactionId,
    functionName: string,
    endorsementPolicy: string,
    args: string[],
    collectionsConfigFilePath: string,

): FabricClient.ChaincodeInstantiateUpgradeRequest {
    const deploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest = {
        chaincodeType,
        chaincodeId: chaincodeName,
        chaincodeVersion: chaincodeVersion.toString(),
        txId: tx_id
    };
    if (functionName) {
        deploymentOptions.fcn = functionName;
        logger.info('functionName: ' + functionName);
    }
    if (endorsementPolicy) {
        // TODO: Test that endorsement policy is actuall set on the channel
        deploymentOptions['endorsement-policy'] = JSON.parse(endorsementPolicy);
        logger.info('The endorsementPolicy value: ' + endorsementPolicy);
    }
    if (collectionsConfigFilePath) {
        const collectionsConfig = fs.readFileSync(collectionsConfigFilePath).toString();
        deploymentOptions['collections-config'] = JSON.parse(collectionsConfig);
        logger.info('The endorsementPolicy value: ' + collectionsConfig);
    }
    if (args) {
        deploymentOptions.args = args;
    }
    return deploymentOptions;
}

async function checkIsUpgradeAndGetVersion(
    channel: FabricClient.Channel,
    targetPeerName: string,
    chaincodeName: string,
    chaincodeVersion: number
) {
    let isUpgrade: boolean = false;
    let newChaincodeVersion: number = 0;

    const instantiatedChaincode = await channel.queryInstantiatedChaincodes(
        targetPeerName
    );

    const chaincodes = instantiatedChaincode.chaincodes;
    logger.debug(
        `Querying channel for instantiated chaincodes with name:${chaincodeName}`
    );
    for (let i = 0; i < chaincodes.length; i++) {
        logger.debug(
            `Found instantiated chaincode: ${chaincodes[i].name}, version: ${chaincodes[i].version}`
        );
        if (chaincodes[i].name === chaincodeName) {
            if(parseInt(chaincodes[i].version) == chaincodeVersion) {
                throw new Error(`Instantiation failed as chaincode ${chaincodeName}:${chaincodeVersion} is already instantiated on ${channel.getName()}`);
            } 
            isUpgrade = true;                        
            logger.info(
                `Found instantiated chaincode with same name (${chaincodeName})... upgrading to version ${chaincodeVersion}`
            );       
        }
    }

    return { upgrade: isUpgrade, versionToDeploy: chaincodeVersion };
}

async function deployChaincode(
    channel: FabricClient.Channel,
    deploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest,
    upgrade: boolean,
    timeout: number
) {
    const proposalResponses = await FabricHelper.sendChaincodeProposalToPeers(
        channel,
        deploymentOptions,
        upgrade,
        timeout
    );

    FabricHelper.inspectProposalResponses(proposalResponses);

    const listenForTxEvent = FabricHelper.registerAndConnectTxEventHub(
        channel,
        deploymentOptions.txId.getTransactionID()
    );

    const request: FabricClient.TransactionRequest = {
        txId: deploymentOptions.txId,
        proposalResponses: proposalResponses[0] as FabricClient.ProposalResponse[],
        proposal: proposalResponses[1]
    };

    logger.debug(`Calling sendTransaction() with request: ${inspect(request)}`);

    const broadcastResponse = await channel.sendTransaction(request, timeout);

    FabricHelper.inspectBroadcastResponse(broadcastResponse);

    logger.debug(`Waiting for transaction commit event...`);

    await listenForTxEvent;
}
