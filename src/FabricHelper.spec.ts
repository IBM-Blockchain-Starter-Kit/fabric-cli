import FabricHelper from './FabricHelper';
import * as FabricClient from 'fabric-client';

const PATH_TO_EXAMPLE_NETWORK_CONFIG = `${__dirname}/../testData/example-network-config.json`;
let exampleNetworkConfig: any = require(PATH_TO_EXAMPLE_NETWORK_CONFIG);
exampleNetworkConfig = exampleNetworkConfig['network-config'];

const EXAMPLE_ORGS = ['org1', 'org2', 'org3'];
const EXAMPLE_UNKNOWN_ORG = 'orgUnknown';
const EXAMPLE_CHANNEL_NAME = 'examplechannel';
const EXAMPLE_KEY_VALUE_STORE_BASE_PATH = `${__dirname}/../testData`;
const EXAMPLE_CRYPTO_DIR_PATH = `${__dirname}`;
const EXAMPLE_ORG_MSP = 'exampleOrgMSP';

const examplePeer1 = new FabricClient.Peer('grpc://peer1.example.com', {
    name: 'peer1'
});
const examplePeer2 = new FabricClient.Peer('grpc://peer2.example.com', {
    name: 'peer2'
});

const exampleProposalResponse1: any = {
    response: { status: 200 }
};
const exampleProposalResponse2: any = {
    response: { status: 200 }
};

const exampleErrorProposalResponse1: Error = new Error('Bad response');

const exampleBadProposalResponse1: any = {
    response: { status: 400 }
};

const exampleProposalResponses = [
    [exampleProposalResponse1, exampleProposalResponse2]
];

const exampleProposalResponsesWithError = [
    [
        exampleProposalResponse1,
        exampleErrorProposalResponse1,
        exampleProposalResponse2
    ]
];

const exampleProposalResponsesWithBad = [
    [
        exampleProposalResponse1,
        exampleBadProposalResponse1,
        exampleProposalResponse2
    ]
];

let fabricHelper: FabricHelper;
let client: FabricClient;
let exampleChannel: FabricClient.Channel;
let expectedError: Error;

describe(`FabricHelper Static Functions`, () => {
    describe(`getPeerNamesAsStringForChannel`, () => {
        it('should return a comma delimited string of peers on a channel', () => {
            client = new FabricClient();
            exampleChannel = client.newChannel(EXAMPLE_CHANNEL_NAME);

            exampleChannel.addPeer(examplePeer1, EXAMPLE_ORG_MSP);
            exampleChannel.addPeer(examplePeer2, EXAMPLE_ORG_MSP);

            const result = FabricHelper.getPeerNamesAsStringForChannel(
                exampleChannel
            );

            expect(result).toBe('peer1,peer2');
        });
    });
    describe(`registerAndConnectTxEventHub`, () => {
        beforeAll(() => {
            (FabricClient.ChannelEventHub.prototype
                .registerTxEvent as any) = jest.fn();
            (FabricClient.ChannelEventHub.prototype.connect as any) = jest.fn();

            client = new FabricClient();
            exampleChannel = client.newChannel(EXAMPLE_CHANNEL_NAME);
            exampleChannel.addPeer(examplePeer1, EXAMPLE_ORG_MSP);

            FabricHelper.registerAndConnectTxEventHub(exampleChannel, 'Tx1');
        });
        afterAll(() => {
            jest.clearAllMocks();
        });
        it('should call eventHub.registerTxEvent() once', () => {
            expect(
                FabricClient.ChannelEventHub.prototype.registerTxEvent
            ).toBeCalledTimes(1);
        });

        it('should call eventHub.connect() once', () => {
            expect(
                FabricClient.ChannelEventHub.prototype.connect
            ).toBeCalledTimes(1);
        });
    });
    describe(`inspectProposalResponses`, () => {
        it('should return undefined when all responses are good', () => {
            expect(
                // Ignoring types for this to simplify the test data. Only response object inspected in function.
                // @ts-ignore
                FabricHelper.inspectProposalResponses(exampleProposalResponses)
            ).toBeUndefined();
        });

        it('should throw an error if an Error is in the proposalResponses', () => {
            const callFunc = () => {
                FabricHelper.inspectProposalResponses(
                    // Ignoring types for this to simplify the test data. Only response object inspected in function.
                    // @ts-ignore
                    exampleProposalResponsesWithError
                );
            };

            expectedError = new Error(
                'Failed to send instantiate/upgrade Proposal or receive valid response: Bad response'
            );

            expect(callFunc).toThrowError(expectedError);
        });

        it("should throw an error if any of the proposal responses don't have status of 200", () => {
            const callFunc = () => {
                FabricHelper.inspectProposalResponses(
                    // Ignoring types for this to simplify the test data. Only response object inspected in function.
                    // @ts-ignore
                    exampleProposalResponsesWithBad
                );
            };

            expectedError = new Error(
                'Response null or has a status not equal to 200: { response: { status: 400 } }'
            );

            expect(callFunc).toThrowError(expectedError);
        });
    });
    describe(`sendChaincodeProposalToPeers`, () => {
        const exampleDeploymentOptions: any = {};

        beforeAll(() => {
            (FabricClient.Channel.prototype
                .sendUpgradeProposal as any) = jest.fn();
            (FabricClient.Channel.prototype
                .sendInstantiateProposal as any) = jest.fn();

            client = new FabricClient();
            exampleChannel = client.newChannel(EXAMPLE_CHANNEL_NAME);
        });

        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should send an upgrade proposal when the upgrade argument is true', async () => {
            await FabricHelper.sendChaincodeProposalToPeers(
                exampleChannel,
                exampleDeploymentOptions,
                true
            );

            expect(
                FabricClient.Channel.prototype.sendUpgradeProposal
            ).toBeCalledTimes(1);
            expect(
                FabricClient.Channel.prototype.sendInstantiateProposal
            ).toBeCalledTimes(0);
        });

        it('should send an upgrade proposal when the upgrade argument is true', async () => {
            await FabricHelper.sendChaincodeProposalToPeers(
                exampleChannel,
                exampleDeploymentOptions,
                false
            );

            expect(
                FabricClient.Channel.prototype.sendUpgradeProposal
            ).toBeCalledTimes(0);
            expect(
                FabricClient.Channel.prototype.sendInstantiateProposal
            ).toBeCalledTimes(1);
        });
    });
});

