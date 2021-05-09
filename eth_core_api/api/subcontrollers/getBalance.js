var Q = require('q');

// Calculate all wallet balance
var GetBalance = function (status, wallet, asset) {
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
    }
    else {

        var _wallets = require('../../wallets.json');
        var _wallet = _wallets.find(function (element) {
            return element.WalletName == wallet &&
                element.Status == status;
        });
        var walletAddress = _wallet.WalletAddress;
        var walletPRIVKEY = _wallet.WalletPrivateKey;

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

        if (asset.toLowerCase() == 'eth') {
            web3.eth.getBalance(walletAddress, (error, result) => {
                const balance = web3.utils.fromWei(result, 'ether');
                console.log('Wallet: ' + walletAddress + ', Balance: ' + balance + ' eth');

                if (balance) {
                    deferred.resolve({
                        status: true,
                        result: balance
                    });
                } else {
                    deferred.resolve({
                        status: false,
                        result: null
                    });
                }
            });
        } else {
            var contracts;
            if (status) {
                contracts = require('../../contractsMain.json');
            } else {
                contracts = require('../../contractsTest.json');
            }
            var _contract = contracts.find(function (element) {
                return element.symbol.toLowerCase() == asset.toLowerCase();
            });

            if (!_contract) {
                deferred.resolve({
                    status: false,
                    result: 'Token is not found'
                });
            } else {
                const newContract = new web3.eth.Contract(_contract.abi, _contract.contractAddress);

                newContract.methods.balanceOf(walletAddress).call()
                    .then((_res) => {
                        var balance = web3.utils.fromWei(web3.utils.hexToNumberString(_res), 'ether');
                        console.log('Wallet: ' + walletAddress + ', Balance: ' + balance + ' ' + _contract.symbol);
                        deferred.resolve({
                            status: true,
                            result: balance
                        });
                    });
            }

        }
    }
    return deferred.promise;
}

module.exports = GetBalance;