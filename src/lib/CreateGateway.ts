import { isProperty, exportAllDeclaration, isModuleSpecifier, Method } from "@babel/types";
import { Gateway } from 'fabric-network';

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

// const { Gateway } = require('fabric-network');



// import { wallet } from '../helpers/wallet';


// import * as wallet from '../helpers/wallet';

// const wallet = import '../helpers/wallet';
import * as fs from 'fs-extra';
import * as GatewayOptions from 'fabric-network';

const wallet = require ('../helpers/wallet');

// const wallet = walletHelper.wallet;

/**
 * FabricRoutes class that handles creating routes that need to connect to the
 * fabric network. Parses the fabric-connections.json file to create the routes
 * with the appropriate middleware to connect to the fabric network and get access
 * to the specified channels and smart contracts - removing the logic from the route
 * controllers.
 */
export class CreateGateway {
 gateway: Gateway;

  constructor() {
    this.gateway = new Gateway();
  }

  /**
   * Connect the gateway instance
   */
  async setupGateway (commConnProfilePath: string, orgName: string, credentialFilePath: string) {
//   async setupGateway (commConnProfilePath: string, orgName: string, enrollId: string, enrollSecret: string, credentialFilePath: string) {

    try {
      const org: string = orgName;
      const credential = JSON.parse(fs.readFileSync(credentialFilePath));      
    //   const user = enrollId;
    //   const pw: string = enrollSecret;
      //const { serviceDiscovery } = fabricConfig;

      // user enroll and import if identity not found in wallet
    //   const idExists = await wallet.identityExists(user);
      const idExists = false;
      if (!idExists) {
        // logger.debug(`Enrolling and importing ${user} into wallet`);
        const privateKey = wallet.getPrivateKey(credentialFilePath);
        const publicCert = wallet.getPublicCert(credentialFilePath);
        await wallet.importIdentity("authUser", org, publicCert, privateKey);
      }

      // gateway and contract connection
       const connect: any = await this.gateway.connect(commConnProfilePath, {
        identity: "authUser",
        wallet: wallet.getWallet(),
        discovery: { // https://fabric-sdk-node.github.io/release-1.4/module-fabric-network.Gateway.html#~DiscoveryOptions
          enabled: true,  //serviceDiscovery.enabled,           //change
          asLocalhost: false  //serviceDiscovery.asLocalhost,   //change
        },
      });

      return this.gateway;

    } catch (err) {
      throw new Error(err.message);
    }
  
  }
}
exports.CreateGateway = CreateGateway;
// module.exports = CreateGateway;
