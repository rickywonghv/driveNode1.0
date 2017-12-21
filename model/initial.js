/**
 * Created by damon on 7/7/16.
 */
var DB=require("./db.js");
var async=require("async");
var bc=require("bcrypt-nodejs");
var dt=require("node-datetime");

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

var ckInstall=function(next){
  DB.FindAll({username:"admin"},"user",function(data){
    if(data.data.length>0){
      next(true);
    }else{
      next(false);
    }
  })
};

module.exports.Init=init;
module.exports.CkInstall=ckInstall;
