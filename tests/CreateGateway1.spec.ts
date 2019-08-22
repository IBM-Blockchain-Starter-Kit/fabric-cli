import { CreateGateway } from '../src/lib/CreateGateway';
import FabricHelper from '../src/lib/FabricHelper';
import { FileSystemWallet, X509WalletMixin } from 'fabric-network';
import * as FabricClient from 'fabric-client';
import { isProperty } from "@babel/types";
import { installChaincode } from '../src/lib/install-chaincode';
import { userInfo } from 'os';
import { IdentityService } from 'fabric-network/node_modules/fabric-ca-client';
import { wallet, identityExist, importIdentity } from '../src/helpers/wallet';
import { Gateway } from 'fabric-network';
import * as connect from 'fabric-network'
import { create } from 'domain';
import * as GatewayOptions from 'fabric-network';


// import { GatewayOptions } from 'fabric-network';

// import * as walletHelper from '../src/helpers/wallet';
// import { wallet } from '../src/helpers/wallet';
import { config } from 'config';
// import * as CreateGateway from '../src/lib/CreateGateway';
// import * as gateway from '../src/lib/CreateGateway';
// import * as gateway from '../src/lib/CreateGateway';

// const wallet = walletHelper.wallet;
const fsWallet = new FileSystemWallet(`${__dirname}/../wallet`);

const gOptions = GatewayOptions;

// const { gateway } = require('../src/lib/CreateGateway');


// const  = gateway;
// import { gateway } from '../src/lib/CreateGateway';
// const gateway = CreateGateway.gateway;

//import { setupGateway } from '../src/lib/CreateGateway';


// const gatewayCreate = CreateGateway.
    const key = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tDQpNSUdIQWdFQU1CTUdCeXFHU000OUFnRUdDQ3FHU000OUF3RUhCRzB3YXdJQkFRUWdDMWcwbkVFSHJTS3dDZmQyDQpkdkgzSUFJUHlsVWNYbW9VUWNBRzJkUGJEcFNoUkFOQ0FBUnVxRCtmSDVaZWkrdWpMTExWbUVOQzNhNlYxd0o4DQp4eFVOdElhVHh2L3RsaXdHZ0JOK2pUYmdRMmxTbjRCVnNHelQ4RUJLbitsWEp1RWFyR1QwSmFISg0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQ0K";
    
    const cert = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tDQpNSUlDVHpDQ0FmV2dBd0lCQWdJVVMwSW1udDllZGlkS0RvTGtqb040OWJOWHVVc3dDZ1lJS29aSXpqMEVBd0l3DQphREVMTUFrR0ExVUVCaE1DVlZNeEZ6QVZCZ05WQkFnVERrNXZjblJvSUVOaGNtOXNhVzVoTVJRd0VnWURWUVFLDQpFd3RJZVhCbGNteGxaR2RsY2pFUE1BMEdBMVVFQ3hNR1JtRmljbWxqTVJrd0Z3WURWUVFERXhCbVlXSnlhV010DQpZMkV0YzJWeWRtVnlNQjRYRFRFNU1EY3hOakUxTXpJd01Gb1hEVEl3TURjeE5URTFNemN3TUZvd0pURVBNQTBHDQpBMVVFQ3hNR1kyeHBaVzUwTVJJd0VBWURWUVFERXdsdmNtY3hZV1J0YVc0d1dUQVRCZ2NxaGtqT1BRSUJCZ2dxDQpoa2pPUFFNQkJ3TkNBQVJ1cUQrZkg1WmVpK3VqTExMVm1FTkMzYTZWMXdKOHh4VU50SWFUeHYvdGxpd0dnQk4rDQpqVGJnUTJsU240QlZzR3pUOEVCS24rbFhKdUVhckdUMEphSEpvNEcvTUlHOE1BNEdBMVVkRHdFQi93UUVBd0lIDQpnREFNQmdOVkhSTUJBZjhFQWpBQU1CMEdBMVVkRGdRV0JCUk9UQUlzejFOanZ4VXZVODdSZDhLWEgzRWtEREFmDQpCZ05WSFNNRUdEQVdnQlFpNHZ1YU5xUlh3T09LOVRzU3ZoZ1QzZTNEZnpCY0JnZ3FBd1FGQmdjSUFRUlFleUpoDQpkSFJ5Y3lJNmV5Sm9aaTVCWm1acGJHbGhkR2x2YmlJNklpSXNJbWhtTGtWdWNtOXNiRzFsYm5SSlJDSTZJbTl5DQpaekZoWkcxcGJpSXNJbWhtTGxSNWNHVWlPaUpqYkdsbGJuUWlmWDB3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUloDQpBUFdocXFkT1BCUWt4SGV4ZGlxaUpGWkJCdGg4bUxMSnpja2IvZ3hpYUZsZ0FpQUJocE1UMVcxTHBwMnN0VisxDQpUdE00bFR6enpLQUhtZ2liRG02aFJ5bkY2QT09DQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tDQo";

    const EXAMPLE_COMM_CONN_PROFILE_PATH: string = '/Users/akeeme/Downloads/fabric-cli-NewFabricBranch/updatedTestData/connection-profile.json';
    const EXAMPLE_MSP_ID: string = 'org1msp';
    const EXAMPLE_ENROLL_ID: string = 'adminInfo';
    const EXAMPLE_ENROLL_SECRET: string = 'adminInfoPass';
    const EXAMPLE_CREDENTIAL_FILE_PATH: string = '/Users/akeeme/Downloads/Org1-Admin.json';
    const EXAMPLE_USER: string = EXAMPLE_ENROLL_ID;
    const EXAMPLE_ORG: string = EXAMPLE_MSP_ID;
    const EXAMPLE_PUBLIC_CERT: string = 'examplepubliccert11';
    const EXAMPLE_PRIVATE_KEY: string = 'exampleprivatekey33';
    const exampleRequest = {
        EXAMPLE_ENROLL_ID,
        EXAMPLE_MSP_ID,
        EXAMPLE_PUBLIC_CERT,
        EXAMPLE_PRIVATE_KEY
    };
    const createIdentity = {
        EXAMPLE_ENROLL_ID,
        EXAMPLE_PUBLIC_CERT,
        EXAMPLE_PRIVATE_KEY
    }
