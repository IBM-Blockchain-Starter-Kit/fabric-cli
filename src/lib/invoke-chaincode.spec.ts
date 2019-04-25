import * as FabricClient from 'fabric-client';
import FabricHelper from './FabricHelper';
import { invokeChaincode } from './invoke-chaincode';

const PATH_TO_EXAMPLE_NETWORK_CONFIG = `${__dirname}/../../testData/example-network-config.json`;
const EXAMPLE_CHANNEL_NAME = 'examplechannel';
const EXAMPLE_CHAINCODE_NAME = 'examplechaincode';
const EXAMPLE_FUNCTION_NAME = 'exampleFunction';
const EXAMPLE_ARGS = [];
const EXAMPLE_ORG = 'org1';
const IS_QUERY = true;
const NOT_QUERY = false;
const EXAMPLE_TIMEOUT = 120000;
const EXAMPLE_CRYPTO_DIR_PATH = `${__dirname}/..`;

const exampleResponsePayload = Buffer.from('Test payload');

const exampleProposalResponse1: any = {
    response: {
        status: 200,
        message: 'test response 1',
        payload: exampleResponsePayload
    }
};

const exampleProposalResponse2: any = {
    response: {
        status: 200,
        message: 'test response 2',
        payload: exampleResponsePayload
    }
};

const exampleBadProposalResponse1: any = {
    response: { status: 400 }
};

const exampleProposal: any = {};

const exampleProposalResponses = [
    [exampleProposalResponse1, exampleProposalResponse2],
    exampleProposal
];

const exampleProposalResponsesWithBad = [
    [
        exampleProposalResponse1,
        exampleBadProposalResponse1,
        exampleProposalResponse2
    ]
];

const exampleBroadcastResponse = {
    status: 'SUCCESS'
};

const exampleBroadcastResponseBad = {
    status: 'BAD',
    info: 'Test bad response'
};

const exampleInvokeResult = {
    message: 'test response 1',
    payload: 'Test payload',
    status: 200
};

const exampleTx: FabricClient.TransactionId = {
    getTransactionID: jest.fn(() => {
        return 'testTxId';
    }),
    getNonce: jest.fn(),
    isAdmin: jest.fn()
};

