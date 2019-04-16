import * as FabricClient from 'fabric-client';
import { installChaincode } from './install-chaincode';
import FabricHelper from './FabricHelper';

const EXAMPLE_CHAINCODE_PATH = '/tmp/my_chaincode_src_dir/';
const EXAMPLE_CHAINCODE_NAME = 'examplechaincode';
const EXAMPLE_CHAINCODE_VERSION = '002';
const EXAMPLE_CHANNEL_NAME = 'examplechannel';
const EXAMPLE_CRYPTO_DIR_PATH = `${__dirname}`;

const PATH_TO_EXAMPLE_NETWORK_CONFIG = `${__dirname}/../testData/example-network-config.json`;
let exampleNetworkConfig: any = require(PATH_TO_EXAMPLE_NETWORK_CONFIG);
exampleNetworkConfig = exampleNetworkConfig['network-config'];

const EXAMPLE_ORGS = ['org1', 'org2', 'org3'];

describe('Install chaincode', () => {
    describe('installChaincode', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });
        it('should build the request correctly', async () => {
            (FabricClient.prototype.installChaincode as any) = jest.fn();
            (FabricHelper.inspectProposalResponses as any) = jest.fn();
            (FabricClient.Channel.prototype.getPeers as any) = jest.fn(() => {
                return [];
            });

            const exampleRequest: FabricClient.ChaincodeInstallRequest = {
                targets: [],
                chaincodePath: EXAMPLE_CHAINCODE_PATH,
                chaincodeId: EXAMPLE_CHAINCODE_NAME,
                chaincodeVersion: EXAMPLE_CHAINCODE_VERSION
            };

            await installChaincode(
                PATH_TO_EXAMPLE_NETWORK_CONFIG,
                EXAMPLE_CHANNEL_NAME,
                EXAMPLE_CHAINCODE_NAME,
                EXAMPLE_CHAINCODE_PATH,
                EXAMPLE_CHAINCODE_VERSION,
                exampleNetworkConfig[EXAMPLE_ORGS[0]].mspid,
                EXAMPLE_CRYPTO_DIR_PATH
            );

            expect(FabricClient.prototype.installChaincode).toBeCalledTimes(1);
            expect(FabricClient.prototype.installChaincode).toBeCalledWith(
                exampleRequest
            );
        });

        it('should build the request correctly', async () => {
            (FabricClient.prototype.installChaincode as any) = jest.fn();
            (FabricHelper.inspectProposalResponses as any) = jest.fn();
            (FabricClient.Channel.prototype.getPeers as any) = jest.fn(() => {
                return [];
            });

            await installChaincode(
                PATH_TO_EXAMPLE_NETWORK_CONFIG,
                EXAMPLE_CHANNEL_NAME,
                EXAMPLE_CHAINCODE_NAME,
                EXAMPLE_CHAINCODE_PATH,
                EXAMPLE_CHAINCODE_VERSION,
                exampleNetworkConfig[EXAMPLE_ORGS[0]].mspid,
                EXAMPLE_CRYPTO_DIR_PATH
            );

            expect(FabricHelper.inspectProposalResponses).toBeCalledTimes(1);
        });

        it('should throw an error if client.installChaincode() fails', async () => {
            const testError = new Error('Test Error');
            const expectedError = new Error(
                `Failed to send install proposal due to error: ${testError}`
            );
            (FabricClient.prototype.installChaincode as any) = jest.fn(() => {
                throw testError;
            });

            await expect(
                installChaincode(
                    PATH_TO_EXAMPLE_NETWORK_CONFIG,
                    EXAMPLE_CHANNEL_NAME,
                    EXAMPLE_CHAINCODE_NAME,
                    EXAMPLE_CHAINCODE_PATH,
                    EXAMPLE_CHAINCODE_VERSION,
                    exampleNetworkConfig[EXAMPLE_ORGS[0]].mspid,
                    EXAMPLE_CRYPTO_DIR_PATH
                )
            ).rejects.toThrow(expectedError);
        });
    });
});
