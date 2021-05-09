const StartNotify = require('../subcontrollers/startNotify');

exports.startNotify = (req, res, next) => {
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
        const start = StartNotify(requestParameters.status);
        start.then(function (_start) {
            res.status(200).json(_start);
        });
    }
};