describe('invokeChaincode', () => {
    it(`should return a response object on successful invoke`, async () => {
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();
        (FabricClient.Channel.prototype
            .sendTransactionProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });
        (FabricClient.Channel.prototype.sendTransaction as any) = jest.fn(
            () => {
                return exampleBroadcastResponse;
            }
        );

        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();

        const result = await invokeChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORG,
            NOT_QUERY,
            EXAMPLE_TIMEOUT,
            EXAMPLE_CRYPTO_DIR_PATH
        );

        expect(result).toEqual(exampleInvokeResult);
    });

    it(`should call sendTransactionProposal with the expected request object`, async () => {
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();
        (FabricClient.Channel.prototype
            .sendTransactionProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });
        (FabricClient.Channel.prototype.sendTransaction as any) = jest.fn(
            () => {
                return exampleBroadcastResponse;
            }
        );

        (FabricClient.prototype.newTransactionID as any) = jest.fn(() => {
            return exampleTx;
        });

        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();

        await invokeChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORG,
            NOT_QUERY,
            EXAMPLE_TIMEOUT,
            EXAMPLE_CRYPTO_DIR_PATH
        );

        const request: FabricClient.ChaincodeInvokeRequest = {
            chaincodeId: EXAMPLE_CHAINCODE_NAME,
            args: EXAMPLE_ARGS,
            txId: exampleTx,
            fcn: EXAMPLE_FUNCTION_NAME
        };

        expect(
            FabricClient.Channel.prototype.sendTransactionProposal
        ).toBeCalledTimes(1);
        expect(
            FabricClient.Channel.prototype.sendTransactionProposal
        ).toBeCalledWith(request, EXAMPLE_TIMEOUT);
    });

    it(`should call channel.sendTransaction with the expected transaction request`, async () => {
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();
        (FabricClient.Channel.prototype
            .sendTransactionProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });
        (FabricClient.Channel.prototype.sendTransaction as any) = jest.fn(
            () => {
                return exampleBroadcastResponse;
            }
        );

        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();

        await invokeChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORG,
            NOT_QUERY,
            EXAMPLE_TIMEOUT,
            EXAMPLE_CRYPTO_DIR_PATH
        );

        const expectedTransactionRequest = {
            proposalResponses: exampleProposalResponses[0],
            proposal: exampleProposalResponses[1]
        };

        expect(FabricClient.Channel.prototype.sendTransaction).toBeCalledTimes(
            1
        );
        expect(FabricClient.Channel.prototype.sendTransaction).toBeCalledWith(
            expectedTransactionRequest,
            EXAMPLE_TIMEOUT
        );
    });

    it(`should not send transaction to channel if 'queryOnly' is true`, async () => {
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();
        (FabricClient.Channel.prototype
            .sendTransactionProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });
        (FabricClient.Channel.prototype.sendTransaction as any) = jest.fn(
            () => {
                return exampleBroadcastResponse;
            }
        );

        (FabricClient.prototype.newTransactionID as any) = jest.fn(() => {
            return exampleTx;
        });

        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();

        const result = await invokeChaincode(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_CHAINCODE_NAME,
            EXAMPLE_FUNCTION_NAME,
            EXAMPLE_ARGS,
            EXAMPLE_ORG,
            IS_QUERY,
            EXAMPLE_TIMEOUT,
            EXAMPLE_CRYPTO_DIR_PATH
        );

        expect(FabricClient.Channel.prototype.sendTransaction).toBeCalledTimes(
            0
        );
        expect(result).toEqual(exampleInvokeResult);
    });

    it(`should throw an error if a proposal response is bad`, async () => {
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();
        (FabricClient.Channel.prototype
            .sendTransactionProposal as any) = jest.fn(() => {
            return exampleProposalResponsesWithBad;
        });

        (FabricClient.prototype.newTransactionID as any) = jest.fn(() => {
            return exampleTx;
        });

        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();

        const expectedError = new Error(
            `Response null or has a status not equal to 200: { response: { status: 400 } }`
        );

        await expect(
            invokeChaincode(
                PATH_TO_EXAMPLE_NETWORK_CONFIG,
                EXAMPLE_CHANNEL_NAME,
                EXAMPLE_CHAINCODE_NAME,
                EXAMPLE_FUNCTION_NAME,
                EXAMPLE_ARGS,
                EXAMPLE_ORG,
                NOT_QUERY,
                EXAMPLE_TIMEOUT,
                EXAMPLE_CRYPTO_DIR_PATH
            )
        ).rejects.toThrow(expectedError);
    });

    it(`should throw an error if a broadcast response is bad`, async () => {
        (FabricClient.Channel.prototype.initialize as any) = jest.fn();
        (FabricClient.Channel.prototype
            .sendTransactionProposal as any) = jest.fn(() => {
            return exampleProposalResponses;
        });

        (FabricClient.prototype.newTransactionID as any) = jest.fn(() => {
            return exampleTx;
        });

        (FabricClient.Channel.prototype.sendTransaction as any) = jest.fn(
            () => {
                return exampleBroadcastResponseBad;
            }
        );

        (FabricHelper.registerAndConnectTxEventHub as any) = jest.fn();

        const expectedError = new Error(
            `sendTransaction returned with an invalid status code: ${
                exampleBroadcastResponseBad.status
            }: ${exampleBroadcastResponseBad.info}`
        );

        await expect(
            invokeChaincode(
                PATH_TO_EXAMPLE_NETWORK_CONFIG,
                EXAMPLE_CHANNEL_NAME,
                EXAMPLE_CHAINCODE_NAME,
                EXAMPLE_FUNCTION_NAME,
                EXAMPLE_ARGS,
                EXAMPLE_ORG,
                NOT_QUERY,
                EXAMPLE_TIMEOUT,
                EXAMPLE_CRYPTO_DIR_PATH
            )
        ).rejects.toThrow(expectedError);
    });
});