describe(`FabricHelper`, () => {
    beforeAll(() => {
        fabricHelper = new FabricHelper(
            PATH_TO_EXAMPLE_NETWORK_CONFIG,
            EXAMPLE_CHANNEL_NAME,
            EXAMPLE_KEY_VALUE_STORE_BASE_PATH,
            EXAMPLE_CRYPTO_DIR_PATH
        );
    });

    describe(`Constructor`, () => {
        describe(`Client setup`, () => {
            it(`should create a client for each org given`, () => {
                expect(
                    fabricHelper.getClientForOrg(EXAMPLE_ORGS[0])
                ).toBeInstanceOf(FabricClient);

                expect(
                    fabricHelper.getClientForOrg(EXAMPLE_ORGS[1])
                ).toBeInstanceOf(FabricClient);

                expect(
                    fabricHelper.getClientForOrg(EXAMPLE_ORGS[2])
                ).toBeInstanceOf(FabricClient);
            });

            it(`should not create a client for an orderer org`, () => {
                expect(
                    fabricHelper.getClientForOrg('orderer')
                ).not.toBeDefined();
            });
        });

        describe(`Channel setup`, () => {
            it('should create a channel for each org', () => {
                expect(
                    fabricHelper.getChannelForOrg(EXAMPLE_ORGS[0])
                ).toBeInstanceOf(FabricClient.Channel);
                expect(
                    fabricHelper.getChannelForOrg(EXAMPLE_ORGS[0]).getName()
                ).toBe(EXAMPLE_CHANNEL_NAME);

                expect(
                    fabricHelper.getChannelForOrg(EXAMPLE_ORGS[1])
                ).toBeInstanceOf(FabricClient.Channel);
                expect(
                    fabricHelper.getChannelForOrg(EXAMPLE_ORGS[1]).getName()
                ).toBe(EXAMPLE_CHANNEL_NAME);

                expect(
                    fabricHelper.getChannelForOrg(EXAMPLE_ORGS[2])
                ).toBeInstanceOf(FabricClient.Channel);
                expect(
                    fabricHelper.getChannelForOrg(EXAMPLE_ORGS[2]).getName()
                ).toBe(EXAMPLE_CHANNEL_NAME);
            });
        });
    });

    describe(`Methods`, () => {
        describe(`getClientForOrg`, () => {
            it(`should return a client for a known org`, () => {
                const fabricClient = fabricHelper.getClientForOrg(
                    EXAMPLE_ORGS[0]
                );

                expect(fabricClient).toBeInstanceOf(FabricClient);
            });

            it(`should return undefined for an unknown org`, () => {
                const fabricClient = fabricHelper.getClientForOrg(
                    EXAMPLE_UNKNOWN_ORG
                );

                expect(fabricClient).not.toBeDefined();
            });
        });

        describe(`getChannelForOrg`, () => {
            it(`should return a channel for a known org`, () => {
                const channel = fabricHelper.getChannelForOrg(EXAMPLE_ORGS[0]);

                expect(channel).toBeInstanceOf(FabricClient.Channel);
            });

            it(`should return undefined for an unknown org`, () => {
                const channel = fabricHelper.getChannelForOrg(
                    EXAMPLE_UNKNOWN_ORG
                );

                expect(channel).not.toBeDefined();
            });
        });

        describe(`getOrgAdmin`, () => {
            it('should return an admin user if one exists for a known org', async () => {
                const admin = await fabricHelper.getOrgAdmin(EXAMPLE_ORGS[0]);

                expect(admin).toBeInstanceOf(FabricClient.User);
                expect(admin.getName()).toBe(`peer${EXAMPLE_ORGS[0]}Admin`);
                expect(admin.getIdentity().getMSPId()).toBe(
                    `${exampleNetworkConfig[EXAMPLE_ORGS[0]].mspid}`
                );
            });
            it('should throw an error when retrieving an admin for an unknown org', async () => {
                await expect(
                    fabricHelper.getOrgAdmin(EXAMPLE_UNKNOWN_ORG)
                ).rejects.toThrow(
                    new Error(`Unknown Org: ${EXAMPLE_UNKNOWN_ORG}`)
                );
            });
        });
    });
});
