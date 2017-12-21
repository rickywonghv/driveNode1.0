/**
 * Created by damon on 6/20/16.
 */

/**Import NPM**/
var express = require('express');
var router = express.Router();
var path = require('path');
var multer=require("multer");
var bytes = require('bytes');
var check=require("check-types");
var fs=require("fs");
var pdf = require('express-pdf');

/**Import Model JS File**/
var File=require("../model/upload.js"); // File Upload
var DriveFile=require("../model/file.js"); // File
var Auth=require("../model/auth.js"); // Authentication
var DriveDir=require("../model/directory.js"); //Directory
var Profile=require("../model/admin.js"); // Admin or User
var Zip=require("../model/compress"); //ZIP
var DL=require("../model/downloader"); //Downlaoder

/** File API **/

//Upload Files
router.post('/upload', function(req, res, next) {
    File.FileUpload(req,res,function(data){
        res.status(data.status).json(data);
    });
});

//List Files
router.get('/file',function(req,res,next){
    var host = req.get('host');
    console.log(req);
    DriveFile.FileList(req.param("token"),req.param("dir"),host,function(data){
        res.status(data.status).json(data);
    })
});

router.get('/qr/:fileId',function(req,res){
    DriveFile.FileQr(req.param("fileId"),function(data){
        if(data&&data.success&&data.path){
            res.download(data.path,"qr.svg",function(result){
                
            });
        }else{
            res.json(data);
        }
    })
});

//File Rename
router.put('/file',function(req,res){
    DriveFile.FileRename(req.body.token,req.body.fileid,req.body.filename,function(data){
        res.status(data.status).json(data);
    });
});

//Delete File
router.delete('/file/:fileId',function(req,res,next){
    DriveFile.FileDelete(req.param("token"),req.params.fileId,function(data){
        res.status(data.status).json(data);
    })
});

//Move File
router.post('/file/move/:fileId',function(req,res,next){
    DriveFile.FileMove(req.body.token,req.params.fileId,req.body.parentDir,req.body.destDir,function(data){
        res.status(data.status).json(data);
    });
});

//Download File
router.get('/download', function(req, res, next) {
    DriveFile.FileDownload(req,res);
});

//Move File to Trash
router.post('/file/trash',function(req,res){
    DriveFile.MoveToTrash(req.body.token,req.body.fileid,function(data){
        res.json(data);
    })
});

//Restore File from Trash
router.post('/file/trash/restore',function(req,res){
    DriveFile.RestoreFile(req.body.token,req.body.fileid,function(data){
        res.json(data);
    })
});

//List Trash File
router.get('/trash',function(req,res){
    DriveFile.ListTrashFiles(req.param("token"),function(data){
        res.json(data);
    });
});

//Zip File
router.post('/zip',function(req,res){
    Zip.ZipFile(req.body.fileid,req.body.dir,req.body.token,function(data){
        res.json(data);
    });
});
//Search File
router.post('/search/:key',function(req,res,next){
    DriveFile.FileSearch(req.body.token,req.params.key,function(data){
        res.json(data);
    })
});

//Bulk Download
router.get('/file/download',function(req,res,next){
    DriveFile.FilesDownload(req.param("token"),req.param("fileid"),function(data){
       if(data&&data.success&&data.path){
           res.download(data.path,"download.zip",function(result){
               if(fs.existsSync(data.path)){
                   fs.unlinkSync(data.path);
               }
           })
       }else{
           res.status(data.status).json(data);
       }
    });
});

//File PUT share public
router.put('/file/share/:fileId',function(req,res){
    DriveFile.FileShare(req.body.token,req.params.fileId,req.param("share"),2,function(data){
        if(data&&data.success&&data.token){
            res.status(data.status).json(data);
        }else{
            res.status(data.status).json(data);
        }
    });
});

router.get('/share/token/:fileId',function(req,res){
   DriveFile.FileShareTk(req.params.fileId,function(data){
       res.status(data.status).json(data);
   })
});

