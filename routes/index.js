var express = require('express');
var router = express.Router();
var path=require("path");
var Auth=require("../model/auth.js");
var Init=require("../model/initial.js");

/* GET home page. */
router.get('/', function(req, res, next) {
  ckTk(req,res,"index",'Drive');
});

router.get('/view', function(req, res, next) {
  ckTk(req,res,"view",'Drive');
});

router.get('/login',function(req,res,next){
  res.render("login",{title:"Drive"});
});

router.post('/init',function(req,res,next){
  /*
  Init.Init(function(data){
    res.json(data);
  })
  */
  Init.CreateAdmin(req.body.password,req.body.conpassword,function(data){
    res.json(data);
  })

});

function ckTk(req,res,jade,title){
  Auth.ckTk(req.cookies.token,function(data){
    if(data.success){
      res.render(jade,{title:title});
    }else{
      Init.CkInstall(function(data){
        if(data){
          res.render("login",{title:"Drive"});
        }else{
          res.redirect('/installation');
        }
      })

    }
  });
}

module.exports = router;
