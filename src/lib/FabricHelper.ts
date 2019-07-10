/**
 * Copyright 2019 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as CaClient from 'fabric-ca-client';
import * as FabricClient from 'fabric-client';
import * as fs from 'fs-extra';
import * as log4js from 'log4js';
import { inspect } from 'util';
import { CreateGateway } from './CreateGateway';
import { Gateway } from 'fabric-network';
const walletHelper = require(`../helpers/wallet`);

const logger = log4js.getLogger('FabricHelper')

const LOGGING_LEVEL = process.env.LOGGING_LEVEL
    ? process.env.LOGGING_LEVEL
    : 'info';

logger.setLevel(LOGGING_LEVEL);
FabricClient.setLogger(logger);

export default class FabricHelper {

    public static getLogger(moduleName: string, loggingLevel: string = 'INFO') {
        const logger = log4js.getLogger(moduleName);
        logger.setLevel(loggingLevel);
        return logger;
    }
    public static inspectProposalResponses(
        proposalResult: [
            Array<FabricClient.ProposalResponse | Error>,
            FabricClient.Proposal
        ]
    ): void {
        const responses: Array<FabricClient.ProposalResponse | Error> =
            proposalResult[0];

        const errorsFound = responses.filter(
            (response) => response instanceof Error
        ) as Error[];

        if (errorsFound.length > 0) {
            logger.error(
                `Failed to send proposal or receive valid response: ${
                errorsFound[0].message
                }`
            );
            throw new Error(
                `Failed to send proposal or receive valid response: ${
                errorsFound[0].message
                }`
            );
        }
        //gitchange
        // For TS, need to cast all elements to ProposalResponses. We know all are at this point.
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
    }

    public static inspectBroadcastResponse(
        response: FabricClient.BroadcastResponse
    ): void {
        if (response.status !== 'SUCCESS') {
            logger.error(
                `sendTransaction returned with an invalid status code: ${
                response.status
                }: ${response.info}`
            );

            throw new Error(
                `sendTransaction returned with an invalid status code: ${
                response.status
                }: ${response.info}`
            );
        } else {
            logger.debug(
                `channel.sendTransaction() returned with status 'SUCCESS'`
            );
        }
    }

    //Kept for logging,

    // public static getPeerNamesAsStringForChannel(
    //     channel: FabricClient.Channel
    // ): string {
    //     const peerNames: string[] = [];
    //     for (const peer of channel.getPeers()) {
    //         peerNames.push(peer.getName());
    //     }

    //     return peerNames.join(',');
    // }

    public static registerAndConnectTxEventHub(
        channel: FabricClient.Channel,
        deployTxId: string
    ): Promise<void> {
        const peerName = channel.getPeers()[0].getName();
        const eventHub = channel.newChannelEventHub(peerName);

        return new Promise(function (resolve, reject) {
            eventHub.registerTxEvent(
                deployTxId,
                (txId, code) => {
                    if (code === 'VALID') {
                        logger.info(
                            `Transaction event received: transaction (${txId}) successful with status: ${code}`
                        );
                        resolve();
                    } else {
                        logger.error(
                            `Transaction event received: transaction (${txId}) failed with status: ${code}`
                        );

                        reject(
                            `Transaction event received: transaction (${txId}) failed with status: ${code}`
                        );
                    }
                },
                (err) => {
                    logger.error(
                        `Error whilst waiting for transaction event: ${inspect(
                            err
                        )}`
                    );
                    reject(err);
                },
                {
                    // These configuration settings mean we don't have to manually unregister and disconnect
                    // the eventHub after the event has been received
                    unregister: true,
                    disconnect: true
                }
            );
            eventHub.connect(true);
        });
    }

    public static async sendChaincodeProposalToPeers(
        channel: FabricClient.Channel,
        deploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest,
        upgrade: boolean,
        timeout?: number
    ): Promise<
        [Array<FabricClient.ProposalResponse | Error>, FabricClient.Proposal]
    > {
        let proposalResponses: [
            Array<FabricClient.ProposalResponse | Error>,
            FabricClient.Proposal
        ];

        if (upgrade) {
            logger.debug('Upgrading chaincode...');
            proposalResponses = await channel.sendUpgradeProposal(
                deploymentOptions,
                timeout
            );
        } else {
            logger.debug('Instantiating chaincode...');
            proposalResponses = await channel.sendInstantiateProposal(
                deploymentOptions,
                timeout
            );
        }

        return proposalResponses;
    }
    private caClients: any;
    private channel: string;
    private keyValueStoreBasePath: string;
    private orgName;
    private connectionProfile;
    private gateway: Gateway;
    private objCreateGateway = new CreateGateway();
    private connectionProfilePath;
    private credentialFilePath;
    private enrollId;
    private enrollSecret;



    constructor(
        connectionProfilePath: string,
        channelName: string,
        keyValueStoreBasePath: string,
        orgName: string,
        credentialFilePath: string
    ) {
        this.orgName = orgName;
        this.credentialFilePath = credentialFilePath;
        this.connectionProfilePath = connectionProfilePath;
        this.caClients = {};
        this.keyValueStoreBasePath = keyValueStoreBasePath;
        this.connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath))
        this.enrollId;
        this.enrollSecret;
        this.channel = channelName;


        // Set up the client object
        const client = new FabricClient();
        const cryptoSuite = FabricClient.newCryptoSuite();
        cryptoSuite.setCryptoKeyStore(
            FabricClient.newCryptoKeyStore({
                path: this.keyValueStoreBasePath + '_' + orgName
            })
        );
        client.setCryptoSuite(cryptoSuite);

        // Get the appropriate CA for the specified org
        const caFromOrg = this.connectionProfile.organizations[orgName].certificateAuthorities;
        const connProfCa = this.connectionProfile.certificateAuthorities;
        const self = this;
        caFromOrg.forEach(function (orgCa) {
            Object.keys(connProfCa).forEach(function (currentCa) {
                if (currentCa == orgCa) {
                    const caName = currentCa;
                    const caUrl = connProfCa[currentCa].url;
                    logger.info('The Org for this CA is: ' + orgName);
                    logger.info('The CA Name is: ' + caName);
                    logger.info('The CA UrL is: ' + caUrl);
                    self.caClients[orgName] = new CaClient(
                        caUrl,
                        null /*defautl TLS opts*/,
                        caName,
                        cryptoSuite
                    );
                }
            })
        });

        //Obtain enrollId and enrollSecret from connection profile
        try {
            this.enrollId = this.connectionProfile.certificateAuthorities[caFromOrg].registrar.enrollId;
            this.enrollSecret = this.connectionProfile.certificateAuthorities[caFromOrg].registrar.enrollSecret;
        }
        catch (error) {
            logger.error(`Could not find credentials in connection profile. ${error}`)
        }

    }

    // APIs

    /**
     * 
     * Set Gateway connection
     * @returns {Gateway} - Gateway object 
     */
    public async getGateway() {
        this.gateway = await this.objCreateGateway.setupGateway(this.connectionProfilePath, this.orgName, this.enrollId, this.enrollSecret, this.credentialFilePath)
        return this.gateway;
    }

    /**
     * 
     * @param org 
     * @param credentialsFilePath 
     * @returns {FabricClient.User} - Returns a user with Admin identity
     */
    public async getOrgAdmin(org: string, credentialsFilePath: string): Promise<FabricClient.User> {
        if (!fs.existsSync(credentialsFilePath)) {
            throw new Error(
                'Failed to find the credentails file for IBPv2 in the current path'
            );
        }
        const privateKey = walletHelper.getPrivateKey(credentialsFilePath);
        const publicCert = walletHelper.getPublicCert(credentialsFilePath);

        if (privateKey == null || privateKey.length == 0) {      //do string typecheck ... find a way to check for null, undefined, empty
            throw new Error(
                'Error: private key is invalid'
            );
        }

        if (publicCert == null || publicCert.length == 0) { //same as above
            throw new Error(
                'Error: public certificate is invalid'
            );
        }


        logger.debug(`Getting org admin for user org: ${org}`);

        const keyPEM = Buffer.from(privateKey).toString()
        const certPEM = publicCert.toString()

        const client = this.gateway.getClient();

        logger.debug(`keyPEM: ${inspect(keyPEM)}`);
        logger.debug(`certPEM: ${inspect(certPEM)}`);

        return await client.createUser({
            username: `peer${org}Admin`,
            mspid: org,
            cryptoContent: {
                privateKeyPEM: keyPEM,
                signedCertPEM: certPEM
            },
            skipPersistence: true
        });
    }

    // private getKeyStoreForOrg(org: string): string {            
    //     return this.keyValueStoreBasePath + '_' + org;
    // }

    // private newOrderer(client: FabricClient): FabricClient.Orderer {
    //     let serverNameObject;
    //     let url: string = "";
    //     let tlsCertPEMOrderer = "";
    //     let tlsCertOrderer = "";

    //     const connectionProfileOrderersArray = Object.keys(this.connectionProfile.orderers ).map(i => this.connectionProfile.orderers [i])
    //     connectionProfileOrderersArray.forEach(function(currentOrderer){
    //         tlsCertOrderer = currentOrderer.tlsCACerts
    //         tlsCertPEMOrderer = currentOrderer.tlsCACerts.pem;
    //         url = currentOrderer.url;
    //     });

    //     let opts: FabricClient.ConnectionOpts = {};
    //     if (url.includes('grpcs')) {
    //         logger.debug(
    //             `grcps protocol detected for orderer in ${serverNameObject}`
    //         );
    //         if (!tlsCertOrderer) {
    //             logger.error(
    //                 `grpcs protocol detected for orderer (serverName), tls_cacerts required but none found in network config`
    //             );
    //             throw new Error(
    //                 `grpcs protocol detected for orderer (serverName), tls_cacerts required but none found in network config`
    //             );
    //         }

    //         const caroots = Buffer.from(tlsCertPEMOrderer).toString();
    //         opts = {
    //             pem: caroots
    //         };
    //     }

    //     return client.newOrderer(url, opts);
    // }
    // private setupPeers(
    //     channel: FabricClient.Channel,
    //     org: string,
    //     client: FabricClient
    // ) {
    //     const orgMspId: string = this.orgName;
    //     const connectionProfile = this.connectionProfile;
    //     const orgPeers = this.connectionProfile.organizations[org].peers;

    //     orgPeers.forEach(function (currentPeer) {
    //         const peerUrl = connectionProfile.peers[currentPeer].url;
    //         const peerCert = connectionProfile.peers[currentPeer].tlsCACerts;
    //         const tlsCertPEMPeer = peerCert.pem;

    //         let opts: FabricClient.ConnectionOpts = {};

    //         if (peerUrl.includes('grpcs')) {
    //             logger.debug(`grcps protocol detected for peers in ${org}`);
    //             if (!peerCert) {
    //                 logger.error(
    //                     `grpcs protocol detected for peers in org ${org}, tls_cacerts required but none found in network config`
    //                 );
    //                 throw new Error(
    //                     `grpcs protocol detected for peers in org ${org}, tls_cacerts required but none found in network config`
    //                 );
    //             }

    //             logger.debug('\nData from file:');
    //             logger.debug(Buffer.from(tlsCertPEMPeer).toString());

    //             opts = {
    //                 pem: Buffer.from(tlsCertPEMPeer).toString()
    //             };
    //         }

    //         const peer = client.newPeer(
    //             peerUrl,
    //             opts
    //         );
    //         peer.setName(currentPeer);

    //         channel.addPeer(peer, orgMspId);
    //     });
    // }

    // private readAllFiles(dir: string): string[] {
    //     let files: any = fs.readdirSync(dir);
    //     // We should remove hidden files to avoid nasty surprises
    //     // For instance, macOS may add the infamous .DS_Store file
    //     files = files.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item));
    //     const certs = [];
    //     files.forEach((file_name) => {
    //         const file_path = path.join(dir, file_name);
    //         const data = fs.readFileSync(file_path);
    //         certs.push(data);
    //     });
    //     return certs;
    // }
}

