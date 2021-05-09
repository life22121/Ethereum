const GetNewAddress = require('../subcontrollers/getNewAddress');
const ValidateAddress = require('../subcontrollers/validateAddress');
const GetBalance = require('../subcontrollers/getBalance');
const GetTransaction = require('../subcontrollers/getTransaction');
const SendToAddress = require('../subcontrollers/sendToAddress');
const Move = require('../subcontrollers/move');
const CreateWallet=require('../subcontrollers/createWallet');

exports.all_methods = (req, res, next) => {
    const requestParameters = {
        status: req.body.Status,
        securitykey: req.body.Securitykey,
        asset: req.body.Asset,
        wallet: req.body.Wallet,
        method: req.body.Method,
        parameters: req.body.Parameters,
    };
    if(requestParameters.securitykey!='Abcdef1234@'){
        res.status(200).json({
            status: false,
            result: 'WRONG SECURITY KEY'
        });
    }else if (!requestParameters.method) {
        res.status(200).json({
            status: false,
            result: 'METHOD REQUEIRED'
        });
    }
    else {
        if (requestParameters.method.toLowerCase() === 'getnewaddress') {
            GetNewAddress(requestParameters.status)
                .then(function (result) {
                    res.status(200).json(result);
                });
        } else if (requestParameters.method.toLowerCase() === 'validateaddress') {
            const isValid = ValidateAddress(requestParameters.status, requestParameters.parameters[0]);
            isValid.then(function (_isvalid) {
                res.status(200).json(_isvalid);
            });

        } else if (requestParameters.method.toLowerCase() === 'getbalance') {
            const getBalance = GetBalance(requestParameters.status, requestParameters.wallet.toLowerCase(), requestParameters.asset.toUpperCase());
            getBalance.then(function (_getBalance) {
                res.status(200).json(_getBalance);
            });

        } else if (requestParameters.method.toLowerCase() === 'gettransaction') {
            const getTransaction = GetTransaction(requestParameters.status,requestParameters.parameters[0]);
            getTransaction.then(function (_getTransaction) {
                res.status(200).json(_getTransaction);
            });
        } else if (requestParameters.method.toLowerCase() === 'sendtoaddress') {
            const sendToAddress = SendToAddress(requestParameters.status,
                requestParameters.wallet.toLowerCase(),
                requestParameters.parameters[0],
                requestParameters.parameters[1],
                requestParameters.asset.toUpperCase());
            sendToAddress.then(function (_sendToAddress) {
                res.status(200).json(_sendToAddress);
            });

        }else if (requestParameters.method.toLowerCase() === 'move') {
            console.log('\x1b[33m%s\x1b[0m','MOVE ');
            const move = Move(requestParameters.status,
                requestParameters.wallet.toLowerCase(),
                requestParameters.parameters[0],
                requestParameters.asset.toUpperCase(),
                requestParameters.parameters[1]);
            move.then(function (_move) {
                res.status(200).json(_move);
            });

        } else if (requestParameters.method.toLowerCase() === 'createwallet') {
            console.log('\x1b[31m%s\x1b[0m', 'Create Wallet ');
            const createWallet = CreateWallet(requestParameters.status,
                requestParameters.parameters[0].toLowerCase());
            createWallet.then(function (_createWallet) {
                res.status(200).json(_createWallet);
            });
        } else {
            res.status(200).json({
                status: false,
                result: 'WRONG METHOD'
            });
        }
    }
};
