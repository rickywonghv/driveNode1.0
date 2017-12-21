/**
 * Created by damon on 6/30/16.
 */
var express = require('express');
var async=require("async");
var En=require("./encrypt.js"); //Require Encryption File
var File=require("./file.js");
var check=require("check-types");
var fs=require("fs");
var archiver = require('archiver');
var Auth=require("./auth.js");
var datetime=require("node-datetime");
var uuid = require('uuid');
var DB=require("./db.js");

var decryptedFile="./files/zip/decrypt/";

var ZipDir=function(token,dirId,next){
  async.waterfall([
      function(cb){
          Auth.ckTk(token,function(data){
              if(data&&data.success&&data.decoded){
                  cb(null,true,data.decoded.id);
              }else{
                  cb(data.error,false,null);
              }
          })
      },function(arg1,uid,cb){
          if(arg1){
              DB.FindOne({_id:dirId,owner:uid},"dir",function(data){
                  if(data&&data.data){
                      cb(null,true,uid);
                  }else{
                      cb(data.error,false);
                  }
              })
          }
      },function(arg1,uid,cb){
          if(arg1){
              DB.FindAll({parent:dirId,owner:uid},"file",function(result){
                  if(result&&result.data&&result.data[0]){
                      cb(null,{data:result.data});
                  }else{
                      cb(result.error,false);
                  }
              })
          }else{
              cb("error",false);
          }
      },function(data,callback){
          if(data&&data.data&&data.data[0]){
              var i=0;
              var arr=[];
              do {
                  var file=data.data[i];
                  var fileKey=file.key;
                  var fileName=file.filename;
                  var fileExt=file.ext;
                  var saveName=file.meta.filename;
                  var memiType=file.meta.mimetype;
                  var json={fileKey:fileKey,fileName:fileName,fileExt:fileExt,saveName:saveName,memiType:memiType};
                  En.deZip(saveName,fileName+"."+fileExt,fileKey,function(dec){
                      //console.log(dec);
                  });
                  arr.push(fileName+"."+fileExt);
                  i++;
              } while (i<data.data.length){
                  Auth.ckTk(token,function(result){
                      if(result.success){
                          callback(null,{success:true,fileSaveArr:arr,uid:result.decoded.id});
                      }else{callback({success:false,error:result.error},null);}
                  });
              }
          }else{
              callback({success:false,error:"Error"},null);
          }
      },function(arg1,callback){
          var result=arg1;
          zip(result,function(data){
              if(data.success){
                  var zipName=data.data.zipName;
                  var zipPath=data.data.zipPath; //with Zip Name
                  var key=uuid.v4();
                  callback(null,zipPath,zipName,key,result.uid);
              }else{
                  callback({success:false,error:result.error},null);
              }
          })
      }
  ],function(err,result){
      if(err){
          next({success:false,status:400,error:err});
      }else{
          next({success:true,status:200,path:result});
      }
  })
};

var ZipFile=function(fileIdArr,pardir,token,next){
    async.waterfall([
        function(callback){
            File.FilesOwner(token,fileIdArr,function(data){
                if(data.success){
                    var arr=[];
                    var i=0;
                    do {
                        var uid=data.uid;
                        var success=data.success;
                        var file=data.data[i];
                        var fileKey=file.key;
                        var fileName=file.filename;
                        var fileExt=file.ext;
                        var saveName=file.meta.filename;
                        var memiType=file.meta.mimetype;
                        var json={sucess:success,fileKey:fileKey,fileName:fileName,fileExt:fileExt,saveName:saveName,memiType:memiType};
                        En.deZip(saveName,fileName+"."+fileExt,fileKey,function(dec){
                            //console.log(dec);
                        });
                        arr.push(fileName+"."+fileExt);
                        i++;
                    } while (i<data.data.length){
                        Auth.ckTk(token,function(result){
                            if(result.success){
                                callback(null,{success:true,fileSaveArr:arr,uid:result.decoded.id});
                            }else{callback({success:false,error:result.error},null);}
                        });
                    }
                }else{
                    next({status:401,success:false,error:"error"});
                }
            });
        },function(arg1,callback){
            var result=arg1;
            zip(result,function(data){
                if(data.success){
                    var zipName=data.data.zipName;
                    var zipPath=data.data.zipPath; //with Zip Name
                    var key=uuid.v4();
                    callback(null,zipName,zipPath,key,result.uid);
                }else{
                    callback({success:false,error:result.error},null);
                }
            })
        },function(zipName,zipPath,key,owner,callback){
            En.enZip(zipPath,zipName,key,function(ca){
                if(ca.success){
                    callback(null,zipName,zipPath,key,owner);
                }else{
                    callback({success:false,error:ca.error},null);
                }
            });
        },function(zipName,zipPath,key,owner,callback){
            File.FileNameDet(zipName,function(filename){
                var name=filename.name;
                var ext=filename.ext;
                callback(null,name,ext,zipName,zipPath,key,owner);
            })
        },function(name,ext,zipName,zipPath,key,owner,callback){
            fs.stat(zipPath,function(err,stats){
                if(err){
                    return next({success:false});
                }
                var size=stats.size;
                var meta={ size : size , path : "" , filename:zipName,destination:"",mimetype:"application/zip",encoding:"7bit",originalname:name+ext,fieldname: "zip"};
                var query = {key:key,meta:meta,share:false,owner:owner,parent:pardir,createDT:datetime.create().now(),filename:name,ext:ext};
                DB.Add(query,"file",function(data){
                    if(data.success){
                        if(fs.existsSync(zipPath)){
                            fs.unlinkSync(zipPath);
                        }
                        callback(null,{success:true,data:zipName+" is compress as zip.",status:201});
                    }else{
                        next({success:false,error:'Error',status:400});
                    }
                })
            });
        }
    ],function(err,result){
        if(err){
            next(err);
        }else{
            next(result);
        }

    });
};

function zip(result,next){
    var date=datetime.create().now();
    var zipFileName=result.uid+"-"+date+".zip";
    var outputPath="./files/zip/"+zipFileName;

    var output = fs.createWriteStream(outputPath);
    var zipArchive = archiver('zip');

    output.on('close', function() {
        console.log('done with the zip', outputPath);
        for(var i=0;i<result.fileSaveArr.length;i++){
            fs.unlinkSync(decryptedFile+result.fileSaveArr[i]);
        }
        next({success:true,status:201,data:{zipName:zipFileName,zipPath:outputPath}});
    });

    zipArchive.pipe(output);

    zipArchive.bulk([
        { src: result.fileSaveArr, cwd: decryptedFile, expand: true }
    ]);

    zipArchive.finalize(function(err, bytes) {
        if(err) {
            //throw err;
            return next(err);
        }
        console.log('done:', base, bytes);
    });
}



module.exports.ZipFile=ZipFile;
module.exports.ZipDir=ZipDir;
module.exports.Zip=zip;