const express=require('express');
const router=express.Router();
const ValuesController=require('../controllers/values');

router.post('/', ValuesController.all_methods);

module.exports=router;