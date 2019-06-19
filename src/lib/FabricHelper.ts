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
import * as path from 'path';
import { inspect } from 'util';
import { Gateway, Network } from 'fabric-network';
//fix this
import {CreateGateway} from './CreateGateway'

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

    public static getPeerNamesAsStringForChannel(
        channel: FabricClient.Channel
    ): string {
        const peerNames: string[] = [];
        for (const peer of channel.getPeers()) {
            peerNames.push(peer.getName());
        }

        return peerNames.join(',');
    }

    public static registerAndConnectTxEventHub(
        channel: FabricClient.Channel,
        deployTxId: string
    ): Promise<void> {
        const peerName = channel.getPeers()[0].getName();
        const eventHub = channel.newChannelEventHub(peerName);

        return new Promise(function(resolve, reject) {
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
    private clients: object;
    private channels: object;
    private caClients: any;

    private channel: string;
    private keyValueStoreBasePath: string;
    private cryptoDirPath: string;

    private gateway : Gateway;
    private objCreateGateway = new CreateGateway();
    private ccp;
    private orgName;
    private connectionProfile;
    private credentialsPath : string;
    private credFileName : string;

    constructor(
        networkConfigFilePath: string,
        channelName: string,
        keyValueStoreBasePath: string,
        cryptoDirPath: string,
        org: string,
        credentialFilePath: string
    ) {
        this.clients = {};
        this.channels = {};
        this.caClients = {};
        this.channel = channelName;
        this.keyValueStoreBasePath = keyValueStoreBasePath;
        this.cryptoDirPath = cryptoDirPath;
        this.gateway
        this.ccp = networkConfigFilePath
        this.connectionProfile = require(this.ccp);
        this.credentialsPath = credentialFilePath;
        this.credFileName;



        // set up the client and channel objects for each org
        this.orgName = org;
        const client = new FabricClient();

        const cryptoSuite = FabricClient.newCryptoSuite();
        cryptoSuite.setCryptoKeyStore(
            FabricClient.newCryptoKeyStore({
                path: this.getKeyStoreForOrg(this.orgName)
            })
        );
        client.setCryptoSuite(cryptoSuite);

        const channel = client.newChannel(channelName);
        channel.addOrderer(this.newOrderer(client));

        this.clients[this.orgName] = client;
        this.channels[this.orgName] = channel;

        this.setupPeers(channel, this.orgName, client);

        for (var key in this.connectionProfile.certificateAuthorities){
            const caName  = key;
            const caUrl = this.connectionProfile.certificateAuthorities[key].url;

        logger.info('The Org for this CA is: ' + this.orgName);
        logger.info('The CA Name is: ' + caName);
        logger.info('The CA UrL is: ' + caUrl);
        this.caClients[org] = new CaClient(
            caUrl,
            null /*defautl TLS opts*/,
            caName,
            cryptoSuite
        );

    }

    
}

    // APIs

    public generateCertificates(){
            const bufferEncoding = 'base64';
            try{
                if (!fs.existsSync(this.credentialsPath)){
                    console.log('Failed to find the credentails file for IBPv2 in the current path.')
                    return;
                }
                
                console.log(`Generating certificates for ${this.credentialsPath}`);
                const credentials = JSON.parse(fs.readFileSync(this.credentialsPath) );
                const privateKey = Buffer.from(credentials.private_key, bufferEncoding).toString();
                const publicCert = Buffer.from(credentials.cert, bufferEncoding).toString();
                const fileNameSp = credentials.name.toString();
                this.credFileName = fileNameSp.replace(/\s+/g, '');
                const mainPath = path.join(__dirname, '..', "remote_fabric");
                const pathToOrg = mainPath + "/" + this.orgName;
                const pathToFileName = pathToOrg + "/" + this.credFileName;
        
                if (!fs.existsSync(mainPath)){
                        try { 
                          fs.mkdirSync(mainPath, {recursive: true })      //figure This out
                          fs.mkdirSync(pathToOrg, {recursive: true }) 
                          fs.mkdirSync(pathToFileName, {recursive: true }) 
                          fs.mkdirSync(pathToFileName + "/publicCert", {recursive: true }) 
                          fs.mkdirSync(pathToFileName + "/privateKey", {recursive: true }) 
                        } catch (err) {
                          if (err.code !== 'EEXIST') throw err
                        }
                        
                        //`${dirPath}/remote_fabric/${this.orgName}/${fileName}
                    
                }

                fs.writeFileSync(pathToFileName + "/privateKey/key", privateKey);
                fs.writeFileSync(pathToFileName + "/publicCert/cert", publicCert);

                return;
                  
            }
            catch(exception){
                console.log(`Failed to generated certificates.  Error: ${exception}`);
            }
        
    }


//change org1admin, org1adminpw
    public async getGateway(){
        this.gateway = await this.objCreateGateway.setupGateway(this.ccp, this.orgName, 'org1admin', 'org1adminpw')
        return this.gateway;
    }


    public getChannelForOrg(org: string): FabricClient.Channel {
        return this.channels[org];
    }

    public getClientForOrg(org: string): FabricClient {
        return this.clients[org];
    }

    public async getOrgAdmin(org: string): Promise<FabricClient.User> {
        //if (!this.ORGS[org]) { throw new Error(`Unknown Org: ${org}`); }

        logger.debug(`Getting org admin for user org: ${org}`);

        //const keyPath= path.join(__dirname, '..', 'remote_fabric', this.orgName, this.credFileName, 'privateKey', 'key');
        const keyPath= path.join(__dirname, '..', 'remote_fabric', this.orgName, 'Org1Admin', 'privateKey', 'key');
        logger.debug(`Org admin keyPath: ${keyPath}`);
        const keyPEM = Buffer.from(fs.readFileSync(keyPath)).toString() ;//Buffer.from(this.readAllFiles(keyPath)[0]).toString();

        //const certPath = path.join(__dirname, '..', 'remote_fabric', this.orgName, this.credFileName, 'publicCert', 'cert');//path.join(this.cryptoDirPath, admin.cert);
        const certPath = path.join(__dirname, '..', 'remote_fabric', this.orgName, 'Org1Admin', 'publicCert', 'cert');
        logger.debug(`The certPath: ${certPath}`);
        const certPEM = fs.readFileSync(certPath).toString()//this.readAllFiles(certPath)[0].toString();

        const client = this.getClientForOrg(org);
        const cryptoSuite = FabricClient.newCryptoSuite();

        cryptoSuite.setCryptoKeyStore(
            FabricClient.newCryptoKeyStore({
                path: this.getKeyStoreForOrg(this.orgName)
            })
        );
        client.setCryptoSuite(cryptoSuite);

        const store = await FabricClient.newDefaultKeyValueStore({
            path: this.getKeyStoreForOrg(this.orgName)
        });

        client.setStateStore(store);

        logger.debug(`keyPEM: ${inspect(keyPEM)}`);
        logger.debug(`certPEM: ${inspect(certPEM)}`);

        return await client.createUser({
            username: 'peer' + org + 'Admin',
            mspid: org,
            cryptoContent: {
                privateKeyPEM: keyPEM,
                signedCertPEM: certPEM
            },
            skipPersistence: true
        });
    }

    private getKeyStoreForOrg(org: string): string {
        return this.keyValueStoreBasePath + '_' + org;
    }

    private newOrderer(client: FabricClient): FabricClient.Orderer {
        let serverNameObject;
        let url : string = "";
        let tlsCertPEMOrderer  = "";
        for(var key in this.connectionProfile.orderers){
            if(key != "__proto__"){
                serverNameObject = this.connectionProfile.orderers[key];
                tlsCertPEMOrderer = this.connectionProfile.orderers[key].tlsCACerts.pem
                const objArray = Object.keys(serverNameObject).map(i => serverNameObject[i])
                url = objArray[0];
                break;
            }
        }
        let opts: FabricClient.ConnectionOpts = {};
        if (url.includes('grpcs')) {                                                
            logger.debug(
                `grcps protocol detected for orderer in ${serverNameObject}`
            );
            if (!serverNameObject.tlsCACerts) {
                logger.error(
                    `grpcs protocol detected for orderer (serverName), tls_cacerts required but none found in network config`
                );
                throw new Error(
                    `grpcs protocol detected for orderer (serverName), tls_cacerts required but none found in network config`
                );
            }

            const caroots = Buffer.from(tlsCertPEMOrderer).toString();
            opts = {
                pem: caroots
            };
        }

        return client.newOrderer(url, opts);
    }
    private setupPeers(
        channel: FabricClient.Channel,
        org: string,
        client: FabricClient
    ) {
        const orgMspId: string = this.orgName;

        for (const key in this.connectionProfile.peers) {
            let opts: FabricClient.ConnectionOpts = {};
            let tlsCertPEMPeer = this.connectionProfile.peers[key].tlsCACerts.pem;
            if (this.connectionProfile.peers[key].url.includes('grpcs')) {
                logger.debug(`grcps protocol detected for peers in ${org}`);                        
                if (!this.connectionProfile.peers[key].tlsCACerts) {
                    logger.error(
                        `grpcs protocol detected for peers in org ${org}, tls_cacerts required but none found in network config`
                    );
                    throw new Error(
                        `grpcs protocol detected for peers in org ${org}, tls_cacerts required but none found in network config`
                    );
                }

                logger.debug('\nData from file:');
                logger.debug(Buffer.from(tlsCertPEMPeer).toString());

                opts = {
                    pem: Buffer.from(tlsCertPEMPeer).toString()
                };
            }

            const peer = client.newPeer(
                this.connectionProfile.peers[key].url,
                opts
            );
            peer.setName(key);

            channel.addPeer(peer, orgMspId);
        }
    }


    private readAllFiles(dir: string): string[] {
        let files: any = fs.readdirSync(dir);
        // We should remove hidden files to avoid nasty surprises
        // For instance, macOS may add the infamous .DS_Store file
        files = files.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item));
        const certs = [];
        files.forEach((file_name) => {
            const file_path = path.join(dir, file_name);
            const data = fs.readFileSync(file_path);
            certs.push(data);
        });
        return certs;
    }
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
