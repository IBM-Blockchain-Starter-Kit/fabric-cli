/**
 * Copyright 2017 IBM All Rights Reserved.
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
'use strict';

const path = require('path');
const util = require('util');
const fs = require('fs-extra');
const User = require('fabric-client/lib/User.js');
const crypto = require('crypto');
const copService = require('fabric-ca-client');
const hfc = require('fabric-client');
const log4js = require('log4js');
const logger = log4js.getLogger('FabricHelper');


logger.setLevel('DEBUG');
hfc.setLogger(logger);

function FabricHelper(connectionProfilePath, channelName, keyValueStoreBasePath, cryptoDir) 
{
	console.log(connectionProfilePath);
	hfc.addConfigFile(connectionProfilePath);
	this.ORGS = hfc.getConfigSetting('network-config');
	this.clients = {};
	this.channels = {};
	this.caClients = {};
	this.channel = channelName;
	this.keyValueStoreBasePath = keyValueStoreBasePath;
	this.cryptoDir = cryptoDir;

	// set up the client and channel objects for each org
	for (let key in this.ORGS) {
		if (key.indexOf('org') === 0) {
			let client = new hfc();

			let cryptoSuite = hfc.newCryptoSuite();
			cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({path: this.getKeyStoreForOrg(this.ORGS[key].name)}));
			client.setCryptoSuite(cryptoSuite);

			let channel = client.newChannel(this.channel);
			channel.addOrderer(this.newOrderer(client));

			this.clients[key] = client;
			this.channels[key] = channel;

			this.setupPeers(channel, key, client);

			let caUrl = this.ORGS[key].ca.url;
			let caName = this.ORGS[key].ca.name;

			console.log("The Org for this CA is: " + key);
			console.log("The CA Name is: " + caName);
			console.log("The CA Url is: " + caUrl);
			this.caClients[key] = new copService(caUrl, null /*defautl TLS opts*/, caName , cryptoSuite);
		}
	}
}

FabricHelper.prototype.setupPeers = function (channel, org, client) {
	for (let key in this.ORGS[org].peers) {
		let data = fs.readFileSync(path.join(this.cryptoDir, this.ORGS[org].peers[key]['tls_cacerts']));

		console.log("\nData from file:");
		console.log(Buffer.from(data).toString());


		let peer = client.newPeer(
			this.ORGS[org].peers[key].requests,
			{
				pem: Buffer.from(data).toString()
			}
		);
		peer.setName(key);

		channel.addPeer(peer);
	}
}

FabricHelper.prototype.newOrderer = function (client) {
	var caRootsPath = this.ORGS.orderer.tls_cacerts;
	let data = fs.readFileSync(path.join(this.cryptoDir, caRootsPath));
	let caroots = Buffer.from(data).toString();
	return client.newOrderer(this.ORGS.orderer.url, {
		'pem': caroots
	});
}

FabricHelper.prototype.readAllFiles = function(dir) {
	var files = fs.readdirSync(dir);
	// We should remove hidden files to avoid nasty surprises
	// For instance, macOS may add the infamous .DS_Store file
	files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
	var certs = [];
	files.forEach((file_name) => {
		let file_path = path.join(dir,file_name);
		let data = fs.readFileSync(file_path);
		certs.push(data);
	});
	return certs;
}

FabricHelper.prototype.getOrgName = function (org) {
	return this.ORGS[org].name;
}

FabricHelper.prototype.getKeyStoreForOrg = function (org) {
	return this.keyValueStoreBasePath + '_' + org;
}

FabricHelper.prototype.newRemotes = function (names, forPeers, userOrg) {
	let client = this.getClientForOrg(userOrg);

	let targets = [];
	// find the peer that match the names
	for (let idx in names) {
		let peerName = names[idx];
		if (this.ORGS[userOrg].peers[peerName]) {
			// found a peer matching the name
			let data = fs.readFileSync(path.join(this.cryptoDir, this.ORGS[userOrg].peers[peerName]['tls_cacerts']));
			let grpcOpts = {
				pem: Buffer.from(data).toString(),
				'ssl-target-name-override': null
			};

			if (forPeers) {
				targets.push(client.newPeer(this.ORGS[userOrg].peers[peerName].requests, grpcOpts));
			} else {
				let eh = client.newEventHub();
				eh.setPeerAddr(this.ORGS[userOrg].peers[peerName].events, grpcOpts);
				targets.push(eh);
			}
		}
	}

	if (targets.length === 0) {
		logger.error(util.format('Failed to find peers matching the names %s', names));
	}

	return targets;
}

//-------------------------------------//
// APIs
//-------------------------------------//
FabricHelper.prototype.getChannelForOrg = function(org) {
	return this.channels[org];
};

FabricHelper.prototype.getClientForOrg = function(org) {
	return this.clients[org];
};

FabricHelper.prototype.newPeers = function(names, org) {
	return this.newRemotes(names, true, org);
};

