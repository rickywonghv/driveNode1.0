/**
 * Created by damon on 7/11/16.
 */
var downloadPath="./files/downloads";
var async=require("async");
var Auth=require("./auth.js");
var check=require("check-types");
var fs=require("fs");
var File=require("./file.js");
var DB=require("./db.js");
var Encrypt=require("./encrypt.js");
var uuid = require('uuid');
var datetime=require("node-datetime");
var mime = require('mime');
var http=require('http');
var https=require("https");
var child_process=require("child_process");

var download=function(token,url,next){
    //console.log(url.split("/"));
    async.waterfall([
        function(cb){
            Auth.ckTk(token,function(data){
               if(data&&data.success&&data.decoded&&data.decoded.id){
                   cb(null,true,data.decoded.id);
               }else{
                   cb("Token Error",false);
               }
            });
        },function(arg1,uid,cb){
            if(arg1&&uid){
                var name=url.split("/")[url.split("/").length-1];
                var dlpath = downloadPath+"/"+name;
                downloadSingle(url,name,function(data){
                    if(data){
                        cb(null,true,dlpath,name,uid);
                    }else{
                        cb("Error",false);
                    }
                })
            }else{
                cb("Invalid Uid",false);
            }
        },function(arg1,path,fileName,uid,cb){
            if(arg1&&path&&uid){
                if(fs.existsSync(path)){
                    File.FileNameDet(fileName,function(data){
                        var fileDetName=data.name;
                        var fileDetExt=data.ext;
                        cb(null,true,fileDetName,fileDetExt,path,uid);
                    })
                }else{
                    cb("File Not Exist",false);
                }
            }else{
                cb("Error",false);
            }
        },function(arg1,fileDetName,fileDetExt,path,uid,cb){
            if(arg1&&fileDetName&&fileDetExt&&path&&uid&&fs.existsSync(path)){
                var name=fileDetName;
                var ext=fileDetExt;
                var filename=fileDetName+"."+ext;
                var key=uuid.v4();
                var filenameuuid=uuid.v4()+"-download";
                var mimetype=mime.lookup(path);
                var size=fs.statSync(path).size;
                var meta={size:size,path:"files/downloads/"+filenameuuid,filename:filenameuuid,destination:"/files/downloads/",mimetype:mimetype, encoding:"7bit",originalname:filename,fieldname: "download"};
                var query = {key:key,meta:meta,share:false,owner:uid,parent:0,createDT:datetime.create().now(),filename:name,ext:ext};
                async.parallel({
                    encrypt: function(callback){
                        Encrypt.EnDl(filenameuuid,filename,key,function(resu){
                            if(!resu.success){
                                console.log(resu);
                                callback(null,false);
                            }else{
                                callback(null,true);
                            }
                        });
                    },
                    insDb: function(callback){
                        DB.Add(query,"file",function(data){
                            if(data.success){
                                callback(null,true);
                            }else{
                                callback(null,false);
                            }
                        })
                    }
                }, function(err, results) {
                    if(results.encrypt&&results.insDb){
                        cb(null,true)
                    }else{
                        cb("err",false);
                    }
                });
            }
        }
    ],function(err,result){
       if(err){
           next({success:false,status:400,error:err});
       }else{
           next({success:true,status:200,data:result});
       }
    });
};

function downloadSingle(url,filename,next){
    if(filename==""){
        next(false);
    }else{
        child_process.exec("wget --directory-prefix=./files/downloads/ "+url,function(error, stdout, stderr){
            if (error) {
                console.error('exec error:'+error);
                return next(false);
            }
            next(true);
            console.log('stdout:'+stdout);
            console.log('stderr:'+stderr);
        });
    }
}

module.exports.Downloader=download;