import FabricHelper from '../src/lib/FabricHelper';
import * as path from 'path';
import { Gateway } from 'fabric-network';
import * as FabricClient from 'fabric-client';
import { installChaincode } from '../src/lib/install-chaincode';

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

describe('InstallTest', async () => {

    let connectionProfilePath;
    let channelName;
    let channelNameNotExist;
    let chaincodeName;
    let chaincodePath;
    let chaincodeVersion;
    let orgName;
    let chaincodeType;
    let credentialFilePath;


    beforeEach(() => {
         connectionProfilePath = '/Users/marcjabbour/Downloads/fabric-cli-master-functional/examples/Org1-Connection-Profile.json';
         channelName = 'channel1';
         chaincodeName = 'MarcTesting';
         chaincodePath = '/Users/marcjabbour/Downloads/T3-fabric-samples-release-1.4/chaincode/fabcar/typescript';
         chaincodeVersion = '1';
         orgName = 'org1msp';
         chaincodeType = 'node';
         credentialFilePath = '/Users/marcjabbour/Downloads/Org1-Admin-Identity.json';
    })

    describe('#installChaincode', () => {

        it('should return true', async () => {
            await installChaincode(connectionProfilePath, channelName, chaincodeName, chaincodePath, chaincodeVersion, orgName, chaincodeType, credentialFilePath).should.be.true;
        });
        it('should return true', async () => {
            await installChaincode(connectionProfilePath, null, chaincodeName, chaincodePath, chaincodeVersion, orgName, chaincodeType, credentialFilePath).should.be.true;
        });
        it('should return false', async () => {
            await installChaincode(connectionProfilePath, channelNameNotExist, chaincodeName, null, chaincodeVersion, orgName, chaincodeType, credentialFilePath).should.be.false;
        });
    })

    describe('#installChaincodeOnPeersInRequest', async () => {
        let gateway: Gateway = await helper.getGateway();
        let client : FabricClient = gateway.getClient();
        let installTargetPeers: FabricClient.Peer[] = client.getPeersForOrg('org1msp')
        let request: FabricClient.ChaincodeInstallRequest = {
            targets: installTargetPeers,
            chaincodePath: '/Users/marcjabbour/Downloads/T3-fabric-samples-release-1.4/chaincode/fabcar/typescript',
            chaincodeId: 'MarcTesting',
            chaincodeVersion: '1',
            chaincodeType: 'node'
        };

        // it('should return true', async () => {
        //     await installChaincodeOnPeersInRequest()
        // })

    })

    


})