FabricHelper.prototype.newEventHubs = function(names, org) {
	return this.newRemotes(names, false, org);
};

FabricHelper.prototype.getMspID = function(org) {
	logger.debug('Msp ID : ' + this.ORGS[org].mspid);
	return this.ORGS[org].mspid;
};

FabricHelper.prototype.getAdminUser = function(username, password, userOrg) {
	var member;
	var client = this.getClientForOrg(userOrg);

	return hfc.newDefaultKeyValueStore({
		path: this.getKeyStoreForOrg(this.getOrgName(userOrg))
	}).then((store) => {
		client.setStateStore(store);
		// clearing the user context before switching
		client._userContext = null;
		return client.getUserContext(username, true).then((user) => {
			if (user && user.isEnrolled()) {
				logger.info('Successfully loaded member from persistence');
				return user;
			} else {
				let caClient = this.caClients[userOrg];
				// need to enroll it with CA server
				return caClient.enroll({
					enrollmentID: username,
					enrollmentSecret: password
				}).then((enrollment) => {
					logger.info('Successfully enrolled user \'' + username + '\'');
					member = new User(username);
					member.setCryptoSuite(client.getCryptoSuite());
					return member.setEnrollment(enrollment.key, enrollment.certificate, this.getMspID(userOrg));
				}).then(() => {
					return client.setUserContext(member);
				}).then(() => {
					return member;
				}).catch((err) => {
					logger.error('Failed to enroll and persist user. Error: ' + err.stack ?
						err.stack : err);
					return null;
				});
			}
		});
	});
};

FabricHelper.prototype.getRegisteredUsers = function(username, userOrg, isJson) {
	var member;
	var client = this.getClientForOrg(userOrg);
	var enrollmentSecret = null;
	return hfc.newDefaultKeyValueStore({
		path: this.getKeyStoreForOrg(this.getOrgName(userOrg))
	}).then((store) => {
		client.setStateStore(store);
		// clearing the user context before switching
		client._userContext = null;
		return client.getUserContext(username, true).then((user) => {
			if (user && user.isEnrolled()) {
				logger.info('Successfully loaded member from persistence');
				return user;
			} else {
				let caClient = this.caClients[userOrg];
				return this.getAdminUser(userOrg).then(function(adminUserObj) {
					member = adminUserObj;
					return caClient.register({
						enrollmentID: username,
						affiliation: userOrg + '.department1'
					}, member);
				}).then((secret) => {
					enrollmentSecret = secret;
					logger.debug(username + ' registered successfully');
					return caClient.enroll({
						enrollmentID: username,
						enrollmentSecret: secret
					});
				}, (err) => {
					logger.debug(username + ' failed to register');
					console.log(err);
					return '' + err;
					//return 'Failed to register '+username+'. Error: ' + err.stack ? err.stack : err;
				}).then((message) => {
					if (message && typeof message === 'string' && message.includes(
							'Error:')) {
						logger.error(username + ' enrollment failed');
						return message;
					}
					logger.debug(username + ' enrolled successfully');

					member = new User(username);
					member._enrollmentSecret = enrollmentSecret;
					return member.setEnrollment(message.key, message.certificate, this.getMspID(userOrg));
				}).then(() => {
					client.setUserContext(member);
					return member;
				}, (err) => {
					logger.error(util.format('%s enroll failed: %s', username, err.stack ? err.stack : err));
					return '' + err;
				});;
			}
		});
	}).then((user) => {
		if (isJson && isJson === true) {
			var response = {
				success: true,
				secret: user._enrollmentSecret,
				message: username + ' enrolled Successfully',
			};
			return response;
		}
		return user;
	}, (err) => {
		logger.error(util.format('Failed to get registered user: %s, error: %s', username, err.stack ? err.stack : err));
		return '' + err;
	});
};

FabricHelper.prototype.getOrgAdmin = function(userOrg) {
	console.log("The user org: " + userOrg);
	var admin = this.ORGS[userOrg].admin;
	//var keyPath = path.join(__dirname, admin.key);
	var keyPath = path.join(this.cryptoDir, admin.key);
	console.log("The keyPath: " + keyPath);
	var keyPEM = Buffer.from(this.readAllFiles(keyPath)[0]).toString();
	//var certPath = path.join(__dirname, admin.cert);
	var certPath = path.join(this.cryptoDir, admin.cert);
	console.log("The certPath: " + certPath);
	var certPEM = this.readAllFiles(certPath)[0].toString();

	var client = this.getClientForOrg(userOrg);
	var cryptoSuite = hfc.newCryptoSuite();
	if (userOrg) {
		cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({path: this.getKeyStoreForOrg(this.getOrgName(userOrg))}));
		client.setCryptoSuite(cryptoSuite);
	}

	return hfc.newDefaultKeyValueStore({
		path: this.getKeyStoreForOrg(this.getOrgName(userOrg))
	}).then((store) => {
		client.setStateStore(store);

		return client.createUser({
			username: 'peer'+userOrg+'Admin',
			mspid: this.getMspID(userOrg),
			cryptoContent: {
				privateKeyPEM: keyPEM,
				signedCertPEM: certPEM
			}
		});
	});
};

