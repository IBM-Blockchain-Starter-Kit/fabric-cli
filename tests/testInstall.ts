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
const expect = require('chai').expect;
var spy = sinon.inspectProposalResponses();


describe('InstallTest', async () => {

    let EXAMPLE_CONNECTION_PROFILE_PATH = '/Users/marcjabbour/Downloads/fabric-cli-master-functional/examples/Org1-Connection-Profile.json';
    let EXAMPLE_CHANNEL_NAME = 'channel1';
    let EXAMPLE_CHAINCODE_NAME = 'MarcTesting';
    let EXAMPLE_CHAINCODE_PATH = '/Users/marcjabbour/Downloads/T3-fabric-samples-release-1.4/chaincode/fabcar/typescript';
    let EXAMPLE_CHAINCODE_VERSION = '1';
    let EXAMPLE_ORGNAME = 'org1msp';
    let EXAMPLE_CHAINCODE_TYPE : FabricClient.ChaincodeType = "node";
    let EXAMPLE_CREDENTIAL_FILE_PATH = '/Users/marcjabbour/Downloads/Org1-Admin-Identity.json';

    // const helper: FabricHelper = new FabricHelper(
    //     '/Users/marcjabbour/Downloads/fabric-cli-master-functional/examples/Org1-Connection-Profile.json',
    //     'channel1',
    //     path.join('/Users/marcjabbour', 'fabric-client-kvs'),
    //     'org1msp',
    //     '/Users/marcjabbour/Downloads/Org1-Admin-Identity.json'
    // );

    describe('#installChaincode', () => {

        beforeAll(() => {
            (FabricHelper.prototype.getGateway as any) = jest.fn();
            (FabricHelper.prototype.getOrgAdmin as any) = jest.fn();
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call FabricClient.installChaincode with the expected request', async () => {
            const exampleRequest: FabricClient.ChaincodeInstallRequest = {
                targets: [],
                chaincodePath: EXAMPLE_CHAINCODE_PATH,
                chaincodeId: EXAMPLE_CHAINCODE_NAME,
                chaincodeVersion: EXAMPLE_CHAINCODE_VERSION,
                chaincodeType: EXAMPLE_CHAINCODE_TYPE
            };

            await installChaincode(
                EXAMPLE_CONNECTION_PROFILE_PATH,
                EXAMPLE_CHANNEL_NAME,
                EXAMPLE_CHAINCODE_NAME,
                EXAMPLE_CHAINCODE_PATH,
                EXAMPLE_CHAINCODE_VERSION,
                EXAMPLE_ORGNAME,
                EXAMPLE_CHAINCODE_TYPE,
                EXAMPLE_CREDENTIAL_FILE_PATH
            );

            expect(FabricClient.prototype.installChaincode).toBeCalledTimes(1);
            expect(FabricClient.prototype.installChaincode).toBeCalledWith(exampleRequest);

        });

        /*
        it('should return a gateway object', async () => {
            //arrange
            await sinon.stub(FabricHelper.prototype, 'getGateway').callsFake(() => 1);
            await sinon.stub(FabricHelper.prototype, 'getOrgAdmin').callsFake((orgName, credentialFilePath) => 1)
            //act
            await installChaincode(EXAMPLE_CONNECTION_PROFILE_PATH, EXAMPLE_CHANNEL_NAME, EXAMPLE_CHAINCODE_NAME, EXAMPLE_CHAINCODE_PATH, EXAMPLE_CHAINCODE_VERSION, EXAMPLE_ORGNAME, EXAMPLE_CHAINCODE_TYPE, EXAMPLE_CREDENTIAL_FILE_PATH);
            //assert
            sinon.assert.calledOnce(spy);

        })
        */

        // it('should return true', async () => {
        //     await installChaincode(connectionProfilePath, channelName, chaincodeName, chaincodePath, chaincodeVersion, orgName, chaincodeType, credentialFilePath).should.be.true;
        // });
        // it('should return true', async () => {
        //     await installChaincode(connectionProfilePath, null, chaincodeName, chaincodePath, chaincodeVersion, orgName, chaincodeType, credentialFilePath).should.be.true;
        // });
        // it('should return false', async () => {
        //     await installChaincode(connectionProfilePath, channelName, chaincodeName, null, chaincodeVersion, orgName, chaincodeType, credentialFilePath).should.be.false;
        // });
    })

    // describe('#installChaincodeOnPeersInRequest', async () => {
    //     let gateway: Gateway = await helper.getGateway();
    //     let client : FabricClient = gateway.getClient();
    //     let installTargetPeers: FabricClient.Peer[] = client.getPeersForOrg('org1msp')
    //     let request: FabricClient.ChaincodeInstallRequest = {
    //         targets: installTargetPeers,
    //         chaincodePath: '/Users/marcjabbour/Downloads/T3-fabric-samples-release-1.4/chaincode/fabcar/typescript',
    //         chaincodeId: 'MarcTesting',
    //         chaincodeVersion: '1',
    //         chaincodeType: 'node'
    //     };

    //     // it('should return true', async () => {
    //     //     await installChaincodeOnPeersInRequest()
    //     // })

    // })

    


})
