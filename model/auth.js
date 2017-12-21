/**
 * Created by damon on 6/21/16.
 */
var express = require('express');
var app = express();
var datatime=require("node-datetime");
var fs=require("fs");
var jwt=require("jsonwebtoken");
var DB=require("./db.js");
var check = require('check-types');
var bc=require("bcrypt-nodejs");
var priKey = fs.readFileSync('./key/private.key');
var pubKey=fs.readFileSync('./key/public.key');
var sharePri=fs.readFileSync('./key/sharePrivate.key');
var sharePub=fs.readFileSync('./key/sharePublic.key');
var async=require("async");

var AddUser=function(query,next){
    async.waterfall([
        function(callback){
            if(!check.assigned(query)&&!check.assigned(query.token)&&!check.assigned(query.username)&&!check.assigned(query.password)&&!check.assigned(query.conpassword)&&!check.assigned(query.email)&&!check.assigned(query.admin)&&!check.assigned(query.name)&&!check.assigned(query.space)){
                next({success:false,error:[{message:"Miss Param"}],status:400});
            }else if(check.emptyString(query.token)&&check.emptyString(query.username)&&check.emptyString(query.password)&&check.emptyString(query.conpassword)&&check.emptyString(query.email)&&check.emptyString(query.admin)&&check.emptyString(query.name)&&check.emptyString(query.space)){
                next({success:false,error:[{message:"Miss Param"}],status:400});
            }else{
                callback(null,true,query);
            }
        },function(arg1,arg2,callback){
            if(arg1&&arg2){
                if(arg2.password==arg2.conpassword){
                    callback(null,true,arg2);
                }else{
                    next({success:false,error:[{message:"Password are not match"}],status:400});
                }
            }

        },function(arg1,arg2,callback){
            //Check Admin Token
            if(arg1){
                AdminOnly(arg2.token,function(data){
                    if(data.success){
                        callback(null,true,arg2);
                    }else{
                        next({success:false,error:[{message:"Not Permission"}],status:401});
                    }
                })
            }
        },function(arg1,arg2,callback){
            //Add User
            var hash=bc.hashSync(arg2.password, bc.genSaltSync());
            var DT=datatime.create().now();
            var json={username:arg2.username,password:hash,email:arg2.email,name:arg2.name,admin:arg2.admin,createDT:DT,updateDT:DT,space:arg2.space};
            DB.Add(json,"user",function (data) {
                if(data.success){
                    callback({success:true,data:"User Added",status:201});
                }else{
                    if(data.error.errors){
                        var errArray=[];
                        if(data.error.errors.username){
                            errArray.push({message:data.error.errors.username.message});
                        }
                        if(data.error.errors.password){
                            errArray.push({message:data.error.errors.password.message});
                        }
                        if(data.error.errors.email){
                            errArray.push({message:data.error.errors.email.message});
                        }
                        if(data.error.errors.name){
                            errArray.push({message:data.error.errors.name.message});
                        }
                        if(data.error.errors.admin){
                            errArray.push({message:data.error.errors.admin.message});
                        }
                        next({success:false,error:errArray,status:400});
                    }else{
                        next({success:false,error:data.error,status:400});
                    }
                }
            });
        }
    ],function(result){
       next(result);
    });
};

var LoginUser=function(query,next){
    async.waterfall([
        function(callback){
            if (check.assigned(query)&&check.assigned(query.username)&&check.assigned(query.password)) {
                callback(null,query.username,query.password);
            }else{
                next({success:false,error:"Miss Params",status:401});
            }

        },function(arg1,arg2,callback){
                        DB.FindOne({username:arg1},"user",function(data){
                            if(data.success&&data.data){
                                callback(null,true,data.data,arg2);
                            }else{
                                next({success:false,error:"Wrong username or password!",status:401});
                            }
                        });
        },function(arg1,arg2,arg3,cb){
            if(arg1){
                var dbPwd=arg2.password;
                var plainPwd=arg3;
                if(bc.compareSync(plainPwd,dbPwd)) {
                    cb(null, true,arg2);
                }else{
                    next({success:false,error:"Wrong username or password!",status:401});
                }
            }else{
                next({success:false,error:"Wrong username or password!",status:401});
            }
        },function(arg1,arg2,cb){
            if(arg1){
                var json={id:arg2._id,username:arg2.username,admin:arg2.admin,space:arg2.space};
                genTk(json,function(tk){
                    if(tk.success){
                        cb(null,{success:true,token:tk.token,userdata:json,status:200});
                    }else{
                        next({success:false,error:"Wrong username or password!",status:401});
                    }
                });
            }else{
                next({success:false,error:"Wrong username or password!",status:401});
            }
        }
    ],function(err,result){
        next(result);
    })
};

