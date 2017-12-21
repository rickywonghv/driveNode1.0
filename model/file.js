/**
 * Created by damon on 6/24/16.
 */
var express = require('express');
var DB=require("./db.js");
var Auth=require("./auth.js");
var fs=require("fs");
var Encrypt=require("./encrypt.js");
var bytes=require("bytes");
var datetime=require("node-datetime");
var async=require("async");
var check=require("check-types");
var qr = require('qr-image');
var Zip=require("./compress.js");
var qrpath='./files/qr/';


var FileList=function(token,dir,host,next){
    Auth.ckTk(token,function(data){
        if(data.success){
            DB.FindAll({owner:data.decoded.id,parent:dir},"file",function(result){
                if(data.success){
                    var files=[];
                    for(var i=0;i<result.data.length;i++){
                        var id=result.data[i]._id;
                        var mimetype=result.data[i].meta.mimetype;
                        var size=result.data[i].meta.size;
                        var sizeUnit=bytes(result.data[i].meta.size);
                        var parent=result.data[i].parent;
                        var filename=result.data[i].filename;
                        var ext=result.data[i].ext;
                        var name=filename+"."+ext;
                        var createDT=datetime.create(result.data[i].createDT).format('m/d/Y H:M:S');
                        var share=result.data[i].share;
                        if(share){
                            var qr_svg = qr.image("http://"+host+'/api/qr/'+id, {type: 'svg'});
                            if (!fs.existsSync(qrpath+id+'.svg')){
                                qr_svg.pipe(require('fs').createWriteStream(qrpath+id+'.svg'));
                            }
                        }            
                        files.push({id:id,mimetype:mimetype,name:name,size:size,sizeUnit:sizeUnit,parentDirId:parent,filename:filename,ext:ext,createDateTime:createDT,share:share});
                    }
                    next({success:true,status:200,data:files});
                }else{
                    next({success:false,status:400,error:result.error});
                }
            })
        }else{
            next({success:false,status:401,error:"Invalid Token"})
        }
    })
};

var FileQr=function(fileId,next){
    if(fs.existsSync(qrpath+fileId+'.svg')){
        next({success:true,status:200,path:qrpath+fileId+'.svg'});
    }else{
        next({success:false,status:401,error:"No Permission"});
    }
};

var FileDownload=function(req,res){
    var decryptDir="./files/decrypt/";
    fileOwner(req.param("token"),req.param("fileId"),function(data){
        if(data.success){
            Encrypt.de(data.data.meta.filename,data.data.key,function(re){
                if(re.success){
                    res.setHeader('Content-Type', data.data.meta.mimetype);
                    res.download(decryptDir+data.data.meta.filename, data.data.filename+"."+data.data.ext,function(){
                        if(fs.existsSync(decryptDir+data.data.meta.filename)){
                            fs.unlinkSync(decryptDir+data.data.meta.filename);
                        }
                    });
                }
            });
        }else{
            res.set('Content-Type','application/json');
            res.status(data.status).json({success:false,error:data.error});
        }
    })
};

var FileDelete=function(token,fileId,next){
    fileOwner(token,fileId,function(res){
        if(res.success){
            var decryptDir="./files/encrypt/";
            var filepath=decryptDir+res.data.meta.filename;
            DB.Remove({_id:fileId},"file",function(data){
                if(data.success){
                    fs.unlinkSync(filepath);
                    return next({success:true,status:204});
                }else{
                    return next({success:false,error:data.error,status:401});
                }
            })
        }else{
            fileLog(token,fileId,"File Delete",function(data){
                if(!data.success){
                    console.log(data);
                }
            });
            return next({success:false,error:"No Permission",status:401});
        }
    })
};

