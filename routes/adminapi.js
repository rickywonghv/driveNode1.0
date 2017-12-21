/**
 * Created by damon on 6/25/16.
 */
var express = require('express');
var router = express.Router();
var Admin=require("../model/admin.js");
var check=require("check-types");


router.get('/admin',function(req,res,next){
    Admin.ListAdmin(req.param("token"),"",function(data){
        res.status(data.status).json(data);
    });
});

router.get('/admin/:userId',function(req,res,next){
    var query=req.params.userId;
    Admin.ListAdmin(req.param("token"),query,function(data){
        res.status(data.status).json(data);
    }); 
});

module.exports = router;