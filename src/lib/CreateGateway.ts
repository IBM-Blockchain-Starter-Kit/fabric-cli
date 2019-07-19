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



const { Gateway } = require('fabric-network');
const walletHelper = require(`../helpers/wallet`);



/**
 * FabricRoutes class that handles creating routes that need to connect to the
 * fabric network. Parses the fabric-connections.json file to create the routes
 * with the appropriate middleware to connect to the fabric network and get access
 * to the specified channels and smart contracts - removing the logic from the route
 * controllers.
 */
export class CreateGateway {
    gateway: any;

  constructor() {
    this.gateway = new Gateway();
    // logger.debug('Setup Gateway constructor called...')
  }

  /**
   * Connect the gateway instance
   */
  async setupGateway(commConnProfilePath, orgName, enrollId, enrollSecret, credentialFilePath) {
    // logger.debug('entering >>> setupGateway()');

    try {
      const org = orgName;
      const user = enrollId;
      const pw = enrollSecret;
      //const { serviceDiscovery } = fabricConfig;

      // user enroll and import if identity not found in wallet
      const idExists = await walletHelper.identityExists(user);
      if (!idExists) {
        // logger.debug(`Enrolling and importing ${user} into wallet`);
        const privateKey = walletHelper.getPrivateKey(credentialFilePath);
        const publicCert = walletHelper.getPublicCert(credentialFilePath);
        await walletHelper.importIdentity(user, org, publicCert, privateKey);
      }

      // gateway and contract connection
      // logger.debug('Connecting to gateway');
      await this.gateway.connect(commConnProfilePath, {
        identity: user,
        wallet: walletHelper.getWallet(),
        discovery: { // https://fabric-sdk-node.github.io/release-1.4/module-fabric-network.Gateway.html#~DiscoveryOptions
          enabled: true,  //serviceDiscovery.enabled,           //change
          asLocalhost: false  //serviceDiscovery.asLocalhost,   //change
        },
      });
      // logger.debug('Setup Gateway connected...');
      // logger.debug('Connected to gateway');

      return this.gateway;

    } catch (err) {
      // logger.error(err.message);
      throw new Error(err.message);
    }

    // logger.debug('exiting <<< setupGateway()');
  }



}

exports.CreateGateway = CreateGateway;

