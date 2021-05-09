var Q = require('q');

var ValidateAddress=function(status,address) {
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

    if (!address) {
        deferred.resolve({
            status: false,
            result: 'ADDRESS REQUEIRED'
        });
    } else {
        var isaddress = web3.utils.isAddress(address);
        const isValid = {
            isvalid: isaddress,
            address: address
        };
        if (isValid) {
            console.log('Address '+address+' checked: true');
            deferred.resolve({
                status: true,
                result: isValid
            });
        } else {
            deferred.resolve({
                status: false,
                result: null
            });
        }
    }
    return deferred.promise;
}

module.exports = ValidateAddress;