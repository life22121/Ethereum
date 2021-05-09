var Q = require('q');

var GetNewAddress = function (status) {
    var deferred = Q.defer();

    var url = '';
    if (status) {
        // MAINNET
        url=process.env.MAIN_NET_URL_WS;
    } else {
        // TESTNET
        url=process.env.TEST_NET_URL_WS;
    }

    const Web3 = require('Web3');
    const web3 = new Web3(Web3.givenProvider || Web3.providers.WebsocketProvider(url));

    web3.eth.personal.newAccount(process.env.NEW_ACCOUNT_PSW)
    .then((address)=>{
        if (address) {
            console.log('New address is created: '+address);
            deferred.resolve({
                status: true,
                result: address
            });
        } else {
            deferred.resolve({
                status: false,
                result: null
            });
        }
    });
    return deferred.promise;
}

module.exports = GetNewAddress;