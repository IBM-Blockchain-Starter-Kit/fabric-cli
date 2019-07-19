import FabricHelper from '../src/lib/FabricHelper';
import * as path from 'path';
import { Gateway } from 'fabric-network';
import * as FabricClient from 'fabric-client';
import { instantiateChaincode } from '../src/lib/instantiate-chaincode';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

const helper: FabricHelper = new FabricHelper(
    '/Users/marcjabbour/Downloads/fabric-cli-master-functional/examples/Org1-Connection-Profile.json',
    'channel1',
    path.join('/Users/marcjabbour', 'fabric-client-kvs'),
    'org1msp',
    '/Users/marcjabbour/Downloads/Org1-Admin-Identity.json'
);

describe('InstantiateTest', async () => {

    let connectionProfilePath;
    let channelName;
    let chaincodeName;
    let chaincodeVersion;
    let orgName;
    let chaincodeType;
    let credentialFilePath;
    let functionName;
    let args;
    let timeout;
    let endorsementPolicy;


    beforeEach(() => {
         connectionProfilePath = '/Users/marcjabbour/Downloads/fabric-cli-master-functional/examples/Org1-Connection-Profile.json';
         channelName = 'channel1';
         chaincodeName = 'MarcTesting';
         chaincodeVersion = '1';
         orgName = 'org1msp';
         chaincodeType = 'node';
         credentialFilePath = '/Users/marcjabbour/Downloads/Org1-Admin-Identity.json';
         functionName = 'initLedger';
         args = null;
         timeout = 1200;
         endorsementPolicy = null;
    })

    describe('#instantiateChaincode', () => {

        it('should return true', async () => {
            await instantiateChaincode(connectionProfilePath, channelName, chaincodeName, chaincodeVersion, functionName, args, orgName, timeout, endorsementPolicy, chaincodeType, credentialFilePath).should.be.true;
        });
        it('should return false', async () => {
            await instantiateChaincode(connectionProfilePath, channelName, chaincodeName, chaincodeVersion, 'fakeFunction', args, orgName, timeout, endorsementPolicy, chaincodeType, credentialFilePath).should.be.false;
        });
    })

    


})
