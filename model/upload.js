/**
 * Created by damon on 6/20/16.
 */
var express = require('express');
var app = express();
var multer  = require('multer');
var upload = multer({dest:"upload/",inMemory: true}).single('file');
var Auth=require("../model/auth.js");
var fs=require("fs");
var DB=require("../model/db.js");
var Encrypt=require("../model/encrypt.js");
var uuid = require('uuid');
var async=require("async");
var datetime=require("node-datetime");
var FileNameDet=require("./file.js").FileNameDet;

var FileUpload=function(req, res,next){
    upload(req,res, function (err) {
        if (err) {
            return next({success:false,error:err,status:400});
        }
        ckUserSpace(req.body.token,req.file.size,function(ata){
            if(ata.success){
                FileNameDet(req.file.originalname,function(nameDet){
                    var name=nameDet.name;
                    var ext=nameDet.ext;
                    var key=uuid.v4();
                    var query = {key:key,meta:req.file,share:false,owner:ata.decoded.id,parent:req.body.dir,createDT:datetime.create().now(),filename:name,ext:ext};
                    async.parallel({
                        encrypt: function(callback){
                            Encrypt.en(req.file.filename,query.key,function(resu){
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
                        // results is now equals to: {one: 'abc\n', two: 'xyz\n'}
                        if(results.encrypt&&results.insDb){
                            next({success:true,data:"success",status:201});
                        }else{
                            next({success:false,error:"fail",status:400});
                        }
                    });
                });
            }else{
                fs.unlinkSync(req.file.path);
                return next({success:false,error:ata.error,err:ata,status:401});
            }
        });
    });
};

var ckUserSpace=function(token,fileSize,next){
    Auth.ckTk(token,function(data){
        if(data.success){
            if(data.decoded.space==0){
                next({success:true,decoded:data.decoded});
            }else{
                var userId=data.decoded.id;
                DB.FindAllFilter({owner:userId},"meta","file",function(result){
                    if(result.success){
                        var totSize=0;
                        for(var i=0;i<result.data.length;i++){
                            var size=result.data[i].meta.size;
                            totSize=totSize+size;
                        }
                        var re=data.decoded.space-totSize;
                        if(re>0){
                            next({success:true,decoded:data.decoded});
                        }else{
                            next({success:false,error:"No space"});
                        }
                        console.log('total',totSize);
                    }
                });
            }
        }else{
            next({success:false,error:"Invalid Token"});
        }
    });
};

module.exports.FileUpload=FileUpload;
module.exports.UserSpace=ckUserSpace;