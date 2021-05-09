// The confirmation about fee of token transfer transaction

const Web3 = require('web3');
var Tx = require('ethereumjs-tx');
var BigNumber = require('bignumber.js');
const GetPrivateKey = require('./getprivatekey');

async function getConfirmations(status, txHash) {
    try {
        var url = '';
        if (status) {
            // MAINNET
            url = process.env.MAIN_NET_URL_WS;
        } else {
            // TESTNET
            url = process.env.TEST_NET_URL_WS;
        }

        const web3 = new Web3(Web3.givenProvider || Web3.providers.WebsocketProvider(url));

        // Get transaction details
        const trx = await web3.eth.getTransaction(txHash)

        // Get current block number
        const currentBlock = await web3.eth.getBlockNumber()

        if (trx === null) {
            // when transaction is pending, its block is null
            console.log('\x1b[33m%s\x1b[0m','PENDING TRANSACTION '+txHash);
            return 0;
          } else {
            // When transaction is unconfirmed, its block number is null.
            // In this case we return 0 as number of confirmations
            return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
          }
    }
    catch (error) {
        console.log(error)
    }
}

// this request must be once
var isCollectAssetNewConfirmationCount = false;

function confirmEtherTransaction(status, txHash, confirmations, account, walletAddress, contractAddress, data) {
    //console.log('***********************  MOVE STEP-2 WAITING...  **************************');
    setTimeout(async () => {
        // Get current number of confirmations and compare it with sought-for value
        const trxConfirmations = await getConfirmations(status, txHash)
        //console.log('MOVE TOKEN: Transaction with hash ' + txHash + ' has ' + trxConfirmations + ' confirmation(s)')
        if (trxConfirmations >= confirmations) {
            // Handle confirmation event according to your business logic
            //console.log('MOVE TOKEN: Transaction with hash ' + txHash + ' has been successfully confirmed')
            var url = '';
            if (status) {
                // MAINNET
                url = process.env.MAIN_NET_URL_WS;
            } else {
                // TESTNET
                url = process.env.TEST_NET_URL_WS;
            }

            const web3 = new Web3(Web3.givenProvider || Web3.providers.WebsocketProvider(url));

            const privKey = GetPrivateKey(status, account);

            privKey.then(function (_privKey) {
                const accountPrivKey = _privKey.result.privateKey;
                const privateKey = Buffer.from(accountPrivKey.substring(2), 'hex');

                web3.eth.getTransactionCount(account, (err2, txCount2) => {
                    // Build transaction
                    const txObject2 = {
                        nonce: web3.utils.toHex(txCount2),
                        gasLimit: web3.utils.toHex(100000), // Raise the gas limit to a much higher amount
                        gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'gwei')),
                        to: contractAddress,
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
                            console.log('MOVE TOKEN: ERROR (Step-2): ' + error2 + ', SUCCESS (Step-1): ' + txHash);
                        } else {
                            console.log("\x1b[32m", 'MOVE TOKEN: SUCCESS: ' + txHash2);
                        }
                    });
                });
            });
            return;

        } else {
            // Recursive call
            return confirmEtherTransaction(status, txHash, confirmations, account, walletAddress, contractAddress, data);
        }
    }, 15 * 1000)
}

module.exports = confirmEtherTransaction