//Download share file
router.get('/download/share/:fileId',function(req,res,next){
   DriveFile.FileShareDownload(req.param("fileId"),req.param("token"),function(data){
       if(data&&data.success&&data.path&&data.orgFileName){
           res.download(data.path,data.orgFileName,function(result){
               if(fs.existsSync(data.path)){
                   fs.unlinkSync(data.path);
               }
           })
       }else{
           res.status(data.status).json(data);
       }
   });
});

router.get("/pdf/:fileId",function(req,res){
    DriveFile.PdfFile(req.param("token"),req.params.fileId,function(data){
        if(data&&data.success){
            res.pdf(data.path);
        }else{
            res.status(401).json(data);
        }
    });
});

/** Directory API**/

//Create Directory
router.post('/dir',function(req,res,next){
    DriveDir.CreateDir(req.body.token,req.body.dir,req.body.dirname,function(data){
       res.status(data.status).json(data);
    });
});

//List Directories
router.get('/dir',function(req,res,next){
   DriveDir.ListDir(req.param("token"),req.param("parent"),function(data){
       res.status(data.status).json(data);
   })
});

//List All Directories
router.get('/dir/all',function(req,res,next){
   DriveDir.ListAllDir(req.param("token"),function(data){
      res.json(data);
   });
});

//Rename Directory
router.put('/dir/:dirId',function(req,res,next){
   DriveDir.RenameDir(req.body.token,req.body.newdirname,req.params.dirId,function(data){
      res.json(data);
   });
});

//Zip Directory
router.get('/dir/zip/:dirId',function(req,res){
   Zip.ZipDir(req.param("token"),req.params.dirId,function(data){
       if(data&&data.success&&data.path){
         res.download(data.path,"download.zip",function(result) {
             if(fs.existsSync(data.path)){
                 fs.unlinkSync(data.path);
             }
         });
       }else{
           res.status(data.status).json(data);
       }
       //res.status(data.status).json(data);
   });
});

/**Admin or User**/
//Add User
router.post('/user',function(req,res,next){
       var username=req.body.username;
       var password=req.body.password;
       var conpassword=req.body.conpassword;
       var email=req.body.email;
       var admin=req.body.admin;
       var name=req.body.name;
       var token=req.body.token;
       var space=req.body.space;
       if(space=="Unlimit"){
           var spacee=0;
       }else{
           var spacee=bytes(space);
       }

       Auth.AddUser({token:token,username:username,password:password,conpassword:conpassword,email:email,admin:admin,name:name,space:spacee},function(data){
           res.status(data.status).json(data);
       });
});

//User Profile
router.get('/profile',function(req,res){
    Profile.UserProfile(req.param("token"),function(data){
        res.json(data);
    });
});

//Change Password
router.post("/chpwd",function(req,res){
    if(check.assigned(req.body.token)&&check.assigned(req.body.opwd)&&check.assigned(req.body.npwd)&&check.assigned(req.body.conpwd)) {
        var token = req.body.token;
        var opwd = req.body.opwd;
        var npwd = req.body.npwd;
        var conpwd = req.body.conpwd;
        Auth.UserChpwd(token, opwd, npwd, conpwd, function (data) {
            res.status(data.status).json(data);
        });
    }else{
        res.status(400).json({success:false,error:"Miss Param"});
    }
});

router.get("/downloader",function(req,res){
    var url=req.param("url");
    var token=req.param("token");
    DL.Downloader(token,url,function(data){
        res.status(data.status).json(data);
    });
});

//Login
router.post('/login',function(req,res,next){
    if(check.assigned(req.body.username)&&check.assigned(req.body.password)){
        var username=req.body.username;
        var password=req.body.password;
        Auth.LoginUser({username:username,password:password},function(data){
            res.status(data.status).json(data);
        });
    }else{
        res.status(400).json({success:false,error:"Miss Param"});
    }
});

router.post('/token',function(req,res,next){
   Auth.RenewToken(req.body.token,function(data){
       res.status(data.status).json(data);
   })
});

module.exports = router;
