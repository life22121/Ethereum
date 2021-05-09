var Q = require('q');
const fs = require('fs')

var CreateWallet = function (status, newWalletName) {
    var deferred = Q.defer();

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
    var _walletsFileName = './wallets.json';
    var _wallets = require('../../wallets.json');
    var _wallet = _wallets.find(function (element) {
        return element.WalletName == newWalletName &&
            element.Status == status;
    });
    if (_wallet) {
        deferred.resolve({
            status: false,
            result: newWalletName + ' is exist on ' + (status == true ? "Mainnet" : "Testnet")
        });
    } else {
        console.log("Ready ...");
        web3.eth.personal.newAccount(process.env.NEW_ACCOUNT_PSW)
            .then((address) => {
                if (address) {
                    console.log('New address is created: ' + address);
                    const GetPrivateKey = require('./getprivatekey');
                    const privKey = GetPrivateKey(status, address);
                    privKey.then(function (_privKey) {
                        //if (_privKey) console.log('Error writing file:', err)
                        const accountPrivKey = _privKey.result.privateKey;
                        var _newWallet = {
                            "Status": status,
                            "WalletName": newWalletName,
                            "WalletAddress": address,
                            "WalletPrivateKey": accountPrivKey.substring(2)
                        }
                        _wallets.push(_newWallet);
                        fs.writeFile(_walletsFileName, JSON.stringify(_wallets), (err) => {
                            if (err) console.log('Error writing file:', err)
                            setTimeout(() => {
                                deferred.resolve({
                                    status: true,
                                    result: newWalletName + ' wallet created'
                                });
                            }, 1000);
                        });

                    });

                } else {
                    deferred.resolve({
                        status: false,
                        result: 'Address creation failed'
                    });
                }
            });
    }
    return deferred.promise;
}

module.exports = CreateWallet;