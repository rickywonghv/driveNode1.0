var express = require('express');
var router = express.Router();
var path=require("path");
var Auth=require("../model/auth.js");
var Init=require("../model/initial.js");
var File=require("../model/upload.js"); // File Upload

/* GET home page. */
router.get('/', function(req, res, next) {
  Init.CkKey(function(re){
    if(re){
      Init.CkInstall(function (data) {
        if (data) {
          res.redirect("/");
        } else {
          res.render("setPassword", { title: "Installation" });
        }
      })
    }else{
      res.render("keyInstall", { title: "Installation" });
    }
  })
  
});

router.post('/keyupload',function(req,res,next){
  File.KeyUpload(req,res,function(data){
    res.status(data.status).json(data);
  })
});

module.exports = router;