// Not implemented yet

// FabricHelper.prototype.newRemotes = function(names, forPeers, userOrg) {
//     let client = this.getClientForOrg(userOrg);

//     let targets = [];
//     // find the peer that match the names
//     for (let idx in names) {
//         let peerName = names[idx];
//         if (this.ORGS[userOrg].peers[peerName]) {
//             // found a peer matching the name
//             let data = fs.readFileSync(
//                 path.join(
//                     this.cryptoDir,
//                     this.ORGS[userOrg].peers[peerName]['tls_cacerts']
//                 )
//             );
//             let grpcOpts = {
//                 pem: Buffer.from(data).toString(),
//                 'ssl-target-name-override': null
//             };

//             if (forPeers) {
//                 targets.push(
//                     client.newPeer(
//                         this.ORGS[userOrg].peers[peerName].requests,
//                         grpcOpts
//                     )
//                 );
//             } else {
//                 let eh = client.newEventHub();
//                 eh.setPeerAddr(
//                     this.ORGS[userOrg].peers[peerName].events,
//                     grpcOpts
//                 );
//                 targets.push(eh);
//             }
//         }
//     }

//     if (targets.length === 0) {
//         logger.error(
//             util.format('Failed to find peers matching the names %s', names)
//         );
//     }

//     return targets;
// };