var UserChpwd=function(token,opwd,npwd,conpwd,next){
    async.waterfall([
        function(callback){
            ckTk(token,function(data){
                if(data.success){
                    callback(null,true,{decoded:data.decoded});
                }else{
                    next({success:false,status:401,error:data.error});
                }
            });
        },
        function(arg1,arg2,callback){
            if(arg1&&arg2) {
                if (check.emptyString(opwd) && check.emptyString(npwd) && check.emptyString(conpwd)) {
                    next({success: false, status: 400, error: "Miss Param"});
                } else if (!check.equal(npwd, conpwd)) {
                    next({success: false, status: 400, error: "Password not match"});
                } else {
                    callback(null,true,arg2);
                }
            }
        },function(arg1,arg2,callback){
            if(arg1&&arg2&&arg2.decoded&&arg2.decoded.id){
                var userId=arg2.decoded.id;
                var query={_id:userId};
                DB.FindOne(query,"user",function(data){
                    if(data&&data.data){
                        callback(null,true,data.data.password,userId);
                    }else{
                        next({success: false, status: 401, error: "Wrong old password"});
                    }
                });
            }
        },function(arg1,respwd,userId,callback){
            if(arg1){
                if(bc.compareSync(opwd,respwd)){
                    callback(null,true,userId);
                }else{
                    next({success: false, status: 401, error: "Wrong old password"});
                }
            }
        },function(arg1,userId,callback){
            if(arg1){
                var pwd=bc.hashSync(npwd,bc.genSaltSync());
                DB.Update({_id:userId},{password:pwd},"user",function(data){
                    if(data.success){
                        callback(null,{success:true,status:200,data:"Password Changed"});
                    }else{
                        next({success: false, status: 401, error:data.error});
                    }
                })
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

var RenewToken=function(token,next){
    async.waterfall([
        function(cb){
            if(token){
                cb(null,true);
            }else{
                cb("Empty Token",false);
            }
        },function(arg1,cb){
            ckTk(token,function(data){
               if(data&data.success&&data.decoded){
                  return cb("Token not expire",false);
               }else if(data&&data.error&&data.error.name&&data.error.name=="TokenExpiredError"){
                    cb(null,true);
               }else{
                   return cb(data.error,false);
               }
            });
        },function(arg1,cb){
            if(arg1){
                var decodedtk = jwt.decode(token);
                if(decodedtk){
                    var id=decodedtk.id;
                    var username=decodedtk.username;
                    var admin=decodedtk.admin;
                    var space=decodedtk.space;
                    var query={id:id,username:username,admin:admin,space:space};
                    genTk(query,function(result){
                       if(result&&result.success&&result.token){
                           cb(null,result.token);
                       }else{
                           return cb("Invalid Token",false);
                       }
                    });
                }else{
                    return cb("Invalid Token",false);
                }
            }else{
                return cb("Invalid Token",false);
            }
        }
    ],function(err,result){
        if(err){
            next({success:false,status:401,error:err});
        }else{
            next({success:true,status:200,token:result});
        }
    })
};

function genShareTk(exp,id,type,next){
    async.waterfall([
        function(cb){
            if(exp!=0){
                var json={algorithm: 'RS256', expiresIn: exp+"h", issuer: "driveDTShare"};
                cb(null,true,json);
            }else if(exp==0){
                var noexpjson={algorithm: 'RS256', issuer: "driveDTShare"};
                cb(null,true,noexpjson);
            }
        },function(arg1,json,cb){
            if(id&&(type=="dir"||type=="file")){
                if(arg1&&json){
                    var query={type:type,objId:id};
                    jwt.sign(query,sharePri,json, function (err, token) {
                        if (err) {
                            next({success: false, error: err});
                            return;
                        }else{
                            cb(null,token);
                        }
                    });
                }
            }else{
                next({success:false,error:"No Object ID or Object Type"});
            }
        }
    ],function(err,result){
        if(err){
            next({success:false,error:err});
        }else{
            next({success:true,token:result});
        }
    });
}

function ckShareToken(token,next){
    jwt.verify(token,sharePub, {issuer:'driveDTShare'}, function(err, decoded) {
        if(err){
            next({success:false,error:err});
            return;
        }
        next({success:true,decoded:decoded});
    });
}

function AdminOnly(token,next){
    ckTk(token,function(data){
        if(data.success&&data.decoded){
            if(data.decoded.admin){
                next({success:true,decoded:data.decoded});
            }else{
                next({success:false,error:"Not Admin",decoded:data.decoded});
            }
        }else{
            next(data);
        }
    });
};

function ckTk(token,next){
    if(!check.null(token)){
        jwt.verify(token, pubKey, {issuer:'driveDT' }, function(err, decoded) {
            if(err){
                next({success:false,error:err});
                return;
            }
            next({success:true,decoded:decoded});
        });
    }else{
        next({success:false,error:"Miss Param"});
    }
}

function genTk(query,next){
    if(check.object(query)) {
        jwt.sign(query, priKey, {algorithm: 'RS256', expiresIn: "5h", issuer: "driveDT"}, function (err, token) {
            if (err) {
                next({success: false, error: err});
                return;
            }
            next({success: true, token: token});
        });
    }else{
        next({success:false,error:"Miss Param"});
    }
}

module.exports.AddUser=AddUser;
module.exports.LoginUser=LoginUser;
module.exports.ckTk=ckTk;
module.exports.AdminOnly=AdminOnly;
module.exports.UserChpwd=UserChpwd;
module.exports.RenewToken=RenewToken;
module.exports.genShareTk=genShareTk;
module.exports.ckShareToken=ckShareToken;