/**
 * Created by damon on 6/24/16.
 */
var express = require('express');
var Auth=require("./auth.js");
var DB=require("./db.js");
var File=require("./file.js");
var async=require("async");
var datetime=require("node-datetime");

var createDir=function(token,parentId,dirName,next){
    Auth.ckTk(token,function(data){
        if(data.success){
            var name=dirName;
            var parentDir=parentId;
            var owner=data.decoded.id;
            var share=false;
            var dt=datetime.create().now();
            var query={name:name,parent:parentDir,share:share,owner:owner,createDT:dt,updateDT:dt};
            DB.Add(query,"dir",function(result){ //name,parent,share,owner
                if(result.success){
                    next({status:201,success:true,data:result});
                }else{
                    next({status:400,success:false,error:result.error});
                }
            })
        }else{
            next({status:401,success:false,error:data.error});
        }
    })
};

var listDir=function(token,parentId,next){
    async.waterfall([
        function(callback){
            Auth.ckTk(token,function(data){
                if(data&&data.success){
                    callback(null,true,data.decoded.id);
                }else{
                    callback(data.error,null);
                }
            });
        },function(arg1,uid,cb){
            DB.FindAll({owner:uid,parent:parentId},"dir",function(result){
                if(result.success&&result.data&&result.data[0]){
                    var arr=[];
                    for(var i=0;i<result.data.length;i++){
                        var id=result.data[i]._id;
                        var name=result.data[i].name;
                        var parent=result.data[i].parent;
                        var createDT=datetime.create(result.data[i].createDT).format('d/m/Y H:M:S');
                        var updateDT=datetime.create(result.data[i].updateDT).format('d/m/Y H:M:S');
                        var files=DB.Count({parent:id},"file");
                        arr.push({id:id,name:name,parent:parent,createDT:createDT,updateDT:updateDT,files:files});
                    }
                    cb(null,{arr:arr});
                }else if(result&&result.data&&!result.data[0]){
                    next({status:200,success:false,data:null});
                }else if(!result.success){
                    cb("error",false);
                }
            })
        }
    ],function(err,result){
        if(err){
            next({status:400,success:false,error:err});
        }else{
            next({status:200,success:true,data:{arr:result.arr}});
        }
    });
};

var listAllDir=function(token,next){
    async.waterfall([
        function(callback){
            Auth.ckTk(token,function(data){
                if(data.success&&data.decoded){
                    callback(null,true,data.decoded.id);
                }else{
                    callback({success:false,status:401,error:data.decoded.error},false);
                }
            })
        },function(arg1,uid,callback){
            if(arg1){
                DB.FindAll({owner:uid},"dir",function(data){
                    console.log(data);
                    if(data.success&&data.data){
                        callback(null,data);
                    }else{
                        callback({success:false,status:400,error:data.error},null);
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
    })
};

var renameDir=function(token,newDirName,dirId,next){
    async.waterfall([
        function(callback){
            dirOwner(token,dirId,function(data){
                if(data.success){
                    callback(null,true,data.uid,newDirName,dirId);
                }else{
                    callback(data,false);
                }
            });
        },function(arg1,uid,newDirName,dirId,callback){
            if(arg1){
                DB.Update({_id:dirId,owner:uid},{name:newDirName},"dir",function(result){
                    if(result.success){
                        callback(null,{success:true,status:200,data:result});
                    }else{
                        callback({success:false,status:400,data:result},null);
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

function dirOwner(token,dirId,next){
    async.waterfall([
        function(callback){
            Auth.ckTk(token,function(data){
                if(data.success){
                    callback(null,{decoded:data.decoded});
                }else{
                    callback({success:false,status:401,error:data.error},null);
                }
            });
        },function(result,callback){
            var uid=result.decoded.id;
            DB.FindOne({_id:dirId},"dir",function(dirs){
                if(dirs&&dirs.data&&dirs.data.owner==uid){
                    callback(null,{success:true,uid:uid});
                }else{
                    callback({success:false,error:"No Permission",status:401},null);
                }
            })
        }
    ],function(err,result){
        if(err){
            next(err);
        }else{
            next(result);
        }
    });
    
}

module.exports.CreateDir=createDir;
module.exports.ListDir=listDir;
module.exports.ListAllDir=listAllDir;
module.exports.RenameDir=renameDir;