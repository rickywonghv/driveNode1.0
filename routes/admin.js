var express = require('express');
var router = express.Router();
var path=require("path");
var Auth=require("../model/auth.js");

/* GET home page. */
router.get('/',function(req,res,next){
    adminOnly(req,res,"admin",'Drive | Admin');
});

function adminOnly(req,res,jade,title){
    Auth.AdminOnly(req.cookies.token,function(data){
        if(data.success){
            res.render(jade,{title:title});
        }else{
            res.redirect("/");
        }
    });
}

module.exports = router;
