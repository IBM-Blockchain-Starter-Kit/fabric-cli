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

var invokeChaincode = function (networkConfigFilePath, channelName, chaincodeName, chaincodeVersion, args,
	functionName, org, queryOnly, timeout) {
	logger.debug('============ Invoke chaincode method on organization ' + org + ' ============');

	let fabricHelper = new FabricHelper(networkConfigFilePath, channelName, path.join(process.env.HOME, 'fabric-client-kvs'));
	let channel = fabricHelper.getChannelForOrg(org);
	let client = fabricHelper.getClientForOrg(org);
	let tx_id = null;

	return fabricHelper.getOrgAdmin(org)
		.then((user) => {
			// Read the config block from the orderer for the channel
			// and initialize the verify MSPs based on the participating
			// organizations
			return channel.initialize();
		}).then((success) => {
			tx_id = client.newTransactionID();
			// Send proposal to endorser
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
			fabricHelper.inspectProposalResult(results);
			// Is this a query or a transaction to update the ledger?
			if (queryOnly) {
				logger.info('Successfully query ledger. Ending process.');
				let proposalResponses = results[0];
				let status = (proposalResponses[0].response.status === 200) ? "SUCCESS" : "ERROR";
				// Create response object
				var response = {
					status: status,
					message: proposalResponses[0].response.message,
					payload: proposalResponses[0].response.payload
				};
				// Return response object
				return Promise.resolve(response);
			} else {
				logger.info('Proceeding with processing of invocation proposal.');
				return fabricHelper.processChaincodeInvokeProposal(tx_id.getTransactionID(), results, org)
					.then(function (txResult) {
						var response = {
							status: txResult[0].status,
							message: txResult[0].info,
							payload: null
						};
						return Promise.resolve(response);
					});
			}
		}).then((response) => {
			if (response.status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer or query to the ledger. Chaincode invocation was SUCCESSFUL.');
				return response.payload;
			} else {
				var errorMsg = 'Failed to complete the transaction or query the ledger. Error code: ' + response.status;
				logger.error(errorMsg);
				throw new Error(errorMsg);
			}
		}).catch((err) => {
			logger.error('Failed to send invoke transaction: ' + err);
			throw new Error('Failed to invoke transaction: ' + err);
		});
};

exports.invokeChaincode = invokeChaincode;