describe ('spectateSetUp', () => {
    // describe('#wallet', async () => {
    describe('SpectateSetUp', () => {
        
        beforeAll(() => {
            // (Gateway as any) = jest.fn();
            // (Gateway.prototype.connect as any) = jest.fn();
            
            (identityExist as any) = jest.fn(() => {
                return 12;
            });
            (importIdentity as any) = jest.fn(() => {
                return EXAMPLE_ENROLL_ID
                        EXAMPLE_MSP_ID
                        EXAMPLE_PUBLIC_CERT
                        EXAMPLE_PRIVATE_KEY
            });

            (fsWallet.import as any) = jest.fn(() => {
                return exampleRequest;
            });
    
            (wallet.getPrivateKey as any) = jest.fn(() => {
                return EXAMPLE_PRIVATE_KEY;
                // return "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tDQpNSUdIQWdFQU1CTUdCeXFHU000OUFnRUdDQ3FHU000OUF3RUhCRzB3YXdJQkFRUWdDMWcwbkVFSHJTS3dDZmQyDQpkdkgzSUFJUHlsVWNYbW9VUWNBRzJkUGJEcFNoUkFOQ0FBUnVxRCtmSDVaZWkrdWpMTExWbUVOQzNhNlYxd0o4DQp4eFVOdElhVHh2L3RsaXdHZ0JOK2pUYmdRMmxTbjRCVnNHelQ4RUJLbitsWEp1RWFyR1QwSmFISg0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQ0K"
            });
            (wallet.getPublicCert as any) = jest.fn(() => {
                return EXAMPLE_PUBLIC_CERT;
                // return "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tDQpNSUlDVHpDQ0FmV2dBd0lCQWdJVVMwSW1udDllZGlkS0RvTGtqb040OWJOWHVVc3dDZ1lJS29aSXpqMEVBd0l3DQphREVMTUFrR0ExVUVCaE1DVlZNeEZ6QVZCZ05WQkFnVERrNXZjblJvSUVOaGNtOXNhVzVoTVJRd0VnWURWUVFLDQpFd3RJZVhCbGNteGxaR2RsY2pFUE1BMEdBMVVFQ3hNR1JtRmljbWxqTVJrd0Z3WURWUVFERXhCbVlXSnlhV010DQpZMkV0YzJWeWRtVnlNQjRYRFRFNU1EY3hOakUxTXpJd01Gb1hEVEl3TURjeE5URTFNemN3TUZvd0pURVBNQTBHDQpBMVVFQ3hNR1kyeHBaVzUwTVJJd0VBWURWUVFERXdsdmNtY3hZV1J0YVc0d1dUQVRCZ2NxaGtqT1BRSUJCZ2dxDQpoa2pPUFFNQkJ3TkNBQVJ1cUQrZkg1WmVpK3VqTExMVm1FTkMzYTZWMXdKOHh4VU50SWFUeHYvdGxpd0dnQk4rDQpqVGJnUTJsU240QlZzR3pUOEVCS24rbFhKdUVhckdUMEphSEpvNEcvTUlHOE1BNEdBMVVkRHdFQi93UUVBd0lIDQpnREFNQmdOVkhSTUJBZjhFQWpBQU1CMEdBMVVkRGdRV0JCUk9UQUlzejFOanZ4VXZVODdSZDhLWEgzRWtEREFmDQpCZ05WSFNNRUdEQVdnQlFpNHZ1YU5xUlh3T09LOVRzU3ZoZ1QzZTNEZnpCY0JnZ3FBd1FGQmdjSUFRUlFleUpoDQpkSFJ5Y3lJNmV5Sm9aaTVCWm1acGJHbGhkR2x2YmlJNklpSXNJbWhtTGtWdWNtOXNiRzFsYm5SSlJDSTZJbTl5DQpaekZoWkcxcGJpSXNJbWhtTGxSNWNHVWlPaUpqYkdsbGJuUWlmWDB3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUloDQpBUFdocXFkT1BCUWt4SGV4ZGlxaUpGWkJCdGg4bUxMSnpja2IvZ3hpYUZsZ0FpQUJocE1UMVcxTHBwMnN0VisxDQpUdE00bFR6enpLQUhtZ2liRG02aFJ5bkY2QT09DQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tDQo"
            });
            (wallet.getWallet as any) = jest.fn(() => {
                return fsWallet;
            });
    
            (X509WalletMixin.createIdentity as any) = jest.fn(() => {
                return createIdentity
            });
        });
   
        it('should set up connect with expected mocked requests', async () => {
            //  await importIdentity(
            //     EXAMPLE_ENROLL_ID,
            //     EXAMPLE_MSP_ID,
            //     EXAMPLE_PUBLIC_CERT,
            //     EXAMPLE_PRIVATE_KEY
            // );
            
        const gatewayObj: Gateway = new Gateway();
        const gatewayConnect: Promise<void> = gatewayObj.connect(EXAMPLE_COMM_CONN_PROFILE_PATH, {
            identity: EXAMPLE_USER,
            wallet: wallet.getWallet(),
            discovery: { // https://fabric-sdk-node.github.io/release-1.4/module-fabric-network.Gateway.html#~DiscoveryOptions
                enabled: true,  //serviceDiscovery.enabled,           //change
                asLocalhost: false  //serviceDiscovery.asLocalhost,   //change
              },
        }); 
        expect(identityExist).toBe(12);
        // expect(importIdentity).toBeCalledWith(exampleRequest);
        // expect(wallet.getPublicCert).toBeCalledTimes(1)
        });

        // expect(EXAMPLE_USER).toMatch(EXAMPLE_ENROLL_ID);
        // expect(EXAMPLE_COMM_CONN_PROFILE_PATH).toMatch('/Users/akeeme/Downloads/fabric-cli-NewFabricBranch/updatedTestData/connection-profile.json');
        
        
        // expect(wallet.getPrivateKey).toBeCalledWith(EXAMPLE_PRIVATE_KEY);
        // expect(wallet.getWallet).toBeCalledWith(fsWallet);

        });
    });
