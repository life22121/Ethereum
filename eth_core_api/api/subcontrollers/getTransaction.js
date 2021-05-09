var Q = require('q');

var GetTransaction = async function (status, txHash) {
    var deferred = Q.defer();
    
    if (!txHash) {
        deferred.resolve({
            status: false,
            result: 'TXHASH'
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
        try {
            await web3.eth.getTransaction(txHash).then((result) => {
                if (result.blockNumber != null) {
                    //console.log('SUCCESS');
                    web3.eth.getBlock(result.blockNumber).then((block) => {
                        web3.eth.getBlockNumber().then((currentBlock) => {
                            var _asset = '';
                            var _to = '';
                            var _value = web3.utils.fromWei(result.value, 'ether');
                            if (_value != 0) {
                                _asset = 'ETHER';
                                _to = result.to;
                            } else {
                                _asset = result.to;
                                var input = result.input;
                                var methodID = input.substr(0, 10);
                                _to = '0x' + input.substr(10 + 24, 40)
                                var isaddress = web3.utils.isAddress(_to);
                                _value = web3.utils.fromWei(web3.utils.toBN('0x' + input.substr(74, 64)), 'ether');
                            }
                            const transaction = {
                                asset: _asset,
                                from: result.from,
                                to: result.to,
                                amount: web3.utils.fromWei(result.value, 'ether'),
                                confirmations: currentBlock - result.blockNumber,
                                blockhash: result.blockHash,
                                txId: result.hash,
                                time: block.timestamp,
                                timeReceived: block.timestamp,
                                details: [{
                                    account: '', // always it must be ''
                                    address: _to,
                                    amount: _value,
                                    category: 'receive'
                                }]
                            };
                            if (transaction) {
                                deferred.resolve({
                                    status: true,
                                    result: transaction
                                });
                            } else {
                                deferred.resolve({
                                    status: false,
                                    result: null
                                });
                            }
                        });
                    });
                } else {
                    //console.log('PENDING');
                    var _asset = '';
                    var _to = '';
                    var _value = web3.utils.fromWei(result.value, 'ether');
                    if (_value != 0) {
                        _asset = 'ETHER';
                        _to = result.to;
                    } else {
                        _asset = result.to;
                        var input = result.input;
                        var methodID = input.substr(0, 10);
                        _to = '0x' + input.substr(10 + 24, 40)
                        var isaddress = web3.utils.isAddress(_to);
                        _value = web3.utils.fromWei(web3.utils.toBN('0x' + input.substr(74, 64)), 'ether');
                    }
                    const transaction = {
                        asset: _asset,
                        from: result.from,
                        to: result.to,
                        amount: web3.utils.fromWei(result.value, 'ether'),
                        confirmations: 0,
                        blockhash: result.blockHash,
                        txId: result.hash,
                        time: 0,
                        timeReceived: 0,
                        details: [{
                            account: '', // always it must be ''
                            address: _to,
                            amount: _value,
                            category: 'receive'
                        }]
                    };
                    if (transaction) {
                        deferred.resolve({
                            status: true,
                            result: transaction
                        });
                    } else {
                        deferred.resolve({
                            status: false,
                            result: null
                        });
                    }
                }
            });
        }
        catch (err) {
            console.log("Get Transaction ("+txHash+") Error: " + err);
            deferred.resolve({
                status: false,
                result: null
            });
        }
    }
    return deferred.promise;
}

module.exports = GetTransaction;