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
const config = require('config');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
//fix this
const fsWallet = new FileSystemWallet(`/Users/marcjabbour/Downloads/fabric-cli-master-functional/dist/wallet`);
//const fsWallet = new FileSystemWallet(`${__dirname}/../wallet`);     //Need to read from elsewhere ***** is this correct ??
const logger = log4js.getLogger('helpers - wallet');
logger.setLevel(config.logLevel);

/**
 * Wallet object
 */
const wallet = {};

/**
 * Return FileSystemWallet object
 */
wallet.getWallet = () => {
  console.log('entering >>> getWallet()');
  return fsWallet;
};

/**
 *
 * @param {string} id - label of id in wallet
 */
wallet.identityExists = async (id) => {
  console.log('entering >>> identityExists()');
  const exists = await fsWallet.exists(id);
  console.log(`${id} exists in wallet: ${exists}`);
  return exists;
};

/**
 *
 * @param {string} id - label of id importing into wallet
 * @param {string} org - org that id belongs to
 * @param {string} cert - cert from enrolling user
 * @param {string} key - key from enrolling user
 */
wallet.importIdentity = async (id, org, cert, key) => {
  console.log('entering >>> importIdentity()');
  try {
    console.log(`Importing ${id} into wallet`);
    await fsWallet.import(id, X509WalletMixin.createIdentity(org, cert, key));
  } catch (err) {
    console.log(`Error importing ${id} into wallet: ${err}`);
    throw new Error(err);
  }
};

console.log(wallet);

module.exports = wallet;
