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
var logger = FabricHelper.getLogger('invoke-chaincode');


var invokeTransaction = function(networkConfigFilePath, channelName, chaincodeName, chaincodeVersion, args, 
	functionName, org, queryOnly, timeout) {
	logger.debug('\n============ Invoke chaincode transaction on organization ' + org +
		' ============\n');

	let helper = new FabricHelper(networkConfigFilePath, channelName, path.join(process.env.HOME, 'fabric-client-kvs'));
	let channel = helper.getChannelForOrg(org);
	let client = helper.getClientForOrg(org);
	let tx_id = null;

	return helper.getOrgAdmin(org).then((user) => {
		// read the config block from the orderer for the channel
		// and initialize the verify MSPs based on the participating
		// organizations
		return channel.initialize();
	}).then((success) => {
		tx_id = client.newTransactionID();
		// send proposal to endorser
		var request = {
			chaincodeId: chaincodeName,
			chaincodeVersion: chaincodeVersion,
			args: args,
			txId: tx_id
		};
		if (functionName) {
			request.fcn = functionName;
		}
		return channel.sendTransactionProposal(request, timeout)
	}).then((results) => {
		helper.inspectProposalResult(results);

		if(queryOnly) {
			logger.info('Successfully query ledger.  Ending process');
			return;
		}else {
			logger.info('Proceeding with processChaincodeInvokeProposal');
			return helper.processChaincodeInvokeProposal( tx_id.getTransactionID(), results, org);
		}
	}).then((response) => {

		if(!queryOnly) {
			if (response[0].status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer.  Chaincode invocation is SUCCESS');
				return;
			} else {
				logger.error('Failed to order the transaction. Error code: ' + response[0].status);
				throw new Error('Failed to order the transaction. Error code: ' + response[0].status);
			}
		}
	}).catch((err) => {
		logger.error('Failed to send invoke transaction: ' +  err);
		throw new Error('Failed to invoke transaction: ' + err);
	});
};

exports.invokeTransaction = invokeTransaction;