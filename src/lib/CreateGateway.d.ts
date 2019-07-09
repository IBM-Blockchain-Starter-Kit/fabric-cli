export  class CreateGateway{
    constructor();
    setupGateway(commConnProfilePath: string, orgName: string, enrollId: string, enrollSecret: string, credentialFilePath: string) : Promise<any>;
}