// //-------------------------------------//
// // APIs
// //-------------------------------------//

// FabricHelper.prototype.newPeers = function(names, org) {
//     return this.newRemotes(names, true, org);
// };

// FabricHelper.prototype.newEventHubs = function(names, org) {
//     return this.newRemotes(names, false, org);
// };

// FabricHelper.prototype.getAdminUser = function(username, password, userOrg) {
//     var member;
//     var client = this.getClientForOrg(userOrg);

//     return FabricClient.newDefaultKeyValueStore({
//         path: this.getKeyStoreForOrg(this.getOrgName(userOrg))
//     }).then((store) => {
//         client.setStateStore(store);
//         // clearing the user context before switching
//         client._userContext = null;
//         return client.getUserContext(username, true).then((user) => {
//             if (user && user.isEnrolled()) {
//                 logger.info('Successfully loaded member from persistence');
//                 return user;
//             } else {
//                 let caClient = this.caClients[userOrg];
//                 // need to enroll it with CA server
//                 return caClient
//                     .enroll({
//                         enrollmentID: username,
//                         enrollmentSecret: password
//                     })
//                     .then((enrollment) => {
//                         logger.info(
//                             "Successfully enrolled user '" + username + "'"
//                         );
//                         member = new User(username);
//                         member.setCryptoSuite(client.getCryptoSuite());
//                         return member.setEnrollment(
//                             enrollment.key,
//                             enrollment.certificate,
//                             this.getMspID(userOrg)
//                         );
//                     })
//                     .then(() => {
//                         return client.setUserContext(member);
//                     })
//                     .then(() => {
//                         return member;
//                     })
//                     .catch((err) => {
//                         logger.error(
//                             'Failed to enroll and persist user. Error: ' +
//                                 err.stack
//                                 ? err.stack
//                                 : err
//                         );
//                         return null;
//                     });
//             }
//         });
//     });
// };

