var Q = require('q');

var GetDecryptedWallet = function (status, address) {
    var deferred = Q.defer();

    var _path = '';
    var url = '';
    if (status) {
        // MAINNET
        url = process.env.MAIN_NET_URL_WS;
        _path = 'C:\\Users\\Administrator\\AppData\\Roaming\\Ethereum\\keystore';
        // this path on WINDOWS. if you use other os, you must change this path according to ethereum keystore folder on your server
    } else {
        // TESTNET
        url = process.env.TEST_NET_URL_WS;
        _path = 'C:\\Users\\Administrator\\AppData\\Roaming\\Ethereum\\testnet\\keystore';
        // this path on WINDOWS. if you use other os, you must change this path according to ethereum keystore folder on your server
    }

    const Web3 = require('Web3');
    const web3 = new Web3(Web3.givenProvider || Web3.providers.WebsocketProvider(url));

    const path = require('path');
    const fs = require('fs');
    
    const directory = path.join(_path);
    fs.readdir(directory, (err, files) => {
        var _address=address.substr(2).toLowerCase();
        files.forEach(file => {
            if (file.indexOf(_address) > -1) {
                var keystore = fs.readFileSync(_path + '\\' + file, 'utf-8');
                var decryptedAccount = web3.eth.accounts.decrypt(keystore, process.env.NEW_ACCOUNT_PSW);
                deferred.resolve({
                    status: true,
                    result: {
                        address:decryptedAccount.address,
                        privateKey:decryptedAccount.privateKey
                    }
                });
            }
        });
        deferred.resolve({
            status: false,
            result: 'INVALID ADDRESS'
        });
    });
    return deferred.promise;
}

module.exports = GetDecryptedWallet;