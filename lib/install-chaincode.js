/**
 * Copyright 2017 IBM All Rights Reserved.
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
'use strict';
var path = require('path');
var fs = require('fs');
var util = require('util');
var FabricHelper = require('./helper.js');
var logger = FabricHelper.getLogger('install-chaincode');


//function installChaincode(org) {
var installChaincode = function(networkConfigFilePath, channelName, chaincodeName, chaincodePath,
	chaincodeVersion, org) {
	logger.debug('\n============ Install chaincode on organizations ============\n');
	
	var helper = new FabricHelper(networkConfigFilePath, channelName, path.join(process.env.HOME, 'fabric-client-kvs'));
	var channel = helper.getChannelForOrg(org);
	var client = helper.getClientForOrg(org);

	return helper.getOrgAdmin(org).then((user) => {
		logger.debug('\n Able to get admin user:\n' + user);
		var request = {
			targets:channel.getPeers(),  //right now installing in all peers for the channel
			chaincodePath: chaincodePath,
			chaincodeId: chaincodeName,
			chaincodeVersion: chaincodeVersion
		};

		logger.debug('\n About to call client.installChaincode\n');
		return client.installChaincode(request);
	}).then((results) => {
		var proposalResponses = results[0];
		var proposal = results[1];
		var all_good = true;
		for (var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[i].response &&
				proposalResponses[i].response.status === 200) {
				one_good = true;
				logger.info('install proposal was good');
			} else {
				logger.error('install proposal was bad');
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
			logger.info(util.format(
				'Successfully sent install Proposal and received ProposalResponse: Status - %s',
				proposalResponses[0].response.status));
			logger.debug('\nSuccessfully Installed chaincode on organization ' + org +
				'\n');
			return 0;
		} else {
			logger.error(
				'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...'
			);
			throw new Error('Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}, (err) => {
		logger.error('Failed to send install proposal due to error: ' + err.stack ?
			err.stack : err);
		throw new Error('Failed to send install proposal due to error: ' + err.stack ?
			err.stack : err);
	});
};
exports.installChaincode = installChaincode;
