/**
 * Copyright 2018 IBM Corp. All Rights Reserved.
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

const log4js = require('log4js');
const fs = require('fs');
const config = require('config');
const FabricCAServices = require('fabric-ca-client');

/**
 * Set up logging
 */
const logger = log4js.getLogger('helpers - util');
logger.setLevel(config.logLevel);

/**
 * Util object
 */
const util = {};

//const ccpPath = `${__dirname}/../config/fabric-connection-profile.json`;

/**
 * Send http response helper
 * res: express response object
 * msg: {statusCode (int), success (bool), message (string), etc}
 */
util.sendResponse = (res, msg) => {
  console.log('entering >>> sendResponse()');
  const response = msg;
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = response.statusCode;
  delete response.statusCode;
  res.json(response);
};

/**
 * Enroll given user with given org Fabric CA
 */
util.userEnroll = (orgName, enrollId, enrollSecret, ccpPath) => {
  console.log('entering >>> userEnroll()');
  console.log(`Enrolling user ${enrollId}`);
  return new Promise(((resolve, reject) => {
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);

    // get orgs and CAs fields from connection profile
    const orgs = ccp.organizations;
    const CAs = ccp.certificateAuthorities;

    if (!orgs[orgName]) {
      console.log(`Invalid org name: ${orgName}`);
      throw new Error(`Invalid org name: ${orgName}`);
    }

    // get certificate authority for orgName

    //
    
    let caURL = "";
    for (var key in ccp.certificateAuthorities){
        caURL = ccp.certificateAuthorities[key].url;
        break; //temporary, because you don't just want this to work for one CA
    }

    //
    // const fabricCAKey = orgs[orgName].certificateAuthorities[0];
    // const caURL = CAs[fabricCAKey].url;

    // enroll user with certificate authority for orgName
    const tlsOptions = {
      trustedRoots: [],
      verify: false, 
    };
    const caService = new FabricCAServices(caURL, tlsOptions);
    const req = {
      enrollmentID: enrollId,
      enrollmentSecret: enrollSecret,
    };
    caService.enroll(req).then(
      (enrollment) => {
        enrollment.key = enrollment.key.toBytes();
        return resolve(enrollment);
      },
      (err) => {
        console.log(err);
        return reject(err);
      },
    );
  }));
};

// util.otherEnroll = (orgname, orgpass) => {

// 		const self = this;

// 		// check for required args
// 		if (arguments.length < 3) {
// 			return Promise.reject('Missing required parameters.  \'admin\', \'adminpw\' and \'csr\' are all required.');
// 		}

// 		const requestOptions = {
// 			hostname: self._hostname,
// 			port: self._port,
// 			path: self._baseAPI + 'enroll',
// 			method: 'POST',
// 			auth: 'org1admin' + ':' + 'org1adminpw',
// 			ca: self._tlsOptions.trustedRoots,
// 			rejectUnauthorized: self._tlsOptions.verify
// 		};

// 		const enrollRequest = {
// 			caname: self._caName,
// 			certificate_request: csr
// 		};

// 		if (profile) {
// 			enrollRequest.profile = profile;
// 		}

// 		if (attr_reqs) {
// 			enrollRequest.attr_reqs = attr_reqs;
// 		}

// 		return new Promise(((resolve, reject) => {

// 			const request = self._httpClient.request(requestOptions, (response) => {

// 				const responseBody = [];
// 				response.on('data', (chunk) => {
// 					responseBody.push(chunk);
// 				});

// 				response.on('end', (data) => {

// 					const payload = responseBody.join('');

// 					if (!payload) {
// 						return reject(new Error(
// 							util.format('Enrollment failed with HTTP status code', response.statusCode)));
// 					}
// 					// response should be JSON
// 					try {
// 						const res = JSON.parse(payload);
// 						if (res.success) {
// 							// we want the result field which is Base64-encoded PEM
// 							const enrollResponse = new Object();
// 							// Cert field is Base64-encoded PEM
// 							enrollResponse.enrollmentCert = Buffer.from(res.result.Cert, 'base64').toString();
// 							enrollResponse.caCertChain = Buffer.from(res.result.ServerInfo.CAChain, 'base64').toString();
// 							return resolve(enrollResponse);
// 						} else {
// 							return reject(new Error(
// 								util.format('Enrollment failed with errors [%s]', JSON.stringify(res.errors))));
// 						}

// 					} catch (err) {
// 						return reject(new Error(
// 							util.format('Could not parse enrollment response [%s] as JSON due to error [%s]', payload, err)));
// 					}
// 				});

// 				response.on('error', (error) => {
// 					reject(new Error(
// 						util.format('Enrollment failed with error [%s]', error)));
// 				});
// 			});

// 			request.on('error', (err) => {
// 				reject(new Error(util.format('Calling enrollment endpoint failed with error [%s]', err)));
// 			});

// 			const body = JSON.stringify(enrollRequest);
// 			request.end(body);

// 		}));

// }

module.exports = util;
