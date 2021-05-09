const express = require('express');
const router = express.Router();
const ContractController = require('../controllers/contracts');




router.get('/', ContractController.listContracts);
router.get('/:Securitykey/:Status', ContractController.listContracts);
router.get('/:symbol', ContractController.getContract);
router.get('/:symbol/:Securitykey/:Status', ContractController.getContract);
router.post('/', ContractController.addContract);

//

module.exports = router;