// FabricHelper.prototype.getRegisteredUsers = function(
//     username,
//     userOrg,
//     isJson
// ) {
//     var member;
//     var client = this.getClientForOrg(userOrg);
//     var enrollmentSecret = null;
//     return FabricClient.newDefaultKeyValueStore({
//         path: this.getKeyStoreForOrg(this.getOrgName(userOrg))
//     })
//         .then((store) => {
//             client.setStateStore(store);
//             // clearing the user context before switching
//             client._userContext = null;
//             return client.getUserContext(username, true).then((user) => {
//                 if (user && user.isEnrolled()) {
//                     logger.info('Successfully loaded member from persistence');
//                     return user;
//                 } else {
//                     let caClient = this.caClients[userOrg];
//                     return this.getAdminUser(userOrg)
//                         .then(function(adminUserObj) {
//                             member = adminUserObj;
//                             return caClient.register(
//                                 {
//                                     enrollmentID: username,
//                                     affiliation: userOrg + '.department1'
//                                 },
//                                 member
//                             );
//                         })
//                         .then(
//                             (secret) => {
//                                 enrollmentSecret = secret;
//                                 logger.debug(
//                                     username + ' registered successfully'
//                                 );
//                                 return caClient.enroll({
//                                     enrollmentID: username,
//                                     enrollmentSecret: secret
//                                 });
//                             },
//                             (err) => {
//                                 logger.debug(username + ' failed to register');
//                                 console.log(err);
//                                 return '' + err;
//                                 //return 'Failed to register '+username+'. Error: ' + err.stack ? err.stack : err;
//                             }
//                         )
//                         .then((message) => {
//                             if (
//                                 message &&
//                                 typeof message === 'string' &&
//                                 message.includes('Error:')
//                             ) {
//                                 logger.error(username + ' enrollment failed');
//                                 return message;
//                             }
//                             logger.debug(username + ' enrolled successfully');

