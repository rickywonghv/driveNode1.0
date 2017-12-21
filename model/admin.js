/**
 * Created by damon on 6/25/16.
 */
var express = require('express');
var app = express();
var datatime=require("node-datetime");
var fs=require("fs");
var jwt=require("jsonwebtoken");
var DB=require("./db.js");
var Auth=require("./auth.js");
var bytes=require("bytes");
var async=require("async");
var check=require("check-types");

var listAdmin=function(token,userId,next){
    async.waterfall([
        function(callback){
            Auth.AdminOnly(token,function(data){
                if(data.success){
                    callback(null,true);
                }else{
                    next({success:false,status:401,error:data.error});
                }
            })
        },function(arg1,callback){
            if(arg1){
                UserList(userId,function(user){
                    if(user.success){
                        callback(null,user);
                    }else{
                        callback(user,null);
                    }
                });
            }else{
                callback({success:false,status:401,error:"error"},null);
            }
        }
    ],function(err,result){
        if(err){
            next(err);
        }else{
            next(result);
        }
    });    
};

var userProfile=function(token,next){
    Auth.ckTk(token,function(data){
        if(data.success){
            var userId=data.decoded.id;
            var query={_id:userId};
            user(query,function(result){
                next(result.data[0]);
            })
        }
    })
};


function UserList(userId,next){
    if(check.emptyString(userId)){
        var id={};
    }else{
        var id={_id:userId};
    }
    DB.FindAllFilter(id,"_id username email name admin createDT updateDT space","user",function(user){
        if(user.success&&user.data&&user.data[0]){
            next({success:true,status:200,data:user});
        }else{
            next({success:false,status:400,error:user.error});
        }
    })
}

function totFilesSize(uid,next){
    DB.FindAllFilter({owner:uid},"meta","file",function(result){
        if(result.success&&result.data&&result.data[0]&&result.data[0].meta){
            var i=0;
            var totSize=0;
            do{
                var size=result.data[i].meta.size;
                totSize=totSize+size;
                i++
            }while(i<result.data.length){
                console.log(totSize);
                next(totSize);
            }
        }else{
            next(0);
        }
    });
}

function user(query,next){
    async.parallel({
        one: function(callback) {
            DB.FindAllFilter(query,"id username email name createDT updateDT admin space","user",function(result){
                if(result.success&&result.data){
                    var array=[];
                        var id=result.data[0].id;
                        var username=result.data[0].username;
                        var email=result.data[0].email;
                        var name=result.data[0].name;
                        var cdt = datatime.create(result.data[0].createDT);
                        var cDT = cdt.format('d/m/Y H:M:S');
                        var updateDT=datatime.create(result.data[0].updateDT);
                        var uDT=updateDT.format('d/m/Y H:M:S');
                        var admin=result.data[0].admin;
                        var space=result.data[0].space;
                        array.push({id:id,username:username,email:email,name:name,createDT:cDT,updateDT:uDT,admin:admin,space:space});
                        callback(null,{success:true,status:200,data:array});
                }else if(!result.data){
                    callback({success:false,status:400,data:"No data"},null);
                }else{
                    callback({success:false,status:400,data:result.error},null);
                }
            })
        },
        two: function(callback) {
            var uid=query._id;
            totFilesSize(uid,function(size){
                callback(null, size);
            })

        }
    },function(err, results) {
        if(results&&results.one&&results.one.data){
            var user=results.one.data[0];
            var id=user.id;
            var email=user.email;
            var username=user.username;
            var name=user.name;
            var createDT=user.createDT;
            var updateDT=user.updateDT;
            var admin=user.admin;
            var space=user.space;
            var filesSize=results.two;
            var filesSizeU=bytes(results.two);
            if(space==0){
                var spaceU="Unlimited";
                var emptySpaceU="Unlimited";
                var emptySpace=0;
            }else{
                var spaceU=bytes(space);
                var emptySpaceU=bytes(space-filesSize);
                var emptySpace=space-filesSize;
            }
            var s=[{id:id,username:username,email:email,name:name,createDT:createDT,updateDT:updateDT,admin:admin,space:space,spaceU:spaceU,emptySpace:emptySpace,emptySpaceU:emptySpaceU,filesSize:filesSize,filesSizeU:filesSizeU}];
            next({success:true,status:200,data:s});
        }
    });
}


module.exports.ListAdmin=listAdmin;
module.exports.UserProfile=userProfile;