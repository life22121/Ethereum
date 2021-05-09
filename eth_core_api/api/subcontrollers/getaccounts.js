var Q = require('q');

var GetAccounts = function (status) {
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

    web3.eth.getAccounts((err, res) => {
        res.forEach(element => {
            web3.eth.getBalance(element, (error, balance) => {
                console.log(element + ' : ' + web3.utils.fromWei(balance, 'ether'));
            });
        });
        deferred.resolve({
            status: true,
            result: res
        });
    });
    return deferred.promise;
}

module.exports = GetAccounts;