const Web3 = require('web3');
const request = require("request");

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
        const Web3 = require('Web3');
        const web3 = new Web3(Web3.givenProvider || Web3.providers.WebsocketProvider(url));

        // Get transaction details
        const trx = await web3.eth.getTransaction(txHash)

        // Get current block number
        const currentBlock = await web3.eth.getBlockNumber()

        if (trx === null) {
            // when transaction is pending, its block is null
            console.log('\x1b[33m%s\x1b[0m', 'PENDING TRANSACTION ' + txHash);
            return 0;
        } else {
            // When transaction is unconfirmed, its block number is null.
            // In this case we return 0 as number of confirmations
            return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
        }
    } catch (error) {
        console.log(error)
    }
}
// this request must be once
var isSentNewConfirmationCount = false;

function confirmEtherTransaction(status, txHash, confirmations = 3, asset) {
    setTimeout(async() => {
        // Get current number of confirmations and compare it with sought-for value
        const trxConfirmations = await getConfirmations(status, txHash)

        if (trxConfirmations >= confirmations) {
            // Handle confirmation event according to your business logic
            console.log('Transaction with hash ' + txHash + ' has been successfully confirmed');
            var postData = {
                "TxID": txHash,
                "Asset": asset
            }
            var url = "";
            if (status) {
                url = "http://{HOST OR IP ADDRESS where you want notifications sent}:{PORT}/{URL-EXTENSION}";
                // e.g. : url = "https://localhost/depositmainnet";

            } else {
                url = "http://{HOST OR IP ADDRESS where you want notifications sent}:{PORT}/{URL-EXTENSION}";
                // e.g. : url = "https://localhost/deposittestnet"
            }
            request({
                uri: url,
                method: "POST",
                body: JSON.stringify(postData),
                rejectUnauthorized: false,
                headers: {
                    'Content-Type': 'application/json'
                }
            }, function(error, response, body) {
                console.log("\x1b[32m", 'Sent Confirm Notification');
                console.log("\x1b[32m", postData);

                isSentNewConfirmationCount = true;
            });
            return;

        }
        // Recursive call
        return confirmEtherTransaction(status, txHash, confirmations, asset)
    }, 15 * 1000)
}

module.exports = confirmEtherTransaction