var Q = require('q');
var Tx = require('ethereumjs-tx');
var BigNumber = require('bignumber.js');

const confirmEtherTransaction = require('../subcontrollers/moveToken')

var Move = function (status, wallet, account, asset, assetMoveLimit) {
    var deferred = Q.defer();

    if (!asset) {
        deferred.resolve({
            status: false,
            result: 'ASSET REQUIRED'
        });
    } else if (!wallet) {
        deferred.resolve({
            status: false,
            result: 'WALLET REQUIRED'
        });
    } else if (!account) {
        deferred.resolve({
            status: false,
            result: 'account REQUIRED'
        });
    } else {
        var url = '';
        if (status) {
            // MAINNET
            url = process.env.MAIN_NET_URL_WS;
        } else {
            // TESTNET
            url = process.env.TEST_NET_URL_WS;
        }

        const Web3 = require('Web3');
        const web3 = new Web3(Web3.givenProvider || Web3.providers.WebsocketProvider(url));

        var _wallets = require('../../wallets.json');
        var _wallet = _wallets.find(function (element) {
            return element.WalletName == wallet &&
                element.Status == status;
        });
        var walletAddress = _wallet.WalletAddress;
        var walletPRIVKEY = _wallet.WalletPrivateKey;

        if (asset.toLowerCase() == 'eth') {
            const GetPrivateKey = require('../subcontrollers/getprivatekey');
            const privKey = GetPrivateKey(status, account);
            privKey.then(function (_privKey) {
                const accountPrivKey = _privKey.result.privateKey;
                const privateKey = Buffer.from(accountPrivKey.substring(2), 'hex');
                web3.eth.getTransactionCount(account, (err, txCount) => {
                    web3.eth.getBalance(account, (bal_err, bal_res) => {
                        const balance = new BigNumber(bal_res);
                        var gas = new BigNumber(21000);
                        var gasPrice = web3.utils.toWei('1', 'gwei');
                        var cost = gas.multipliedBy(gasPrice);
                        var correctSendAmount = balance.minus(cost);

                        // Build transaction
                        const txObject = {
                            nonce: web3.utils.toHex(txCount),
                            to: walletAddress,
                            value: web3.utils.toHex(correctSendAmount),
                            gasLimit: web3.utils.toHex(21000),
                            gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'gwei'))
                        };
                        // Sign Transaction
                        const tx = new Tx(txObject);
                        tx.sign(privateKey);

                        const serializedTx = tx.serialize();
                        const raw = '0x' + serializedTx.toString('hex');
                        // Broadcast transaction
                        web3.eth.sendSignedTransaction(raw, (error, txHash) => {
                            if (error) {
                                console.log('ERROR: ' + error);
                                deferred.resolve({
                                    status: false,
                                    result: 'ERROR: ' + error
                                });
                            } else {
                                console.log("\x1b[33m", 'Moved ' + correctSendAmount + ' eth');
                                deferred.resolve({
                                    status: true,
                                    result: 'SUCCESS: ' + txHash
                                });
                            }
                        });
                    });
                });
            });

        } else {
            var contracts;
            if (status) {
                contracts = require('../../contractsMain.json');
            } else {
                contracts = require('../../contractsTest.json');
            }
            var _contract = contracts.find(function (element) {
                return element.symbol == asset.toUpperCase();
            });

            if (!_contract) {
                deferred.resolve({
                    status: false,
                    result: 'Token is not found'
                });
            } else {
                const newContract = new web3.eth.Contract(_contract.abi, _contract.contractAddress);
                
                newContract.methods.balanceOf(account).call()
                    .then((_res) => {
                        var balance = web3.utils.fromWei(web3.utils.hexToNumberString(_res), 'ether');
                        console.log('Moving balance: ' + balance);
                        if (balance >= assetMoveLimit) {
                            var fee_value = 0.0001;
                            web3.eth.getBalance(account, (bal_err, bal_res) => {
                                if (!bal_err) {
                                    var balance_ether = web3.utils.fromWei(web3.utils.hexToNumberString(bal_res), 'ether');
                                    console.log('Current balance2: ' + balance_ether);
                                
                                    if (balance_ether < fee_value) {
                                        console.log('S T E P - 1');
                                        // 1. STEP : Send some ether for FEE >>>
                                        const privateKey = Buffer.from(walletPRIVKEY, 'hex');
                                        web3.eth.getTransactionCount(walletAddress, (err, txCount) => {

                                            // Build transaction
                                            const txObject = {
                                                nonce: web3.utils.toHex(txCount),
                                                to: account,
                                                value: web3.utils.toHex(web3.utils.toWei(fee_value.toString(), 'ether')),
                                                gasLimit: web3.utils.toHex(50000),
                                                gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'gwei'))
                                            };
                                            // Sign Transaction
                                            const tx = new Tx(txObject);
                                            tx.sign(privateKey);

                                            const serializedTx = tx.serialize();
                                            const raw = '0x' + serializedTx.toString('hex');
                                            // Broadcast transaction
                                            web3.eth.sendSignedTransaction(raw, (error, txHash) => {
                                                if (error) {
                                                    console.log('ERROR (Step-1): ' + error);
                                                    deferred.resolve({
                                                        status: false,
                                                        result: 'ERROR (Step-1): ' + error
                                                    });
                                                } else {
                                                    // 2. STEP : Send all token to MainWallet >>>
                                                    //console.log(' >>>>>>>>> Step-1 Succeed ' + txHash);
                                                    //console.log("\x1b[34m",'Wating for token transfer (Step-2)');

                                                    var data = newContract.methods.transfer(walletAddress, web3.utils.toHex(web3.utils.toWei(balance.toString(), 'ether'))).encodeABI();
                                                    confirmEtherTransaction(status,
                                                        txHash,
                                                        3,
                                                        account,
                                                        walletAddress,
                                                        _contract.contractAddress,
                                                        data);

                                                    deferred.resolve({
                                                        status: true,
                                                        result: 'Wating for token transfer (Step-2)'
                                                    });

                                                    // 2. STEP : Send all token to MainWallet <<<
                                                }
                                            });

                                        });
                                        // 1. STEP : Send some ether for FEE <<<
                                    } else {
                                        console.log('W I T H O U T  S T E P - 1');
                                        const GetPrivateKey = require('./getprivatekey');
                                        const privKey = GetPrivateKey(status, account);

                                        privKey.then(function (_privKey) {
                                            const accountPrivKey = _privKey.result.privateKey;
                                            const privateKey = Buffer.from(accountPrivKey.substring(2), 'hex');

                                            web3.eth.getTransactionCount(account, (err2, txCount2) => {
                                                // Build transaction
                                                var data = newContract.methods.transfer(walletAddress, web3.utils.toHex(web3.utils.toWei(balance.toString(), 'ether'))).encodeABI();
                                                const txObject2 = {
                                                    nonce: web3.utils.toHex(txCount2),
                                                    gasLimit: web3.utils.toHex(100000), // Raise the gas limit to a much higher amount
                                                    gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'gwei')),
                                                    to: _contract.contractAddress,
                                                    data: data
                                                };
                                                // Sign Transaction
                                                const tx2 = new Tx(txObject2);
                                                tx2.sign(privateKey);

                                                const serializedTx2 = tx2.serialize();
                                                const raw2 = '0x' + serializedTx2.toString('hex');
                                                // Broadcast transaction
                                                web3.eth.sendSignedTransaction(raw2, (error2, txHash2) => {
                                                    if (error2) {
                                                        console.log('MOVE TOKEN: ERROR (Step-2, Without Step-1): ' + error2);
                                                        deferred.resolve({
                                                            status: false,
                                                            result: 'ERROR (Step-2, Without Step-1): ' + error2
                                                        });
                                                    } else {
                                                        console.log("\x1b[32m", 'MOVE TOKEN: SUCCESS Without Step-1: ' + txHash2);
                                                        deferred.resolve({
                                                            status: true,
                                                            result: 'SUCCESS (Without Step-1)'
                                                        });
                                                    }
                                                });
                                            });
                                        });
                                    }
                                }
                            });

                        } else {
                            deferred.resolve({
                                status: false,
                                result: 'Balance :' + balance
                            });
                        }
                    });
            }
        }
    }
    return deferred.promise;
}

module.exports = Move;