var FileMove=function(token,fileId,parDir,destDir,next) {
    async.waterfall([
        function(callback){
            fileOwner(token,fileId,function(data){
                if(data.success){
                    callback(null,true,data);
                }else{
                    callback({success:false,status:401,error:data},false,null);
                }
            });
        },function(arg1,data,callback){
            if(arg1&&destDir!=0){
                DB.FindOne({_id:destDir,owner:data.data.owner},"dir",function(res){
                    if(res.success&&res.data){
                        callback(null,true,data.data.owner);
                    }else{
                        callback({success:false,status:400,error:"Dir Error"},false);
                    }
                });
            }else if(destDir==0){
                callback(null,true,data.data.owner);
            }
        },function(arg1,uid,callback){
            if(arg1){
                DB.Update({_id:fileId,owner:uid},{parent:destDir},"file",function(data){
                    if(data.success){
                        callback(null,{success:true,status:200,data:data});
                    }else{
                        callback({success:false,status:401,error:"error"},null);
                    }
                })
            }
        }
    ],function(err,result){
        if(err){
            next(err);
        }else{
            fileLog(token,fileId,"File Move",function(data){
                if(!data.success){
                    console.log(data);
                }
            });
            next(result);
        }
    });
};

var FileRename=function(token,fileId,fileName,next){
    fileOwner(token,fileId,function(res){
        if(res.success&&res.data){
            DB.Update({_id:fileId},{filename:fileName},"file",function(data){
                if(data.success){
                    fileLog(token,fileId,"Rename",function(data){
                        if(!data.success){
                            console.log(data);
                        }
                    });
                    next({success:true,data:"success",status:200});
                }else{
                    next({success:false,error:data,status:400});
                }
            })
        }else{
            return next({success:false,error:"No Permission",status:401});
        }
    });
};

