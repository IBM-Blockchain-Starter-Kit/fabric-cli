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


const config = require('config');
const { Gateway } = require('fabric-network');

const util = require(`../helpers/util`);
const walletHelper = require(`../helpers/wallet`);
const helper = require('./FabricHelper');


/**
 * FabricRoutes class that handles creating routes that need to connect to the
 * fabric network. Parses the fabric-connections.json file to create the routes
 * with the appropriate middleware to connect to the fabric network and get access
 * to the specified channels and smart contracts - removing the logic from the route
 * controllers.
 */
class CreateGateway {

  constructor() {
    this.gateway = new Gateway();
    console.log('Setup Gateway constructor called...')
  }

  // /**
  //  * Connect the gateway instance. After creating the middlewares, it will create the routes with
  //  * the connection middleware and the existing router with controllers and other midddlwares
  //  */
  // async setup() {
  //   console.log('entering >>> setup()');

  //   // create and connect gateway
  //   await this.setupGateway();
  // }

  /**
   * Connect the gateway instance
   */
  async setupGateway(commConnProfilePath, orgName, enrollId, enrollSecret) {
    console.log('entering >>> setupGateway()');

    try {
      const org = orgName;
      const user = enrollId; 
      const pw = enrollSecret;
      //const { serviceDiscovery } = fabricConfig;

      // user enroll and import if identity not found in wallet
      const idExists = await walletHelper.identityExists(user);
      if (!idExists) {
        //const a = helper.getOrgAdmin();
        console.log(`Enrolling and importing ${user} into wallet`);
        const enrollInfo = await util.userEnroll(org, user, pw, commConnProfilePath);
        const privKeyTest = "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgFLXfsgFgi+U+rEuV\nEpabG+Ke05+pvnX8hY9DCLt34uehRANCAATwtDtbrgAkGQeaPmQmEWg6jzrzyEbq\na47FrjjpxbbmSMVgpsKaVIzJgtDhr7FhB3zJhMe11JNeqJiwOr9pIEbw\n-----END PRIVATE KEY-----"
        const pubCertTest = "-----BEGIN CERTIFICATE-----\nMIICTjCCAfWgAwIBAgIUaQszw6+ihThwx8tOz7fEEQbIiwswCgYIKoZIzj0EAwIw\naDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\nY2Etc2VydmVyMB4XDTE5MDYyODE1NDAwMFoXDTIwMDYyNzE1NDUwMFowJTEPMA0G\nA1UECxMGY2xpZW50MRIwEAYDVQQDEwlvcmcxYWRtaW4wWTATBgcqhkjOPQIBBggq\nhkjOPQMBBwNCAATwtDtbrgAkGQeaPmQmEWg6jzrzyEbqa47FrjjpxbbmSMVgpsKa\nVIzJgtDhr7FhB3zJhMe11JNeqJiwOr9pIEbwo4G/MIG8MA4GA1UdDwEB/wQEAwIH\ngDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBTt0M7zdu0JW2mRobuDwvIca80LojAf\nBgNVHSMEGDAWgBQ+bb2aLQYRG4405S9aRf40b2N3ajBcBggqAwQFBgcIAQRQeyJh\ndHRycyI6eyJoZi5BZmZpbGlhdGlvbiI6IiIsImhmLkVucm9sbG1lbnRJRCI6Im9y\nZzFhZG1pbiIsImhmLlR5cGUiOiJjbGllbnQifX0wCgYIKoZIzj0EAwIDRwAwRAIg\ndsz1AeXW36Siv/Zm/v+0GkGQLzgraTKe1qkBaR8wjNgCIG8qR4CvPymr8J+0DJwu\nxpVP5HUEqEusB3xzo4gD/dEp\n-----END CERTIFICATE-----"
        //await walletHelper.importIdentity(user, org, enrollInfo.certificate, enrollInfo.key);
        await walletHelper.importIdentity(user, org, pubCertTest, privKeyTest);
      }

      // gateway and contract connection
      console.log('Connecting to gateway');
      await this.gateway.connect(commConnProfilePath, {
        identity: user,
        wallet: walletHelper.getWallet(),
        discovery: { // https://fabric-sdk-node.github.io/release-1.4/module-fabric-network.Gateway.html#~DiscoveryOptions
          enabled: true,  //serviceDiscovery.enabled,           //change
          asLocalhost: false  //serviceDiscovery.asLocalhost,   //change
        },
      });
      console.log('Setup Gateway connected...');
      console.log('Connected to gateway');

      return this.gateway;

    } catch (err) {
      //logger.error(err.message);
      console.log(err.message);
      throw new Error(err.message);
    }

    console.log('exiting <<< setupGateway()');
  }

  

}

exports.CreateGateway = CreateGateway;