//                             member = new User(username);
//                             member._enrollmentSecret = enrollmentSecret;
//                             return member.setEnrollment(
//                                 message.key,
//                                 message.certificate,
//                                 this.getMspID(userOrg)
//                             );
//                         })
//                         .then(
//                             () => {
//                                 client.setUserContext(member);
//                                 return member;
//                             },
//                             (err) => {
//                                 logger.error(
//                                     util.format(
//                                         '%s enroll failed: %s',
//                                         username,
//                                         err.stack ? err.stack : err
//                                     )
//                                 );
//                                 return '' + err;
//                             }
//                         );
//                 }
//             });
//         })
//         .then(
//             (user) => {
//                 if (isJson && isJson === true) {
//                     var response = {
//                         success: true,
//                         secret: user._enrollmentSecret,
//                         message: username + ' enrolled Successfully'
//                     };
//                     return response;
//                 }
//                 return user;
//             },
//             (err) => {
//                 logger.error(
//                     util.format(
//                         'Failed to get registered user: %s, error: %s',
//                         username,
//                         err.stack ? err.stack : err
//                     )
//                 );
//                 return '' + err;
//             }
//         );
// };

// FabricHelper.prototype.processChaincodeInstantiateProposal = function(
//     transactionId,
//     proposalResult,
//     org
// ) {
//     var proposalResponses = proposalResult[0];
//     var proposal = proposalResult[1];

//     var request = {
//         proposalResponses: proposalResponses,
//         proposal: proposal
//     };
//     // set the transaction listener and set a timeout of 30sec
//     // if the transaction did not get committed within the timeout period,
//     // fail the test

//     let data = fs.readFileSync(
//         path.join(this.cryptoDir, this.ORGS[org].peers['peer1']['tls_cacerts'])
//     );
//     let tlsCert = Buffer.from(data).toString();

//     let eh = this.getClientForOrg(org).newEventHub();
//     eh.setPeerAddr(this.ORGS[org].peers['peer1']['events'], {
//         pem: tlsCert
//     });
//     eh.connect();

//     let txPromise = new Promise(function(resolve, reject) {
//         let handle = setTimeout(function() {
//             eh.disconnect();
//             reject();
//         }, 30000);
//         eh.registerTxEvent(transactionId, function(tx, code) {
//             logger.info(
//                 'The transaction has been committed on peer ' +
//                     eh._ep._endpoint.addr
//             );
//             clearTimeout(handle);
//             eh.unregisterTxEvent(transactionId);
//             eh.disconnect();

//             if (code !== 'VALID') {
//                 logger.error('The transaction was invalid, code = ' + code);
//                 reject();
//             } else {
//                 logger.info('The chaincode instantiate transaction was valid.');
//                 resolve();
//             }
//         });
//     });
//     let channel = this.getChannelForOrg(org);
//     let sendPromise = channel.sendTransaction(request);
//     return Promise.all([sendPromise].concat([txPromise]));
// };

// FabricHelper.prototype.processChaincodeInvokeProposal = function(
//     transactionId,
//     proposalResult,
//     org
// ) {
//     var proposalResponses = proposalResult[0];
//     var proposal = proposalResult[1];

//     var request = {
//         proposalResponses: proposalResponses,
//         proposal: proposal
//     };
//     // set the transaction listener and set a timeout of 30sec
//     // if the transaction did not get committed within the timeout period,
//     // fail the test

//     let data = fs.readFileSync(
//         path.join(this.cryptoDir, this.ORGS[org].peers['peer1']['tls_cacerts'])
//     );
//     let tlsCert = Buffer.from(data).toString();

//     let eh = this.getClientForOrg(org).newEventHub();
//     eh.setPeerAddr(this.ORGS[org].peers['peer1']['events'], {
//         pem: tlsCert,
//         'ssl-target-name-override': this.ORGS[org].peers['peer1'][
//             'server-hostname'
//         ]
//     });
//     eh.connect();

//     let txPromise = new Promise(function(resolve, reject) {
//         let handle = setTimeout(function() {
//             eh.disconnect();
//             reject();
//         }, 30000);
//         eh.registerTxEvent(transactionId, function(tx, code) {
//             logger.info(
//                 'The transaction has been committed on peer ' +
//                     eh._ep._endpoint.addr
//             );
//             clearTimeout(handle);
//             eh.unregisterTxEvent(transactionId);
//             eh.disconnect();

//             if (code !== 'VALID') {
//                 logger.error('The transaction was invalid, code = ' + code);
//                 reject();
//             } else {
//                 logger.info('The chaincode invoke transaction was valid.');
//                 resolve();
//             }
//         });
//     });
//     let channel = this.getChannelForOrg(org);
//     let sendPromise = channel.sendTransaction(request);
//     return Promise.all([sendPromise].concat([txPromise]));
// };
