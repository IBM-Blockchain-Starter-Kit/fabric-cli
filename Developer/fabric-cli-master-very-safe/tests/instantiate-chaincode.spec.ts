import * as FabricClient from 'fabric-client';
import { DEFAULT_CHAINCODE_TYPE } from '../src/lib/constants';
import FabricHelper from '../src/lib/FabricHelper';
import { instantiateChaincode } from '../src/lib/instantiate-chaincode';
import { Gateway, Network } from 'fabric-network';

const EXAMPLE_CONNECTION_PROFILE_PATH = `${__dirname}/../updatedTestData/connection-profile.json`;
const EXAMPLE_ORGNAME = 'org1msp';
const EXAMPLE_CREDENTIAL_FILE_PATH = `${__dirname}/../updatedTestData/admin-identity-file.json`;
const EXAMPLE_CHAINCODE_NAME = 'UnitTests1';
const EXAMPLE_CHAINCODE_VERSION = 2;
const EXAMPLE_CHANNEL_NAME = 'channel1';
const EXAMPLE_ARGS = [];
const EXAMPLE_FUNCTION_NAME = '';
const EXAMPLE_FUNCTION_NAME_NOT_EMPTY = 'init'
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

let exampleConnectionProfile: any = require(EXAMPLE_CONNECTION_PROFILE_PATH);
exampleConnectionProfile = exampleConnectionProfile['conn-profile'];

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
    const gatewayMock = Gateway.prototype;
    const clientMock = FabricClient.prototype;
    const networkMock: Network = {
        getChannel: jest.fn(),
        getContract: jest.fn(),
        addBlockListener: jest.fn(),
        addCommitListener: jest.fn(),
        unregisterAllEventListeners: jest.fn()
    };
    const userMock = FabricClient.User.prototype;

    //Mock data used to stub getPeers() and getName()
    const connectionOpts: FabricClient.ConnectionOpts = { pem: 'examplePem' };
    const channelObject = new FabricClient.Channel(EXAMPLE_CHANNEL_NAME, clientMock);
    const examplePeer = new FabricClient.Peer('grpcs://peerUrl', connectionOpts);
    channelObject.addPeer(examplePeer, 'org1msp');
    const exampleChannelPeer = channelObject.getPeer('peerUrl')
    const exampleChannelPeerArray: FabricClient.ChannelPeer[] = [];
    exampleChannelPeerArray[0] = exampleChannelPeer;

    beforeEach(async () => {
        (FabricClient.prototype.newTransactionID as any) = jest.fn(() => {
            return exampleTx;
        });

        (FabricClient.Channel.prototype.sendTransaction as any) = jest.fn();
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();
        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();
        (FabricHelper.inspectBroadcastResponse as any) = jest.fn();
        (FabricClient.Channel.prototype.sendInstantiateProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });
        (FabricClient.Channel.prototype.sendUpgradeProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });
        (FabricClient.prototype.installChaincode as any) = jest.fn();
        (FabricHelper.inspectProposalResponses as any) = jest.fn();
        (FabricHelper.prototype.getGateway as any) = jest.fn(() => {
            return gatewayMock;
        });
        (gatewayMock.getClient as any) = jest.fn(() => {
            return clientMock;
        });
        (gatewayMock.getNetwork as any) = jest.fn(() => {
            return networkMock;
        });
        (networkMock.getChannel as any) = jest.fn(() => {
            return channelObject;
        });
        (FabricHelper.prototype.getOrgAdmin as any) = jest.fn(() => {
            return userMock;
        });
        (FabricClient.prototype.getPeersForOrg as any) = jest.fn(() => {
            return [];
        });
        (channelObject.getPeers as any) = jest.fn(() => {
            return exampleChannelPeerArray;
        });
        (exampleChannelPeer.getName as any) = jest.fn(() => {
            return 'grpcs://peerUrl'
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should call sendChaincodeProposalToPeers', async () => {
        (FabricClient.Channel.prototype.queryInstantiatedChaincodes as any) = jest.fn(() => {
            return { chaincodes: [] } as FabricClient.ChaincodeQueryResponse;
        });
        (FabricHelper.inspectProposalResponses as any) = jest.fn();

        await instantiateChaincode(
            EXAMPLE_CONNECTION_PROFILE_PATH,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGNAME,
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            EXAMPLE_CHAINCODE_TYPE_NODE,
            EXAMPLE_CREDENTIAL_FILE_PATH
        );

        expect(FabricClient.Channel.prototype.sendTransaction).toBeCalledTimes(1);
        expect(FabricHelper.inspectProposalResponses).toBeCalledTimes(1);
        expect(FabricHelper.inspectProposalResponses).toBeCalledWith(exampleProposalResponses);
        expect(FabricHelper.registerAndConnectTxEventHub).toBeCalledTimes(1);
    });

    it('should call sendInstantiationProposal() with the expected request for instantiation', async () => {
        (FabricClient.Channel.prototype.queryInstantiatedChaincodes as any) = jest.fn(() => {
            return { chaincodes: [] } as FabricClient.ChaincodeQueryResponse;
        });

        await instantiateChaincode(
            EXAMPLE_CONNECTION_PROFILE_PATH,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGNAME,
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            EXAMPLE_CHAINCODE_TYPE_NODE,
            EXAMPLE_CREDENTIAL_FILE_PATH
        );

        expect(FabricClient.Channel.prototype.sendInstantiateProposal).toBeCalledTimes(1);
        expect(FabricClient.Channel.prototype.sendUpgradeProposal).toBeCalledTimes(0);
        expect(FabricClient.Channel.prototype.sendInstantiateProposal).toBeCalledWith(exampleDeploymentOptions, EXAMPLE_TIMEOUT);
    });

    it('should call sendUpgradeProposal() with the expected request for upgrade', async () => {
        (FabricClient.Channel.prototype.queryInstantiatedChaincodes as any) = jest.fn(() => {
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
            EXAMPLE_CONNECTION_PROFILE_PATH,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGNAME,
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            EXAMPLE_CHAINCODE_TYPE_NODE,
            EXAMPLE_CREDENTIAL_FILE_PATH
        );

        expect(FabricClient.Channel.prototype.sendInstantiateProposal).toBeCalledTimes(0);
        expect(FabricClient.Channel.prototype.sendUpgradeProposal).toBeCalledTimes(1);
        expect(FabricClient.Channel.prototype.sendUpgradeProposal).toBeCalledWith(exampleDeploymentOptions, EXAMPLE_TIMEOUT);
    });

    it('should default the chaincode type to \'golang\' when no chaincode type is given', async () => {
        (FabricClient.Channel.prototype.queryInstantiatedChaincodes as any) = jest.fn(() => {
            return { chaincodes: [] } as FabricClient.ChaincodeQueryResponse;
        });

        await instantiateChaincode(
            EXAMPLE_CONNECTION_PROFILE_PATH,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORGNAME,
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            DEFAULT_CHAINCODE_TYPE,
            EXAMPLE_CREDENTIAL_FILE_PATH
        );

        expect(FabricClient.Channel.prototype.sendInstantiateProposal).toBeCalledWith(exampleDeploymentOptionsDefaultChaincodeType, EXAMPLE_TIMEOUT);
    });

    it('should instantiate when an init function is provided', async () => {
        (FabricClient.Channel.prototype.queryInstantiatedChaincodes as any) = jest.fn(() => {
            return { chaincodes: [] } as FabricClient.ChaincodeQueryResponse;
        });

        await instantiateChaincode(
            EXAMPLE_CONNECTION_PROFILE_PATH,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_CHAINCODE_VERSION,
            EXAMPLE_FUNCTION_NAME_NOT_EMPTY,
            EXAMPLE_ARGS,
            EXAMPLE_ORGNAME,
            EXAMPLE_TIMEOUT,
            JSON.stringify(EXAMPLE_ENDORSEMENT_POLICY),
            DEFAULT_CHAINCODE_TYPE,
            EXAMPLE_CREDENTIAL_FILE_PATH
        );

        expect(FabricClient.Channel.prototype.sendInstantiateProposal).toBeCalledTimes(1);
    });
});
