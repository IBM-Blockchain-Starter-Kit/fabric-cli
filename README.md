[![Build Status](https://travis-ci.org/IBM-Blockchain-Starter-Kit/fabric-cli.svg?branch=master)](https://travis-ci.org/IBM-Blockchain-Starter-Kit/fabric-cli)

# Overview
The fabric-cli project is a Node.js application written using TypeScript, with the aim of making chaincode deployment simple.

The tool can be used to install, instantiate/upgrade and invoke chaincode running on any Hyperledger Fabric network v1.4.x.

The tool supports the following smart contract languages: Java, Golang and Node.js.

When attempting to deploy chaincode to a Hyperledger Fabric network, the private key and certificate of the target organization's administrator are required:
- For IBP v2 these credentials can be exported via the `Wallet` tab, selecting the admin identity and clicking `Export Identity`. The exported credentials are base64 encoded and can be decoded in a Node.js runtime instance using:

      new Buffer('string_to_be_decoded', 'base64').toString()
- For local networks deployed using the IBM Blockchain Platform VSCode plugin, these credentials can be found in:
  
      ~/.fabric-vscode/local_fabric-ops/wallet/Admin@org1.example.com/

## Configuring the CLI
---

1. Go to root directory of project
2. Run `'npm install'`
3. Run `'npm run build'` to compile from TS into JS
4. Run `'chmod +x fabric-cli.js'` to make the file executable
5. Run the command `'npm link'`
6. Run the command `'fabric-cli --version'` to confirm the command is available from the cli
   
Note: Remember to run `'npm unlink'` once done to keep `npm` clean!

## Available Commands
---

Currently the following commands are implemented:

### Install Chaincode

```
$ fabric-cli chaincode install --help
fabric-cli chaincode install

Install chaincode

Options:
  --version         Show version number                                [boolean]
  --help            Show help                                          [boolean]
  --conn-profile    Absolute path for connection profile file based on  FAB-5363
                    format                                   [string] [required]
  --org             Name of org stanza in the network-config file that contains
                    the peers where the chaincode should be installed
                                                             [string] [required]
  --admin-identity  Absolute path to where the user credentials are located
                                                             [string] [required]
  --cc-name         Name for the chaincode to install        [string] [required]
  --cc-version      The version that will be assigned to the chaincode to
                    install                                  [string] [required]
  --cc-type         The language in which your chaincode is written,
                    default=golang. [string] [choices: "golang", "java", "node"]
  --src-dir         Path where the chaincode directory is located (for golang
                    this is a relative folder with respect to GOPATH/src)
                                                             [string] [required]
```

### Instantiate Chaincode

```
$ fabric-cli chaincode instantiate --help
fabric-cli chaincode instantiate

Instantiate chaincode

Options:
  --version             Show version number                            [boolean]
  --help                Show help                                      [boolean]
  --conn-profile        Absolute path for connection profile file based on
                        FAB-5363 format                      [string] [required]
  --org                 Name of org stanza in the network-config file that
                        contains the peers where the chaincode should be
                        installed                            [string] [required]
  --admin-identity      Absolute path to where the user credentials are located
                                                             [string] [required]
  --cc-name             Name for the chaincode to instantiate[string] [required]
  --cc-version          The version of chaincode to instantiate
                                                             [string] [required]
  --cc-type             The langauge in which your chaincode is written
                [string] [choices: "golang", "java", "node"] [default: "golang"]
  --channel             Name of the channel to instantiate chaincode
                                                             [string] [required]
  --init-fn             Function to call on instantiation call.
                                                          [string] [default: ""]
  --init-args           Value(s) to pass as argument to instantiation call.
                                                           [array] [default: []]
  --timeout             Specify number of milliseconds to wait on the response
                        before rejecting.             [number] [default: 120000]
  --endorsement-policy  The endorsement policy for the chaincode (this is an
                        optional parameter).            [string] [default: null]
  --collections-config  Absolute path to where the collections-config file is
                        located                         [string] [default: null]
```

### Invoke Chaincode

```
$ fabric-cli chaincode invoke --help
fabric-cli chaincode invoke

Invoke a transaction to the chaincode

Options:
  --version         Show version number                                [boolean]
  --help            Show help                                          [boolean]
  --conn-profile    Absolute path for connection profile file based on  FAB-5363
                    format                                   [string] [required]
  --org             Name of org stanza in the network-config file that contains
                    the peers where the chaincode should be installed
                                                             [string] [required]
  --admin-identity  Absolute path to where the user credentials are located
                                                             [string] [required]
  --cc-name         Name for the chaincode to invoke         [string] [required]
  --channel         Name of the channel to invoke chaincode  [string] [required]
  --invoke-fn       Name of the transaction function to invoke in chaincode
                                                             [string] [required]
  --invoke-args     Space separated list of arguments to pass into the
                    transaction                            [array] [default: []]
  --query           Specifies whether this transaction is just a query or should
                    be submitted to the orderer       [boolean] [default: false]
  --timeout         Specify number of milliseconds to wait on the response
                    before rejecting                  [number] [default: 120000]
```

## TODO
- Update automated tests
