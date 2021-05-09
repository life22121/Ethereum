const fs = require('fs')

exports.listContracts = (req, res, next) => {
    const requestParameters = {
        status: req.body.Status,
        securitykey: req.body.Securitykey,
        wallet: req.body.Wallet,
        method: req.body.Method,
        parameters: req.body.Parameters,
    };
    if (requestParameters.securitykey != 'Abcdef1234@') {
        res.status(200).json({
            status: false,
            result: 'WRONG SECURITY KEY'
        });
    } else {
        var contracts;
        if (requestParameters.status.toLowerCase() === 'true') {
            contracts = require('../../contractsMain.json');
        } else {
            contracts = require('../../contractsTest.json');
        }
        res.status(200).json({
            status: true,
            result: contracts
        });
    }
};
exports.getContract = (req, res, next) => {
    const requestParameters = {
        status: req.body.Status,
        securitykey: req.body.Securitykey,
        wallet: req.body.Wallet,
        method: req.body.Method,
        parameters: req.body.Parameters,
        symbol: req.params.symbol
    };
    if (requestParameters.securitykey != 'Abcdef1234@') {
        res.status(200).json({
            status: false,
            result: 'WRONG SECURITY KEY'
        });
    } else {
        var contracts;
        if (requestParameters.status.toLowerCase() === 'true') {
            contracts = require('../../contractsMain.json');
        } else {
            contracts = require('../../contractsTest.json');
        }

        var _contract = contracts.find(function(element) {
            return element.symbol.toUpperCase() == requestParameters.symbol.toUpperCase();
        });

        if (!_contract) {
            res.status(200).json({
                status: false,
                result: 'Token is not found'
            });
        } else {
            console.log("Contracts:", _contract)
            res.status(200).json({
                status: true,
                result: _contract
            });
        }
    }
};
exports.addContract = (req, res, next) => {
    const requestParameters = {
        status: req.body.Status,
        securitykey: req.body.Securitykey,
        contractInfo: req.body.Contractinfo
    };

    if (requestParameters.securitykey != 'Abcdef1234@') {
        res.status(200).json({
            status: false,
            result: 'WRONG SECURITY KEY'
        });
    } else if (!requestParameters.contractInfo) {
        res.status(200).json({
            status: false,
            result: 'CONTRACT INFO REQUIRED'
        });
    } else {
        var contracts;
        var contractsFileName = '';
        if (requestParameters.status) {
            contracts = require('../../contractsMain.json');
            contractsFileName = './contractsMain.json';
        } else {
            contracts = require('../../contractsTest.json');
            contractsFileName = './contractsTest.json';
        }
        var contractList = contracts;

        var newContract = requestParameters.contractInfo;

        if (!newContract.standard) {
            res.status(200).json({
                status: false,
                result: 'CONTRACT INFO (standard) REQUIRED'
            });
        } else if (!newContract.symbol) {
            res.status(200).json({
                status: false,
                result: 'CONTRACT INFO (symbol) REQUIRED'
            });
        } else if (!newContract.name) {
            res.status(200).json({
                status: false,
                result: 'CONTRACT INFO (name) REQUIRED'
            });
        } else if (!newContract.contractAddress) {
            res.status(200).json({
                status: false,
                result: 'CONTRACT INFO (contractAddress) REQUIRED'
            });
        } else {
            var _contract = contractList.find(function(element) {
                return element.contractAddress == newContract.contractAddress;
            });
            if (_contract) {
                res.status(200).json({
                    status: false,
                    result: 'Token is exist'
                });
            } else {
                var abiERC20 = require('../../abiERC20.json');
                newContract.abi = abiERC20;
                console.log('default abi used');

                contractList.push(newContract);
                fs.writeFile(contractsFileName, JSON.stringify(contractList), (err) => {
                    if (err) console.log('Error writing file:', err)
                    res.status(200).json({
                        status: true,
                        result: 'Contract added'
                    });
                });
            }
        }
    }
};