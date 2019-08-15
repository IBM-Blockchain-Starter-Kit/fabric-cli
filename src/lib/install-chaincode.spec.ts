import FabricHelper from './FabricHelper';
import * as FabricClient from 'fabric-client';
import { installChaincode } from './install-chaincode';
import { Gateway } from 'fabric-network';
import { DEFAULT_CHAINCODE_TYPE } from './constants';

let EXAMPLE_CONNECTION_PROFILE_PATH = '/Users/marcjabbour/Downloads/fabric-cli-master-functional/updatedTestData/connection-profile.json';
let EXAMPLE_CHANNEL_NAME = 'channel1';
let EXAMPLE_CHAINCODE_NAME = 'UnitTests1';
let EXAMPLE_CHAINCODE_PATH = '/Users/marcjabbour/Downloads/T3-fabric-samples-release-1.4/chaincode/fabcar/typescript';
let EXAMPLE_CHAINCODE_VERSION = '1';
let EXAMPLE_ORGNAME = 'org1msp';
let EXAMPLE_CHAINCODE_TYPE: FabricClient.ChaincodeType = "node";
let EXAMPLE_CREDENTIAL_FILE_PATH = '/Users/marcjabbour/Downloads/fabric-cli-master-functional/updatedTestData/admin-identity-file.json';


describe('InstallTest', () => {
    describe('#installChaincode', () => {
        let emptyGatewayObj = new Gateway();
        let emptyClientObj = new FabricClient();

        beforeAll(() => {
            (FabricClient.prototype.installChaincode as any) = jest.fn();
            (FabricHelper.inspectProposalResponses as any) = jest.fn();
            (FabricHelper.prototype.getGateway as any) = jest.fn(() => {
                return emptyGatewayObj;
            });
            (emptyGatewayObj.getClient as any) = jest.fn(()  =>  {
                return emptyClientObj;
            });
            (FabricHelper.prototype.getOrgAdmin as any) = jest.fn(() => {
                return new FabricClient.User(null);
            });
            (FabricClient.prototype.getPeersForOrg as any) = jest.fn(() => {
                return [];
            });
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
        it('should default the chaincodeType to "golang" if non is supplied', async () => {
            const exampleRequest: FabricClient.ChaincodeInstallRequest = {
                targets: [],
                chaincodePath: EXAMPLE_CHAINCODE_PATH,
                chaincodeId: EXAMPLE_CHAINCODE_NAME,
                chaincodeVersion: EXAMPLE_CHAINCODE_VERSION,
                chaincodeType: DEFAULT_CHAINCODE_TYPE
            };

            await installChaincode(
                EXAMPLE_CONNECTION_PROFILE_PATH,
                EXAMPLE_CHANNEL_NAME,
                EXAMPLE_CHAINCODE_NAME,
                EXAMPLE_CHAINCODE_PATH,
                EXAMPLE_CHAINCODE_VERSION,
                EXAMPLE_ORGNAME,
                DEFAULT_CHAINCODE_TYPE,
                EXAMPLE_CREDENTIAL_FILE_PATH
            );

            expect(FabricClient.prototype.installChaincode).toBeCalledTimes(1);
            expect(FabricClient.prototype.installChaincode).toBeCalledWith(
                exampleRequest
            );
        });
        it('should inspect the proposalResponses', async () => {
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

            expect(FabricHelper.inspectProposalResponses).toBeCalledTimes(1);
        });


        it('should throw an error if installChaincode fails', async () => {
            const testError = new Error('Test Error');
            const expectedError = new Error(
                `Error: Failed to send install proposal due to ${testError}`
            );
            (FabricClient.prototype.installChaincode as any) = jest.fn(() => {
                throw testError;
            });

            await expect(
                installChaincode(
                    EXAMPLE_CONNECTION_PROFILE_PATH,
                    EXAMPLE_CHANNEL_NAME,
                    EXAMPLE_CHAINCODE_NAME,
                    EXAMPLE_CHAINCODE_PATH,
                    EXAMPLE_CHAINCODE_VERSION,
                    EXAMPLE_ORGNAME,
                    EXAMPLE_CHAINCODE_TYPE,
                    EXAMPLE_CREDENTIAL_FILE_PATH
                )
            ).rejects.toThrow(expectedError);
        });
    });
});
