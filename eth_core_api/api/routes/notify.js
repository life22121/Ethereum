const express=require('express');
const router=express.Router();
const NotifyController=require('../controllers/notify');

router.post('/', NotifyController.startNotify);

module.exports=router;