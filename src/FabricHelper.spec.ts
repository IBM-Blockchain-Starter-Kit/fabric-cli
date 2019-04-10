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

let fabricHelper: FabricHelper;

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
