export  class CreateGateway{
    constructor();
    setupGateway(commConnProfilePath: string, orgName: string, enrollId: string, enrollSecret: string) : Promise<any>;
}