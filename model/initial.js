/**
 * Created by damon on 7/7/16.
 */
var DB=require("./db.js");
var async=require("async");
var fs=require("fs");
var bc=require("bcrypt-nodejs");
var dt=require("node-datetime");
var auth=require("../model/auth.js");

var init=function(next){
    async.parallel([
        function(cb){
            var datetime=dt.create().now();
            var pwd=bc.hashSync("12345678");
            DB.Add({username:"admin",password:pwd,email:"admin@drivenode.com",admin:true,name:"Damon Wong",space:0,createDT:datetime,update:datetime},"user",function(data){
                console.log(data);
                cb(null,data);
            });
        },function(cb){
            DB.Add({_id:"0"},"dir",function(data){
                console.log(data);
                cb(null,data);
            });
        }
    ],function(err,result){
        console.log(result);
        next("result");
    })
};

var createAdmin=function(password,conpassword,next){
  var errArray=[];
  if(password&&conpassword){
    if(password.length>0&&conpassword.length>0){
      auth.InitialAddAdmin(password,conpassword,function(data){
        next(data);
      })
    }
  }else{
    errArray.push({message:"Miss password or confirm password"});
    next({success:false,error:errArray,status:401});
  }

}

var ckInstall=function(next){
  DB.FindAll({username:"admin"},"user",function(data){
    if(data.data.length>0){
      next(true);
    }else{
      next(false);
    }
  })
};

var dirck=function(path,dirname){
    if(!fs.existsSync(path+dirname)){
      fs.mkdirSync(path+dirname);
    }
};

var keyck=function(next){
  dirck('./','key');
  if(fs.existsSync('./key/private.key')&&fs.existsSync('./key/public.key')&&fs.existsSync('./key/sharePrivate.key')&&fs.existsSync('./key/sharePublic.key')){
    next(true);
  }else{
    next(false);
  }
}

module.exports.Init=init;
module.exports.CkInstall=ckInstall;
module.exports.CreateAdmin=createAdmin;
module.exports.DirCheck=dirck;
