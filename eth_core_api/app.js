const express=require('express');
const app=express();
const morgan=require('morgan');
const bodyParser=require('body-parser');

const valuesRoutes=require('./api/routes/values');
const accountsRoutes=require('./api/routes/accounts');
const contractsRoutes=require('./api/routes/contracts');
const notifyRoutes=require('./api/routes/notify');

// Logger : create log
app.use(morgan('dev'));
// body request, readable json format
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept,Authorization"
    );    
    if(req.method==="OPTIONS"){
        res.header('Access-Control-Alloe-Methods','PUT,POST,PATCH,DELETE,GET');
        return res.status(200).json({});
    }
    next();
})


app.use('/api/values',valuesRoutes);
app.use('/api/accounts',accountsRoutes);
app.use('/api/contracts',contractsRoutes);
app.use('/api/notify',notifyRoutes);


// Every request reachs this line
app.use((req,res,next)=>{
    const error=new Error('Not found');
    error.status=404;
    // forward the error request
    next(error);
});

// all kinds of error
app.use((error,req,res,next)=>{
    console.log("all kinds of error: "+error.message);
    res.status(error.status ||500);
    res.json({
        error:{
            message:error.message
        }
    });
});

module.exports=app;