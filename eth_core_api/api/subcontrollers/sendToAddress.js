var Q = require('q');
var Tx = require('ethereumjs-tx');

var SentToAddress = function(status, wallet, toAddress, amount, asset) {
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
    } else if (!toAddress || !amount) {
        deferred.resolve({
            status: false,
            result: 'TOADDRESS AND/OR AMOUNT REQUIRED'
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
        var _wallet = _wallets.find(function(element) {
            return element.WalletName == wallet &&
                element.Status == status;
        });
        var walletAddress = _wallet.WalletAddress;
        var walletPRIVKEY = _wallet.WalletPrivateKey;

        const privateKey = Buffer.from(walletPRIVKEY, 'hex');
        if (asset.toLowerCase() == 'eth') {
            web3.eth.getTransactionCount(walletAddress, (err, txCount) => {
                // Build transaction
                const txObject = {
                    nonce: web3.utils.toHex(txCount),
                    to: toAddress,
                    value: web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether')),
                    gasLimit: web3.utils.toHex(21000),
                    gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei'))
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
                            result: null
                        });
                    }
                    deferred.resolve({
                        status: true,
                        result: txHash
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
            var _contract = contracts.find(function(element) {
                return element.symbol == asset.toUpperCase();
            });

            if (!_contract) {
                deferred.resolve({
                    status: false,
                    result: 'Token is not found'
                });
            } else {
                const newContract = new web3.eth.Contract(_contract.abi, _contract.contractAddress);

                web3.eth.getTransactionCount(walletAddress, (err, txCount) => {
                    // Build transaction
                    const txObject = {
                        nonce: web3.utils.toHex(txCount),
                        gasLimit: web3.utils.toHex(100000), // Raise the gas limit to a much higher amount
                        gasPrice: web3.utils.toHex(web3.utils.toWei('15', 'gwei')),
                        to: _contract.contractAddress,
                        data: newContract.methods.transfer(toAddress, web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether'))).encodeABI()
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
                                result: null
                            });
                        }
                        deferred.resolve({
                            status: true,
                            result: txHash
                        });
                    });
                });
            }
        }
    }
    return deferred.promise;
}

module.exports = SentToAddress;