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
        console.log(`Enrolling and importing ${user} into wallet`);
        const enrollInfo = await util.userEnroll(org, user, pw, commConnProfilePath);
        //const certTest = "-----BEGIN CERTIFICATE-----\nMIICTjCCAfWgAwIBAgIUdBeDLHfk1FynJLkg7F9p0GNQiRwwCgYIKoZIzj0EAwIw\naDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\nY2Etc2VydmVyMB4XDTE5MDYxODEzNDMwMFoXDTIwMDYxNzEzNDgwMFowJTEPMA0G\nA1UECxMGY2xpZW50MRIwEAYDVQQDEwlvcmcxYWRtaW4wWTATBgcqhkjOPQIBBggq\nhkjOPQMBBwNCAASP4D3V1whXPdzu+B4BB9DK1pPMh3mZorsqCS5JFBfh2VfRugh2\nqoFRDlUmzyDAb0oVQkfXANZUnDtbHsLPdx3lo4G/MIG8MA4GA1UdDwEB/wQEAwIH\ngDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBRKOS//4KiXQbMtlOHvK5GEM6bHmTAf\nBgNVHSMEGDAWgBT0sUFXgDTx6EF4u0uwuucCu7KNsjBcBggqAwQFBgcIAQRQeyJh\ndHRycyI6eyJoZi5BZmZpbGlhdGlvbiI6IiIsImhmLkVucm9sbG1lbnRJRCI6Im9y\nZzFhZG1pbiIsImhmLlR5cGUiOiJjbGllbnQifX0wCgYIKoZIzj0EAwIDRwAwRAIg\nMGtrLb+7/A+fffqZTmh0Irgm+Q0/WkYN+KQgLD9dJzACIFMfSTX4UpqCux6/EoKB\np/0CwNOadovRjvyVSQDEpIyu\n-----END CERTIFICATE-----"//"-----BEGIN CERTIFICATE-----\nMIICTjCCAfWgAwIBAgIUdBeDLHfk1FynJLkg7F9p0GNQiRwwCgYIKoZIzj0EAwIw\naDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\nY2Etc2VydmVyMB4XDTE5MDYxODEzNDMwMFoXDTIwMDYxNzEzNDgwMFowJTEPMA0G\nA1UECxMGY2xpZW50MRIwEAYDVQQDEwlvcmcxYWRtaW4wWTATBgcqhkjOPQIBBggq\nhkjOPQMBBwNCAASP4D3V1whXPdzu+B4BB9DK1pPMh3mZorsqCS5JFBfh2VfRugh2\nqoFRDlUmzyDAb0oVQkfXANZUnDtbHsLPdx3lo4G/MIG8MA4GA1UdDwEB/wQEAwIH\ngDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBRKOS//4KiXQbMtlOHvK5GEM6bHmTAf\nBgNVHSMEGDAWgBT0sUFXgDTx6EF4u0uwuucCu7KNsjBcBggqAwQFBgcIAQRQeyJh\ndHRycyI6eyJoZi5BZmZpbGlhdGlvbiI6IiIsImhmLkVucm9sbG1lbnRJRCI6Im9y\nZzFhZG1pbiIsImhmLlR5cGUiOiJjbGllbnQifX0wCgYIKoZIzj0EAwIDRwAwRAIg\nMGtrLb+7/A+fffqZTmh0Irgm+Q0/WkYN+KQgLD9dJzACIFMfSTX4UpqCux6/EoKB\np/0CwNOadovRjvyVSQDEpIyu\n-----END CERTIFICATE-----";
        //const keyTest =  "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgRNAnY/QyPM3UeQL+\n3K/JXoyIbpOn9xwgmYpNgq8Gi9ShRANCAASP4D3V1whXPdzu+B4BB9DK1pPMh3mZ\norsqCS5JFBfh2VfRugh2qoFRDlUmzyDAb0oVQkfXANZUnDtbHsLPdx3l\n-----END PRIVATE KEY-----"//"-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgRNAnY/QyPM3UeQL+\n3K/JXoyIbpOn9xwgmYpNgq8Gi9ShRANCAASP4D3V1whXPdzu+B4BB9DK1pPMh3mZ\norsqCS5JFBfh2VfRugh2qoFRDlUmzyDAb0oVQkfXANZUnDtbHsLPdx3l\n-----END PRIVATE KEY-----";
        await walletHelper.importIdentity(user, org, enrollInfo.certificate, enrollInfo.key);
        //await walletHelper.importIdentity(user, org, certTest, keyTest);
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