/**
 * Inspect the result of a proposal and returns true if the prosal result was successful, false otherwise. 
 */
FabricHelper.prototype.inspectProposalResult = function(proposalResult) {
	let proposalResponses = proposalResult[0];
	let proposal = proposalResult[1];
	let all_good = true;
	for (var i in proposalResponses) {
		let one_good = false;
		if (proposalResponses && proposalResponses[i].response &&
			proposalResponses[i].response.status === 200) {
			one_good = true;
			logger.info('Proposal was good');
		} else {
			logger.error('Proposal was bad');
		}
		all_good = all_good & one_good;
	}
	if(all_good){
		logger.info(util.format(
			'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
			proposalResponses[0].response.status, proposalResponses[0].response.message,
			proposalResponses[0].response.payload, proposalResponses[0].endorsement
			.signature));
	} else {
		throw new Error('Failed to send instantiate Proposal or receive valid response. Response null or status is not 200.');
	}

	return all_good;
}

FabricHelper.prototype.processChaincodeInstantiateProposal = function(transactionId, proposalResult, org) {

	var proposalResponses = proposalResult[0];
	var proposal = proposalResult[1];

	var request = {
		proposalResponses: proposalResponses,
		proposal: proposal
	};
	// set the transaction listener and set a timeout of 30sec
	// if the transaction did not get committed within the timeout period,
	// fail the test

	let data = fs.readFileSync(path.join(this.cryptoDir, this.ORGS[org].peers['peer1'][
		'tls_cacerts'
	]));
	let tlsCert = Buffer.from(data).toString();

	let eh = this.getClientForOrg(org).newEventHub();
	eh.setPeerAddr(this.ORGS[org].peers['peer1']['events'], {
		pem: tlsCert
	});
	eh.connect();

	let txPromise = new Promise(function(resolve, reject) {
		
		let handle = setTimeout(function() {
			eh.disconnect();
			reject();
		}, 30000);
		eh.registerTxEvent(transactionId, function(tx, code){
			logger.info(
				'The transaction has been committed on peer ' +
				eh._ep._endpoint.addr);
			clearTimeout(handle);
			eh.unregisterTxEvent(transactionId);
			eh.disconnect();

			if (code !== 'VALID') {
				logger.error('The transaction was invalid, code = ' + code);
				reject();
			} else {
				logger.info('The chaincode instantiate transaction was valid.');
				resolve();
			}
		});
	});
	let channel = this.getChannelForOrg(org);
	let sendPromise = channel.sendTransaction(request);
	return Promise.all([sendPromise].concat([txPromise]));
}

FabricHelper.prototype.processChaincodeInvokeProposal = function(transactionId, proposalResult, org) {
	
		var proposalResponses = proposalResult[0];
		var proposal = proposalResult[1];
	
		var request = {
			proposalResponses: proposalResponses,
			proposal: proposal
		};
		// set the transaction listener and set a timeout of 30sec
		// if the transaction did not get committed within the timeout period,
		// fail the test
	
		let data = fs.readFileSync(path.join(this.cryptoDir, this.ORGS[org].peers['peer1'][
			'tls_cacerts'
		]));
		let tlsCert = Buffer.from(data).toString();
	
		let eh = this.getClientForOrg(org).newEventHub();
		eh.setPeerAddr(this.ORGS[org].peers['peer1']['events'], {
			pem: tlsCert,
			'ssl-target-name-override': this.ORGS[org].peers['peer1']['server-hostname']
		});
		eh.connect();
	
		let txPromise = new Promise(function(resolve, reject) {
			
			let handle = setTimeout(function() {
				eh.disconnect();
				reject();
			}, 30000);
			eh.registerTxEvent(transactionId, function(tx, code){
				logger.info(
					'The transaction has been committed on peer ' +
					eh._ep._endpoint.addr);
				clearTimeout(handle);
				eh.unregisterTxEvent(transactionId);
				eh.disconnect();
	
				if (code !== 'VALID') {
					logger.error('The transaction was invalid, code = ' + code);
					reject();
				} else {
					logger.info('The chaincode invoke transaction was valid.');
					resolve();
				}
			});
		});
		let channel = this.getChannelForOrg(org);
		let sendPromise = channel.sendTransaction(request);
		return Promise.all([sendPromise].concat([txPromise]));
	}

FabricHelper.getLogger = function(moduleName) {
	var logger = log4js.getLogger(moduleName);
	logger.setLevel('DEBUG');
	return logger;
};

module.exports = FabricHelper;
