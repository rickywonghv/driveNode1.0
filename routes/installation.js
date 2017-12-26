var express = require('express');
var router = express.Router();
var path=require("path");
var Auth=require("../model/auth.js");
var Init=require("../model/initial.js");

/* GET home page. */
router.get('/', function(req, res, next) {
  Init.CkInstall(function(data){
    if(data){
      res.redirect("/");
    }else{
      res.render("installation",{title:"Installation"});
    }
  })
});

module.exports = router;