//     });
// });
        
        
        // it('should call gateway.connect with the expected requests', async () => {
        //     const exampleConnect: Gateway = connect (
        //         EXAMPLE_COMM_CONN_PROFILE_PATH,
        //         identity: EXAMPLE_USER,
        //         wallet: wallet.getWallet,
        //         discovery: {// https://fabric-sdk-node.github.io/release-1.4/module-fabric-network.Gateway.html#~DiscoveryOptions
        //             enabled: true,  //serviceDiscovery.enabled,           //change
        //             asLocalhost: false  //serviceDiscovery.asLocalhost,   //change
        //           },

            

        //     });


        // (wallet.prototype.importIdentity as any) = jest.fn(() => {
        //     return fsWallet
        // });
    // });
        // const gatewayMock = Gateway.prototype;

        
// });
        // (gateway.connect as any) = jest.fn(() => {
        //     return gateway.identity
        //        return gatewayObj.
        
        
        
    // });
    
    // (wallet.connect)
    // (wallet.importIdentity as any) = jest.fn(() => {
    
    // });
    
    
    // const createGatewayObj = new CreateGateway();
    // const returnedGatewayObj = await createGatewayObj.setupGateway(
    //     EXAMPLE_COMM_CONN_PROFILE_PATH,
    //     EXAMPLE_ORG_NAME, 
    //     EXAMPLE_ENROLL_ID, 
    //     EXAMPLE_ENROLL_SECRET, 
    //     EXAMPLE_CREDENTIAL_FILE_PATH
    //     );
        
        // const gatewayObj = new Gateway();
        // (gatewayObj.connect as any) = jest.fn(() => {
        
        
        // });
        
           
        
        /*  await wallet(
            EXAMPLE_USER,
            EXAMPLE_ORG,
            EXAMPLE_PUBLIC_CERT,
            EXAMPLE_PRIVATE_KEY,
            EXAMPLE_CREDENTIAL_FILE_PATH
            );
            **/
            
            // const clientTest = returnedGatewayObj.getClient();
            
            // const mspIdTest = clientTest.getMspid();
            
            // expect(mspIdTest).toStrictEqual('org1msp');
            
            // const channelTest = Gateway.getNetwork(returnedGatewayObj);
            
            // const nameTest = channelTest.getNetwork();
            
            // expect(nameTest).toStrictEqual('adminInfo');
            
            
            
            // const channelTest = returnedGatewayObj.getOrganizations();
            
            // const orgTest = channelTest.getOrganizations();
            
            // expect(orgTest).toStrictEqual('org1');
            // expect(enrollIdTest).toStrictEqual('123')
            
            //  expect(enrollIdTest).toStrictEqual('123')
            
            // expect(CreateGateway.prototype.setupGateway).toBeCalledWith(exampleParameters);
            
        // });
        
        jest.clearAllMocks();
        
        // it ('should be true', async () => { 
        //     const gatewayType = new Gateway();
        
        //     (Gateway.prototype.connect as any) = jest.fn(() => {
        //         return 'hello'
        //     })
        //     const createGatewayObj = new CreateGateway()
        //     const exampleParameters = await createGatewayObj.setupGateway(
        //         EXAMPLE_COMM_CONN_PROFILE_PATH,
        //         EXAMPLE_ORG_NAME, 
        //         EXAMPLE_ENROLL_ID, 
        //         EXAMPLE_ENROLL_SECRET, 
        //         EXAMPLE_CREDENTIAL_FILE_PATH
        //     );
        
        //   /*  await wallet(
        //         EXAMPLE_USER,
        //         EXAMPLE_ORG,
        //         EXAMPLE_PUBLIC_CERT,
        //         EXAMPLE_PRIVATE_KEY,
        //         EXAMPLE_CREDENTIAL_FILE_PATH
        //     );
        // **/
        //     expect(exampleParameters).not.toStrictEqual(gatewayType);
        
        //     //expect(CreateGateway.prototype.setupGateway).toBeCalledWith(exampleParameters);
        
        // });
        // });
        
        
        /**
        * jest.mock('./CreateGateway.ts');
        * const setupGateway = jest.fn();
        * test ("calls CreateGateway.setupGateway", () => {
            * setupGateway();
            * });
            * describe () () => {
                *     it('Should be called and ran successfully', () => {
                    *          const mockSetup = jest.fn();
                    *              expect().toBeCalledTimes(0);
                    *              expect().toBeCalledWith(mockGateway);
                    * })
                    * });
                    * import { setupGateway } from './CreateGateway';
                    import { wallet } from '../src/helpers/wallet';
                    */