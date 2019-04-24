import * as FabricClient from 'fabric-client';
import { DEFAULT_CHAINCODE_TYPE } from './constants';
import FabricHelper from './FabricHelper';
import { instantiateChaincode } from './instantiate-chaincode';

const EXAMPLE_CHAINCODE_NAME = 'examplechaincode';
const EXAMPLE_CHAINCODE_VERSION = 2;
const EXAMPLE_CHANNEL_NAME = 'examplechannel';
const EXAMPLE_CRYPTO_DIR_PATH = `${__dirname}/..`;
const EXAMPLE_ARGS = [];
const EXAMPLE_FUNCTION_NAME = '';
const EXAMPLE_TIMEOUT = 120000;
const EXAMPLE_ENDORSEMENT_POLICY = {
    identities: [
        { role: { name: 'member', mspId: 'org1' } },
        { role: { name: 'member', mspId: 'org2' } }
    ],
    policy: {
        '1-of': [{ 'signed-by': 0 }, { 'signed-by': 1 }]
    }
};
const EXAMPLE_CHAINCODE_TYPE_NODE = 'node';

const PATH_TO_EXAMPLE_NETWORK_CONFIG = `${__dirname}/../../testData/example-network-config.json`;
let exampleNetworkConfig: any = require(PATH_TO_EXAMPLE_NETWORK_CONFIG);
exampleNetworkConfig = exampleNetworkConfig['network-config'];

const EXAMPLE_ORGS = ['org1', 'org2', 'org3'];

const exampleProposalResponse1: any = {
    response: { status: 200 }
};
const exampleProposalResponse2: any = {
    response: { status: 200 }
};

const exampleProposal: any = {};

const exampleProposalResponses = [
    [exampleProposalResponse1, exampleProposalResponse2],
    exampleProposal
];

const exampleTx: FabricClient.TransactionId = {
    getTransactionID: jest.fn(() => {
        return 'testTxId';
    }),
    getNonce: jest.fn(),
    isAdmin: jest.fn()
};

const exampleDeploymentOptions: FabricClient.ChaincodeInstantiateUpgradeRequest = {
    chaincodeType: EXAMPLE_CHAINCODE_TYPE_NODE,
    chaincodeId: EXAMPLE_CHAINCODE_NAME,
    chaincodeVersion: EXAMPLE_CHAINCODE_VERSION.toString(),
    args: EXAMPLE_ARGS,
    txId: exampleTx,
    'endorsement-policy': EXAMPLE_ENDORSEMENT_POLICY
};

const exampleDeploymentOptionsDefaultChaincodeType: FabricClient.ChaincodeInstantiateUpgradeRequest = {
    chaincodeType: DEFAULT_CHAINCODE_TYPE,
    chaincodeId: EXAMPLE_CHAINCODE_NAME,
    chaincodeVersion: EXAMPLE_CHAINCODE_VERSION.toString(),
    args: EXAMPLE_ARGS,
    txId: exampleTx,
    'endorsement-policy': EXAMPLE_ENDORSEMENT_POLICY
};

describe('instantiateChaincode', () => {
    beforeEach(async () => {
        (FabricClient.prototype.newTransactionID as any) = jest.fn(() => {
            return exampleTx;
        });

        (FabricClient.Channel.prototype.sendTransaction as any) = jest.fn();
        // Mock as function tries to connect to non existent peers
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();

        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();
        (FabricHelper.inspectBroadcastResponse as any) = jest.fn();
        (FabricClient.Channel.prototype
            .sendInstantiateProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });
        (FabricClient.Channel.prototype.sendUpgradeProposal as any) = jest.fn(
            () => {
                return exampleProposalResponses;
            }
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should call sendChaincodeProposalToPeers', async () => {
        (FabricClient.Channel.prototype
            .queryInstantiatedChaincodes as any) = jest.fn(() => {
            return { chaincodes: [] } as FabricClient.ChaincodeQueryResponse;
        });

        (FabricHelper.inspectProposalResponses as any) = jest.fn();

        await instantiateChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGS[0],
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            EXAMPLE_CRYPTO_DIR_PATH,
            EXAMPLE_CHAINCODE_TYPE_NODE
        );

        expect(FabricClient.Channel.prototype.sendTransaction).toBeCalledTimes(
            1
        );
        expect(FabricHelper.inspectProposalResponses).toBeCalledTimes(1);
        expect(FabricHelper.inspectProposalResponses).toBeCalledWith(
            exampleProposalResponses
        );
        expect(FabricHelper.registerAndConnectTxEventHub).toBeCalledTimes(1);
    });

    it('should call sendInstantiationProposal() with the expected request for instantiation', async () => {
        (FabricClient.Channel.prototype
            .queryInstantiatedChaincodes as any) = jest.fn(() => {
            return { chaincodes: [] } as FabricClient.ChaincodeQueryResponse;
        });

        await instantiateChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGS[0],
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            EXAMPLE_CRYPTO_DIR_PATH,
            EXAMPLE_CHAINCODE_TYPE_NODE
        );

        expect(
            FabricClient.Channel.prototype.sendInstantiateProposal
        ).toBeCalledTimes(1);
        expect(
            FabricClient.Channel.prototype.sendUpgradeProposal
        ).toBeCalledTimes(0);
        expect(
            FabricClient.Channel.prototype.sendInstantiateProposal
        ).toBeCalledWith(exampleDeploymentOptions, EXAMPLE_TIMEOUT);
    });

    it('should call sendUpgradeProposal() with the expected request for upgrade', async () => {
        (FabricClient.Channel.prototype
            .queryInstantiatedChaincodes as any) = jest.fn(() => {
            return {
                chaincodes: [
                    {
                        name: EXAMPLE_CHAINCODE_NAME,
                        version: (EXAMPLE_CHAINCODE_VERSION - 1).toString(),
                        path: '',
                        input: '',
                        escc: '',
                        vscc: ''
                    } as FabricClient.ChaincodeInfo
                ]
            } as FabricClient.ChaincodeQueryResponse;
        });

        await instantiateChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGS[0],
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            EXAMPLE_CRYPTO_DIR_PATH,
            EXAMPLE_CHAINCODE_TYPE_NODE
        );

        expect(
            FabricClient.Channel.prototype.sendInstantiateProposal
        ).toBeCalledTimes(0);
        expect(
            FabricClient.Channel.prototype.sendUpgradeProposal
        ).toBeCalledTimes(1);
        expect(
            FabricClient.Channel.prototype.sendUpgradeProposal
        ).toBeCalledWith(exampleDeploymentOptions, EXAMPLE_TIMEOUT);
    });

    it('should default the chaincode type to \'golang\' when no chaincode type is given', async () => {
        (FabricClient.Channel.prototype
            .queryInstantiatedChaincodes as any) = jest.fn(() => {
            return { chaincodes: [] } as FabricClient.ChaincodeQueryResponse;
        });

        await instantiateChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGS[0],
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            EXAMPLE_CRYPTO_DIR_PATH
        );

        expect(
            FabricClient.Channel.prototype.sendInstantiateProposal
        ).toBeCalledWith(
            exampleDeploymentOptionsDefaultChaincodeType,
            EXAMPLE_TIMEOUT
        );
    });
});