var MoveToTrash=function(token,fileIdArray,next){
    async.waterfall([
        function(callback){
            filesOwner(token,fileIdArray,function(data){
                if(data.success){
                    callback(null,true,data);
                }else{
                    callback({success:false,status:401,error:"Invalid Token"},false,null);
                }
            });
        },function(arg1,arg2,callback){
            if(arg1&&arg2&&arg2.data[0]){
                var data=arg2.data; //response data
                var i=0;
                var arr=[];
                do{
                    var owner=data[i].owner;
                    var fileId=data[i]._id;
                    var fileMeta=data[i];
                    var dt=datetime.create().now();
                    var query={owner:owner,fileMeta:fileMeta,createDT:dt};
                    DB.Add(query,"trash",function(result){
                        if(!result.success){
                            callback(result,false,null);
                        }else{
                            arr.push(fileId);
                        }
                    });
                    i++;
                }while(i<data.length){
                    callback(null,true,arr,owner);
                }
            }else{
                callback({success:false,status:401,error:"Invalid Token"},false,null);
            }
        },function(arg1,arr,owner,callback){
            if(arg1){
                var i=0;
                do{
                    var oldFileId=arr[i];
                    DB.Remove({_id:arr[i],owner:owner},"file",function(result){
                        if(result.success&&result.data){
                            console.log(result);
                        }else{
                            callback({success:false,status:400,error:result.error},null);
                        }
                    });
                    i++;
                }while(i<arr.length){
                    for(var i=0;i<fileIdArray;i++){
                        fileLog(token,fileIdArray[i],"File To Trash",function(data){
                            if(!data.success){
                                console.log(data);
                            }
                        });
                    }
                    callback(null,{success:true,status:200,data:"success"});
                }
            }else{
                callback({success:false,status:400,error:result.error},null);
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

var RestoreFile=function(token,trashFileIdArr,next){
    async.waterfall([
        function(callback){
            trashFilesOwner(token,trashFileIdArr,function(data){
                if(data.success&&data.data&&data.data[0]){
                    callback(null,true,data.data);
                }else{
                    callback(data,false,null);
                }
            })
        },function(arg1,data,callback){
            if(arg1){
                var i=0;
                var arr=[];
                do{
                    var oldFileData=data[i].fileMeta;
                    var trashId=data[i]._id;
                    DB.Add(oldFileData,"file",function(result){
                       if(result.success){
                            arr.push(trashId);
                       }else{
                           next({success:false,status:400,error:result.error});
                       }
                    });
                    i++;
                }while(i<data.length){
                    callback(null,true,arr);
                }
            }else{
                callback({success:false,status:400,error:"error"},false,"error");
            }
        },function(arg1,arr,callback){
            if(arg1){
                var i=0;
                do{
                    DB.Remove({_id:arr[i]},"trash",function(result){
                        if(!result.success){
                            callback({success:false,status:400,error:result.error},false,"error");
                        }
                    });
                    i++;
                }while(i<arr.length){
                    callback(null,{success:true,status:200,data:"success"});
                }
            }else{
                callback({success:false,status:400,error:"error"},false,"error");
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

var ListTrashFiles=function(token,next){
    async.waterfall([
        function(callback) {
            Auth.ckTk(token, function (data) {
                if (data.success && data.decoded) {
                    callback(null, true, {decoded: data.decoded});
                } else {
                    callback({success: false, status: 401, error: data.error},null);
                }
            })
        },function(arg1,json,callback){
            if(arg1&&json){
                var uid=json.decoded.id;
                DB.FindAll({owner:uid},"trash",function(data){
                    if(data.success&&data.data[0]){
                        callback(null,{success:true,status:200,data:data.data});
                    }else if(!data.success){
                        callback({success:false,status:400,error:data.error},null);
                    }else{
                        callback({success:true,status:200,data:"Empty"},null);
                    }
                })
            }else{
                callback({success:false,status:400,error:"Error"},null);
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

var FileNameDet=function(orgName,next){
    var nameArray=orgName.split(".");
    if(nameArray[nameArray.length-2]=="tar"&&nameArray[nameArray.length-1]=="gz"){
        var ext="tar.gz";
        nameArray.splice(nameArray.length-1);
        nameArray.splice(nameArray.length-1);
        var name="";
        for(var i=0;i<nameArray.length;i++){
            if(i==0){
                name=name+nameArray[i];
            }else{
                name=name+"."+nameArray[i];
            }
        }
    }else{
        var ext=nameArray[nameArray.length-1];
        nameArray.splice(nameArray.length-1);
        var name="";
        for(var i=0;i<nameArray.length;i++){
            if(i==0){
                name=name+nameArray[i];
            }else{
                name=name+"."+nameArray[i];
            }
        }
    }
    next({name:name,ext:ext});
};

var FileSearch=function(token,key,next){
    async.waterfall([
        function(callback){
            Auth.ckTk(token,function(data){
                if(data&&data.success){
                    callback(null,true,data.decoded.id);
                }else{
                    callback(data,null);
                }
            })
        },function(arg1,uid,callback){
            if(arg1&&uid){
                console.log(key);
                DB.Search(key,"textScore",uid,"file",function(data){
                    //callback(data,null);
                   callback(null,data);
                });
            }else{
                callback("err",null);
            }
        }
    ],function(err,result){
        if(err){
            next({success:false,status:401,error:err});
        }else{
            next({success:true,status:200,data:result});
        }
    })
};

var FilesDownload=function(token,fileIdArr,next){
  async.waterfall([
      function(cb){
          async.parallel({
              cktoken: function(callback) {
                  Auth.ckTk(token,function(data){
                     if(data&&data.success){
                         callback(null,true);
                     }else{
                         callback(false,null);
                     }
                  });
              },
              fileArray: function(callback) {
                 var fileArr=fileIdArr.split(",");
                 callback(null, fileArr);
              }
          }, function(err, results) {
              if(results.cktoken&&results.fileArray&&results.fileArray[0]){
                  cb(null,true,results.fileArray);
              }else{
                  cb("error",false);
              }
          });
      },function(arg1,fileArrayCb,cb){
          if(arg1&&fileArrayCb){
              filesOwner(token,fileArrayCb,function(data){
                  if(data&&data.success&&data.data&&data.data[0]){
                      var filesArrayData=data.data;
                      console.log(data.data);
                      cb(null,true,filesArrayData);
                  }else{
                      cb("err",null);
                  }
              });
          }else{
              cb("No File Permission",null);
          }
      },function(arg,data,callback){
          if(arg&&data){
              var i=0;
              var arr=[];
              do {
                  var file=data[i];
                  var fileKey=file.key;
                  var fileName=file.filename;
                  var fileExt=file.ext;
                  var saveName=file.meta.filename;
                  var memiType=file.meta.mimetype;
                  var json={fileKey:fileKey,fileName:fileName,fileExt:fileExt,saveName:saveName,memiType:memiType};
                  Encrypt.deZip(saveName,fileName+"."+fileExt,fileKey,function(dec){
                      //console.log(dec);
                  });
                  arr.push(fileName+"."+fileExt);
                  i++;
              } while (i<data.length){
                  Auth.ckTk(token,function(result){
                      if(result.success){
                          callback(null,{success:true,fileSaveArr:arr,uid:result.decoded.id});
                      }else{callback(result.error,null);}
                  });
              }
          }else{
              callback("data Error",null);
          }
      },function(arg1,callback){
          var result=arg1;
          Zip.Zip(result,function(data){
              if(data.success){
                  var zipName=data.data.zipName;
                  var zipPath=data.data.zipPath; //with Zip Name
                  callback(null,zipPath,zipName,result.uid);
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
  });
};

var FileShare=function(token,fileId,share,exp,next){
    async.waterfall([
        function(cb){
            fileOwner(token,fileId,function(data){
                if(data&&data.success){
                    if(share=="true"){
                        share=true;
                        cb(null,true,share);
                    }else if(share=="false"){
                        share=false;
                        cb(null,true,share);
                    }else{
                        cb("Miss Share Param",null);
                    }
                }else{
                    cb(data.error,false);
                }
            });
        },function(arg1,s,cb){
            if(arg1){
                DB.Update({_id:fileId},{"share":s},"file",function(result){
                    if(result&&result.success){
                        cb(null,true);
                    }else{
                        cb("Error",false);
                    }
                })
            }else{
                cb("Error",false);
            }
        },function(arg1,cb){
            Auth.genShareTk(exp,fileId,"file",function(data){
                if(data&&data.success){
                    cb(null,token)
                }else{
                    cb("Token Error",false);
                }
            })
        }
    ],function(err,result){
        if(err){
            next({success:false,status:400,error:err});
        }else if(result){
            next({success:true,status:201,data:"success",token:result});
        }
    })
};

var FileShareTk=function(fileId,next){
    if(fileId){
        DB.FindAllFilter({_id:fileId},"share","file",function(data){
            if(data&&data.data&&data.data[0]&&data.data[0].share){
                Auth.genShareTk(1,fileId,"file",function(result){
                    if(result&&result.token){
                        next({success:true,status:200,token:result.token});
                    }else{
                        next({success:false,status:401,error:"No Permission"});
                    }
                })
            }else{
                next({success:false,status:401,error:"No Permission"});
            }
        });
    }else{
        next({success:false,status:401,error:"Miss File ID"});
    }
};

var FileShareDownload=function(fileId,token,next){
    async.waterfall([
        function(cb){
            Auth.ckShareToken(token,function(data){
               if(data&&data.success&&data.decoded&&data.decoded.type=="file"){
                   cb(null,true);
               }else{
                   cb("error",false);
               }
            });
        },function(arg1,cb){
            if(arg1){
                DB.FindAllFilter({_id:fileId},"share meta key filename ext","file",function(data){
                    console.log(data.data[0].meta.filename);
                    if(data&&data.success&&data.data&&data.data[0]&&data.data[0].meta&&data.data[0].key&&data.data[0].share){
                        Encrypt.de(data.data[0].meta.filename,data.data[0].key,function(result){
                            if(result&&result.success){
                                next({success:true,status:200,orgFileName:data.data[0].filename+"."+data.data[0].ext,path:"./files/decrypt/"+data.data[0].meta.filename});
                            }else{
                                next({success:false,status:400,error:"error"});
                            }
                        });
                    }else{
                        next({success:false,status:401,error:"No Permission"});
                    }
                });
            }else{
                cb("Error",null);
            }
        }
    ],function(err,result){
        if(err){
            next({success:false,status:400,error:err});
        }
    });

};

var PdfFile=function(token,fileId,next){
    async.waterfall([
        function(cb){
            fileOwner(token,fileId,function(data){
                if(data&&data.success&&data.data&&data.data.key&&data.data.meta){
                    cb(null,true,data.data);
                }else{
                    next({success:false,status:401,error:"No Permission"});
                }
            })
        },function(arg1,data,cb){
            if(arg1&&data){
                var decryptPath="./files/decrypt/";
                Encrypt.de(data.meta.filename,data.key,function(result){
                    if(result.success){
                        fs.rename(decryptPath+data.meta.filename,decryptPath+data.meta.filename+".pdf",function(err){
                            if(err){
                                cb(err,null);
                            }else{
                                cb(null,{path:decryptPath+data.meta.filename+".pdf"});
                            }
                        });

                    }else{
                        cb("error",null);
                    }
                })
            }else{
                cb("No Permission",null);
            }
        }
    ],function(err,result){
        if(err){
            next({success:false,status:401,error:err});
        }else{
            next({success:true,status:200,path:result.path});
        }
    })
    
};

function fileOwner(token,fileId,next){
    Auth.ckTk(token,function(data){
        if(data.success){
            var tkid=data.decoded.id;
            DB.FindOne({_id:fileId},"file",function(filedata){
                if(filedata.success){
                    if(filedata.data.owner!=tkid){
                        return next({success:false,error:"No Permission",status:401});
                    }else{
                        return next({success:true,data:filedata.data,status:200});
                    }
                }else{
                    return next({success:false,error:"No Permission",status:401});
                }
            })
        }else{
            return next({success:false,error:"No Permission",status:401});
        }
    });
}

function filesOwner(token,fileIdArr,next){
    Auth.ckTk(token,function(data){
        if(data.success){
            var tkid=data.decoded.id;
            DB.MultiFind(fileIdArr,tkid,"file",function(filedata){
                if(filedata.success&&filedata.data){
                    if(filedata.success){
                       return next({success:true,data:filedata.data,status:200});
                    }
                    return next({success:false,error:"No Permission",status:401});
                }else{
                    return next({success:false,error:"No Permission",status:401});
                }
            })
        }else{
            return next({success:false,error:"No Permission",status:401});
        }
    });
}

function trashFilesOwner(token,trashFileIdArr,next){
    Auth.ckTk(token,function(data){
        if(data.success){
            var tkid=data.decoded.id;
            DB.MultiFind(trashFileIdArr,tkid,"trash",function(filedata){
                if(filedata.success&&filedata.data){
                    if(filedata.success){
                        return next({success:true,data:filedata.data,status:200});
                    }
                    return next({success:false,error:"No Permission",status:401});
                }else{
                    return next({success:false,error:"No Permission",status:401});
                }
            })
        }else{
            return next({success:false,error:"No Permission",status:401});
        }
    });
}

function fileLog(token,fileId,action,next){
    async.waterfall([
        function(callback){
            Auth.ckTk(token,function(data){
               if(data.success&&data.decoded){
                   callback(null,true,data.decoded.id);
               }else{
                   callback({success:false,status:401,error:"Invalid Token"},false,null);
               }
            });
        },function(arg1,uid,callback){
            if(arg1){
                var createDT=datetime.create().now();
                var query={uid:uid,fileId:fileId,cat:"File",action:action,createDT:createDT};
                DB.Add(query,"log",function(data){
                    if(data&&data.success){
                        callback(null,true);
                    }else{
                        callback(data,false);
                    }
                });
            }
        }
    ],function(err,result){
        if(err){
            next({success:false,status:400,error:err.error});
        }else{
            next({success:true,status:201,data:result});
        }
    })
}

module.exports.FileList=FileList;
module.exports.FileDownload=FileDownload;
module.exports.FileDelete=FileDelete;
module.exports.FileRename=FileRename;
module.exports.FileOwner=fileOwner;
module.exports.FilesOwner=filesOwner;
module.exports.FileNameDet=FileNameDet;
module.exports.MoveToTrash=MoveToTrash;
module.exports.RestoreFile=RestoreFile;
module.exports.ListTrashFiles=ListTrashFiles;
module.exports.FileMove=FileMove;
module.exports.FileSearch=FileSearch;
module.exports.FilesDownload=FilesDownload;
module.exports.FileShare=FileShare;
module.exports.FileShareDownload=FileShareDownload;
module.exports.PdfFile=PdfFile;
module.exports.FileQr=FileQr;
module.exports.FileShareTk=FileShareTk;