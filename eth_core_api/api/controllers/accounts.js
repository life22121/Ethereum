const GetAccounts = require('../subcontrollers/getaccounts');
const GetPrivateKey = require('../subcontrollers/getprivatekey');

exports.all_methods = (req, res, next) => {
    const requestParameters = {
        status: req.body.Status,
        securitykey: req.body.Securitykey,
        wallet: req.body.Wallet,
        method: req.body.Method,
        parameters: req.body.Parameters,
    };

    if(requestParameters.securitykey!='Abcdef1234@'){
        res.status(200).json({
            status: false,
            result: 'WRONG SECURITY KEY'
        });
    }else{
        if (!requestParameters.method) {
            res.status(200).json({
                status: false,
                result: 'METHOD REQUEIRED'
            });
        }
        else {
            if (requestParameters.method === 'getaccounts') {
                const accounts = GetAccounts(requestParameters.status);
                accounts.then(function (_accounts) {
                    res.status(200).json(_accounts);
                });
    
            } else if (requestParameters.method === 'getprivatekey') {
                const privKey = GetPrivateKey(requestParameters.status,requestParameters.parameters[0]);
                privKey.then(function (_privKey) {
                    res.status(200).json(_privKey);
                });
    
            } else {
                res.status(200).json({
                    status: false,
                    result: 'WRONG METHOD'
                });
            }
        }
    }
};
