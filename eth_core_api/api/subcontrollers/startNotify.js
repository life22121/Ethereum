const fs = require('fs')
var Q = require('q');
const request = require("request");

const confirmEtherTransaction = require('../subcontrollers/checkConfirmations');
var StartNotify = function(status) {
    var deferred = Q.defer();
    var contracts;
    var url = '';
    if (status) {
        // MAINNET
        url = process.env.MAIN_NET_URL_WS;
        contracts = require('../../contractsMain.json');
    } else {
        // TESTNET
        url = process.env.TEST_NET_URL_WS;
        contracts = require('../../contractsTest.json');
    }

    const Web3 = require('Web3');
    const web3 = new Web3(Web3.givenProvider || Web3.providers.WebsocketProvider(url));

    // TOKEN LISTENER 
    contracts.forEach(_contract => {
        const newContract = new web3.eth.Contract(_contract.abi, _contract.contractAddress);
        const eventInterface = _contract.abi.find(x => x.name === 'Transfer' && x.type === 'event');

        const from_param = eventInterface.inputs[0].name;
        const to_param = eventInterface.inputs[1].name;
        const value_param = eventInterface.inputs[2].name;

        const options = {
            filter: {
                _from: '',
                _to: '',
                _value: ''
            },
            fromBlock: 'latest'
        };
        console.log(_contract.name + ' listening...');
        newContract.events.Transfer(options, (error, result) => {
            console.log('\x1b[31m%s\x1b[0m', 'Token Triggered');
            web3.eth.getAccounts((err, res) => {
                var _account = res.find(function(account) {
                    return account == result.returnValues[to_param];
                });

                if (_account) {
                    // SEND DEPOSIT NOTIFY
                    var _wallets = require('../../wallets.json');
                    var _wallet = _wallets.find(function(element) {
                        return element.WalletAddress == result.returnValues[to_param].toString();
                    });

                    var isMainWallet = _wallet;
                    if (isMainWallet) {
                        console.log(result + ', is Move (?) Transaction:');
                    } else {
                        var postData = {
                            "TxID": result.transactionHash,
                            "Asset": _contract.symbol
                        }
                        var url = "";
                        if (status) {
                            url = "http://{HOST OR IP ADDRESS where you want notifications sent}:{PORT}/{URL-EXTENSION}";
                            // e.g. : url = "https://localhost/depositmainnet";

                        } else {
                            url = "http://{HOST OR IP ADDRESS where you want notifications sent}:{PORT}/{URL-EXTENSION}";
                            // e.g. : url = "https://localhost/deposittestnet"
                        }
                        request({
                            uri: url,
                            method: "POST",
                            body: JSON.stringify(postData),
                            rejectUnauthorized: false,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }, function(error, response, body) {
                            console.log("Sent " + _contract.symbol + "  notification to: " + url);
                        });
                        if (status === true) {
                            console.log("\x1b[34m", 'MAINNET');
                            console.log("\x1b[34m%s\x1b[0m", 'Deposit: ' + result.transactionHash + ' to: ' + result.returnValues[to_param] + ' amount: ' + result.returnValues[value_param]);
                        } else {
                            console.log("\x1b[32m", 'TESTNET');
                            console.log("\x1b[32m%s\x1b[0m", 'Deposit: ' + result.transactionHash + ' to: ' + result.returnValues[to_param] + ' amount: ' + result.returnValues[value_param]);
                        }
                        confirmEtherTransaction(status, result.transactionHash, 3, _contract.symbol);
                    }
                }
            });
        })
    });

    // ETHER LISTENER
    var subscription = web3.eth.subscribe('pendingTransactions');
    console.log('Ether' + ' listening...');
    subscription.subscribe(async(error, result) => {
        //console.log('\x1b[31m%s\x1b[0m', 'Ether Triggered');
        if (!error) {
            try {
                const transaction = await web3.eth.getTransaction(result).then((res) => {
                    if (res != null) {
                        if (res.to == null) {
                            return;
                        }

                        web3.eth.getAccounts(async(_err, _res) => {
                            var _account = _res.find(function(account) {
                                return account.toString().toLowerCase().trim() == res.to.toString().toLowerCase().trim();
                            });

                            if (_account) {
                                // SEND DEPOSIT NOTIFY
                                var postData = {
                                    "TxID": result,
                                    "Asset": "eth"
                                }

                                var _wallets = require('../../wallets.json');
                                var _walletFrom = _wallets.find(function(element) {
                                    return element.WalletAddress == res.from.toString().trim();
                                });
                                var _walletTo = _wallets.find(function(element) {
                                    return element.WalletAddress == res.to.toString().trim();
                                });

                                var isMainWallet = _walletFrom;
                                var isMainWalletTO = _walletTo;

                                if (isMainWallet) {
                                    console.log(result + ', is Move Transaction (FROM)');
                                } else {
                                    if (isMainWalletTO) {
                                        console.log(result + ', is Move Transaction (TO)');
                                    } else {
                                        var url = "";
                                        if (status) {
                                            url = "http://{HOST OR IP ADDRESS where you want notifications sent}:{PORT}/{URL-EXTENSION}";
                                            // e.g. : url = "https://localhost/depositmainnet";

                                        } else {
                                            url = "http://{HOST OR IP ADDRESS where you want notifications sent}:{PORT}/{URL-EXTENSION}";
                                            // e.g. : url = "https://localhost/deposittestnet"
                                        }
                                        request({
                                            uri: url,
                                            method: "POST",
                                            body: JSON.stringify(postData),
                                            rejectUnauthorized: false,
                                            headers: {
                                                'Content-Type': 'application/json'
                                            }
                                        }, function(error, response, body) {
                                            console.log("Sent eth notification to: " + url);
                                            //console.log(body);

                                        });


                                        if (status === true) {
                                            console.log("\x1b[34m", 'MAINNET');
                                            console.log("\x1b[34m%s\x1b[0m", 'Deposit: ' + result + ' to: ' + res.to + ' amount: ' + res.value);
                                        } else {
                                            console.log("\x1b[32m", 'TESTNET');
                                            console.log("\x1b[32m%s\x1b[0m", 'Deposit: ' + result + ' to: ' + res.to + ' amount: ' + res.value);
                                        }

                                        confirmEtherTransaction(status, result, 3, 'eth');
                                    }

                                }
                            }
                        });
                    } else {
                        //console.log(res);
                    }
                });
            } catch (err) {
                console.log(err);
                console.log('Pending Transaction: ' + result);
            }
        }
    });

    deferred.resolve({
        status: true,
        result: 'started'
    });
    return deferred.promise;
}

module.exports = StartNotify;