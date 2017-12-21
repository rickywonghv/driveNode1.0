/**
 * Created by damon on 6/24/16.
 */
var app=angular.module("fileApp",['authApp','ngMaterial','uploadApp','angular-loading-bar','ngAnimate','ui.bootstrap.contextMenu','ngAudio','ngAria']);
app.controller("fileCtrl",function($scope,$rootScope,FileService,$window,$http,AuthService,DirService,$interval,Dialog,cfpLoadingBar,Toast,ngAudio){
    var token=$window.sessionStorage.getItem("token");
    $scope.selected=[];
    $scope.selectd=null;
    $scope.number=null;

    $rootScope.$watch('online',function(newVal,oldVal){
       if(!newVal){
           Toast.showSimple("No Connection. Please check your connection!");
           $scope.connectionErr="No Connection. Please check your connection!";
       }
    });

    $scope.downloaderDialog=function(currentDirId) {
        Dialog.showPrerenderedDialog("#downloaderDialog");

    };

    $scope.selectedItem=function(selected){
        Dialog.showPrerenderedDialog("#selectedQ");
        $scope.selecteds=selected;
    };

    $scope.selectedRm=function(select){
        if(select){
            var i = $scope.selected.indexOf(select);
            if(i != -1) {
                $scope.selected.splice(i, 1);
            }
        }else{
            Dialog.showSimple("Please select an item to remove");
        }
    };

    $scope.listDir=function(current){
        cfpLoadingBar.start();
        DirService.listDir(current,token,function(data){
            $scope.dirs=data.data.data;
            cfpLoadingBar.complete();
        })
    };
    //downloadSelect
    $scope.resetSec=function(){
        $scope.selected=[];
        $scope.selectd=null;
        $scope.number=null;
    };

   $scope.listFile=function(dir,name){
       $scope.currentDir=dir;
       $scope.currentDirName=name;
       var token=$window.sessionStorage.getItem("token");
       $scope.token=token;
       FileService.list(dir,token,function(data){
           if(data.data.success){
               $scope.listDir(dir);
               var files=data.data.data;
               $scope.files=files;

               $scope.imgPreviewSrc=null;
           }else{
               AuthService.destoy();
               $window.location.href="/login";
           }
       });
   };
    
    $scope.fileIcon=function(mimeType){
        if(mimeType=="audio/mp3"){
            $scope.fileicon="music-file.svg";
        }else{
            $scope.fileicon="text-doc.svg";
        }
    };
    
    $scope.delFile=function(fileId,fileName,parent){
        var token=$window.sessionStorage.getItem("token");
        Dialog.showConfirm("Confirm to Delete","A you sure to delete "+fileName+"? ",function(data){
            if(data){
                FileService.delete(fileId,fileName,token);
                $interval(function(){$scope.listFile(parent)},3600*2,1);
            }
        })
    };

    $scope.newDir=function(currDir){
        Dialog.showPrerenderedDialog("#newDir");
    };

    $scope.createDir=function(currDir){
        var token=$window.sessionStorage.getItem("token");
        DirService.createDir(currDir,$scope.dirname,token,function(){

        });
    };
    
    $scope.fileRename=function(fileId,fileName,parent){
       var token=$window.sessionStorage.getItem("token");
        Dialog.showPrerenderedDialog("#renameFile");
        $scope.Rename(fileId,fileName,function(data){
            $scope.fileName=fileName;
            $scope.fileId=fileId;
            $scope.fileParent=parent;
        })
    };

    $scope.rename=function(fileId,fileParent){
        var fileName=$scope.fileName;
        var token=$window.sessionStorage.getItem("token");
        FileService.fileRename(fileId,fileName,token,function(data){
            if(data.data.success){
                $scope.renameRes="Success";
                $interval(function(){$scope.listFile(fileParent)},3600*2,1);
            }else{
                Dialog.showAlert("Error",data.data.error);
            }
        });
    };

    $scope.Rename=function(fileId,fileName,next){
        next({id:fileId,name:fileName})
    };

    $scope.bulkDel=function(selectd){
        for(var i=0;i<selectd.length;i++){
            var names=names+selectd[i].name+" , ";
        }
        Dialog.showConfirm("Delete Confirm","Are you sure to delete "+names+" ?",function(data){
            if(data){
                for(var i=0;i<selectd.length;i++){
                    $scope.delFile(selectd[i].id,selectd[i].name,selectd[i].parentDirId);

                }
            }
        });
    };

    $scope.imgPreview=function(imgId,imgName,parent){
        Dialog.showPrerenderedDialog("#imgPreview");
        var token=$window.sessionStorage.getItem("token");
        $scope.imgPreviewSrc="/api/download?fileId="+imgId+"&token="+token;
        $scope.imgPreviewName=imgName;
    };

    $scope.fileDetail=function(fileId,fileName,createDateTime,mimeType,ext,size,share,shareqr){
        Dialog.showPrerenderedDialog("#fileDetail");
        $scope.DfileId=fileId;
        $scope.DfileName=fileName;
        $scope.DcreateDT=createDateTime;
        $scope.DmimeType=mimeType;
        $scope.Dext=ext;
        $scope.Dsize=size;
        $scope.Dshare=share;
        $scope.shareqr=shareqr;
    };

    $scope.zip=function(selected){
        var names="";
        for(var i=0;i<selected.length;i++){
            names=names+" , "+selected[i].name;
        }
        Dialog.showConfirm("Zip Confirm","Are you sure to zip "+names+" ?",function(data){
            if(data){
                var arr=[];
                var dir=[];
                for(var i=0;i<selected.length;i++){
                    var id=selected[i].id;
                    var parentDirId=selected[i].parentDirId;
                    arr.push(id);
                    dir.push(parentDirId);
                }
                FileService.zipFile(arr,dir,function(result){

                });
            }
        });
    };

    $scope.dirRename=function(parentDir,dirId){
        var token=$window.sessionStorage.getItem("token");
        if($scope.dirNewName&&dirId){
            var name=$scope.dirNewName;
            DirService.renmaeDir(dirId,name,token,function(data){
                if(data.data.success){
                    Toast.showSimple("Renamed");
                    $scope.listFile(parentDir);
                    $scope.renameMsg="Renamed";
                }else{
                    $scope.renameMsg="Error";
                }
            });
        }else{
            $scope.renameMsg="Please Enter name";
        }
    };

    $scope.trashFile=function(fileId,fileName){
        Dialog.showConfirm("Move to trash","Move "+fileName+" to trash",function(result){
           if(result){
               var token=$window.sessionStorage.getItem("token");
               FileService.moveToTrash(fileId,token,function(data){
                    $scope.listFile("0");
               });
           }
        });
        
        
    };

    $scope.trash=function(){
        var token=$window.sessionStorage.getItem("token");
        FileService.listTrash(token,function(data){
            if(data.data.data=="Empty"){

            }else{
                $scope.trashFiles=data.data.data;
            }
        });
    };

    $scope.restoreFile=function(trashId,fileName){
        Dialog.showConfirm("Restore File","Sure to restore "+fileName+" ?",function(result){
            if(result){
                var token=$window.sessionStorage.getItem("token");
                FileService.restoreFile(token,trashId,function(data){
                    $scope.trash();
                });
            }
        });
    };

    $scope.allDirList=function(){
        DirService.listAllDir(function(data){
            $scope.movedirs=data.data.data;
        })
    };
    
    $scope.moveFile=function(fileId,parentDirId){
        if($scope.selectedDir=="0"){
            var destDirId=0;
        }else{
            var destDirId=$scope.selectedDir._id;
        }
            DirService.moveFileDir(fileId,parentDirId,destDirId,function(data){
                console.log(data);
                if(data.data.success){
                    Toast.showSimple("File moved already");
                }else{
                    Toast.showSimple(data.data.error);
                }
            })
    };

    $scope.zipDirPro=function(dirId){
        if(dirId){
            DirService.zipDir(dirId,function(data){

            });
        }else{
            Dialog.showAlert("Error","Please select file");
        }
    };

    $scope.downloads=function(selected){
        var token=$window.sessionStorage.getItem("token");
        if(selected&&token){
            var array=[];
            for(var i=0;i<selected.length;i++){
                array.push(selected[i].id);
            }
            //console.log(array.toString());
            $window.location.href="/api/file/download?token="+token+"&fileid="+array.toString();

        }else{
            Dialog.showAlert("Error","Please select something");
        }
    };
    
    $scope.downloadItem=function(fileId){
        var token=$window.sessionStorage.getItem("token");
        $window.location.href="/api/download?fileId="+fileId+"&token="+token;
    };

    $scope.MoveFile=function(fileName,fileId,fileParDirId){
        Dialog.showPrerenderedDialog("#dirMove");
        $scope.moveFileName=fileName;
        $scope.allDirList();
        $scope.moveFileId=fileId;
        $scope.moveParDir=fileParDirId;
    };

    $scope.showSelect=function(select){
        console.log(select);
    };
    $scope.downloaderQ=[];

    $scope.removeUrl=function(downloadSelect){
        if(downloadSelect){
            var i = $scope.downloaderQ.indexOf(downloadSelect);
            if(i != -1) {
                $scope.downloaderQ.splice(i, 1);
            }
        }else{
            Dialog.showSimple("Please select an item to remove");
        }
    };

    $scope.downloadUrlAdd=function(){
        var url=$scope.urlInput;
        if($scope.urlInput){
            $scope.downloaderQ.push({url:url});
            $scope.urlInput=null;
        }
    };

    $scope.downloaderDl=function(url){
        if(url){
            FileService.downloaderDl(url,function(data){

            });
        }else{
            Toast.showSimple("Downloader: Download Fail")
        }
    };

    $scope.shareFile=function(fileId){
        if(fileId){
            var share=$scope.shareBoolean;
            FileService.shareFile(fileId,share,function(data){
                $scope.listFile(0,'/');
            });
        }else{
            Dialog.showAlert("Error","No File Id select!");
        }
    };

    //Files Context Menu
    $scope.menuOptions = [
        ['Rename', function (link) {
            $scope.fileRename(link.file.id,link.file.filename,link.file.parentDirId);
        }],
        ['Download', function (link) {
            $scope.downloadItem(link.file.id);
        }],
        ['Move', function (link) {
            $scope.MoveFile(link.file.name,link.file.id,link.file.parentDirId)
        }],
        ['Delete', function (link) {
            $scope.delFile(link.file.id,link.file.name,link.file.parentDirId);
        }],
        ['Move to Trash', function (link) {
            $scope.trashFile(link.file.id,link.file.name);
        }],
        null,
        ['Preview',function(link){
            if(link.file.mimetype=="image/jpeg"||link.file.mimetype=="image/png"){
                $scope.imgPreview(link.file.id,link.file.name,link.file.parentDirId);
            }else if(link.file.mimetype=="application/pdf"){
                var token=$window.sessionStorage.getItem("token");
                $window.location.href="/api/pdf/"+link.file.id+"?token="+token;
                //$scope.pdfUrl="/api/download?fileId="+link.file.id+"&token="+token;
            }
        }, function (link) {
            if(link.file.mimetype=="image/jpeg"||link.file.mimetype=="image/png"||link.file.mimetype=="application/pdf"){
                return true;
            }else{
               return false;
            }
        }],
        ['Play',function(link){
            if(link.file.mimetype=="audio/mp3"||link.file.mimetype=="audio/mpeg"){
                //$scope.imgPreview(link.file.id,link.file.name,link.file.parentDirId);
                $scope.musicName=link.file.name;
                var musicId=link.file.id;
                var token=$window.sessionStorage.getItem("token");
                var musicUrl="/api/download?fileId="+musicId+"&token="+token;
                $scope.audio = ngAudio.load(musicUrl);
            }
        }, function (link) {
            if(link.file.mimetype=="audio/mp3"||link.file.mimetype=="audio/mpeg"){
                return true;
            }else{
                return false;
            }
        }],
        ['Share File to public',function(link){
            Dialog.showPrerenderedDialog("#fileSharePublic");
            var file=link.file;
            $scope.shareName=file.filename;
            $scope.shareId=file.id;
            $scope.shareBoolean=file.share;
            if(file.share){
                FileService.shareFileTk(file.id,function(data){
                    if(data&&data.data&&data.data.token){
                        $scope.sharePubUrl="/api/download/share/"+file.id+"?token="+data.data.token;
                    }else{

                    }
                })
            }else{
                $scope.sharePubUrl="";
            }
        }],
        ['File Detail',function(link){
            var file=link.file;
            $scope.fileDetail(file.id,file.filename,file.createDateTime,file.mimetype,file.ext,file.sizeUnit,file.share,file.shareqr);
        }]
    ];

    $scope.dirMenuOptions= [
        ['Rename', function (link) {
            Dialog.showPrerenderedDialog("#dirRename");
            $scope.dirNewName=link.dir.name;
            $scope.renameDirId=link.dir.id;
            $scope.parentDirId=link.dir.parent;
        }],
        ['Directory Detail',function(link){
            Dialog.showPrerenderedDialog("#dirDetail");
            $scope.DDirName=link.dir.name;
            $scope.DDirCreateDT=link.dir.createDT;
        }],
        ['Zip Directory',function(link){
            Dialog.showPrerenderedDialog("#dirZip");
            $scope.zipDirName=link.dir.name;
            $scope.zipDirId=link.dir.id;
            $scope.zipDirParentId=link.dir.parent;
        }]
    ];

    //Select
    $scope.selected = [];
    $scope.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) {
            list.splice(idx, 1);
        }
        else {
            list.push(item);
            $scope.number=list;
        }
    };
    $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
    };
});

app.factory('DirService',function($http,Dialog,$window,$httpParamSerializer,Toast){
   var dir={};
    dir.listDir=function(parent,token,next){
        $http.get("/api/dir?token="+token+"&parent="+parent).then(function(data){
            next(data);
        },function(err){
            next(err);
        });
    };
    dir.createDir=function(parent,name,token,next){
        var data=$httpParamSerializer({dir:parent,dirname:name,token:token});
        $http.post("/api/dir",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
           next(data);
           Toast.showSimple("Directory "+name+" added.");
        },function(err){
            next(err);
        });
    };
    dir.renmaeDir=function(dirId,name,token,next){
        var data=$httpParamSerializer({newdirname:name,token:token});
        $http.put("/api/dir/"+dirId,data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
        },function(err){
            next(err);
        });
    };
    dir.listAllDir=function(next){
        var token=$window.sessionStorage.getItem("token");
        $http.get("/api/dir/all?token="+token).then(function(data){
            next(data);
        },function(err){
            next(err);
            Toast.showSimple(err.error);
        });
    };
    dir.moveFileDir=function(fileId,parentDirId,destDirId,next){
        var token=$window.sessionStorage.getItem("token");
        var data=$httpParamSerializer({destDir:destDirId,parentDir:parentDirId,token:token});
        $http.post("/api/file/move/"+fileId,data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
        },function(err){
            next(err);
        });
    };
    dir.zipDir=function(dirId,next){
        var token=$window.sessionStorage.getItem("token");
        if(token){
            $window.location.href="/api/dir/zip/"+dirId+"?token="+token;
        }else{
            Dialog.showSimple("Invalid Token");
        }
    };
   return dir;
});

app.factory('FileService',function($http,Dialog,$window,Toast,$interval,cfpLoadingBar,$httpParamSerializer){
   var file={};

    file.list=function(dir,apptoken,next){
        $http.get("/api/file?token="+apptoken+"&&dir="+dir).then(function(data){
            next(data);
        });
    };

    file.download=function(fileId,apptoken){
        var downloadLink = angular.element('<a></a>');
        downloadLink.attr('href',"/api/download?fileId="+fileId+"&token="+apptoken);
        downloadLink[0].click();
    };

    file.delete=function(fileId,fileName,apptoken){
        $http.delete("/api/file/"+fileId+"?token="+apptoken).then(function(result){
            Toast.showSimple(fileName+" is deleted");
        },function(err){
            Dialog.showAlert('Error',err.data.error);
        });
    };
    
    file.fileRename=function(fileId,fileName,apptoken,next){
        var data=$httpParamSerializer({filename:fileName,fileid:fileId,token:apptoken});
        $http.put("/api/file",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
            Toast.showSimple(fileName+" renamed already!");
        },function(err){
            Dialog.showAlert("Error",err.data.error);
            next(err);
        });
    };

    file.zipFile=function(ArrId,pDirArray,next){
        cfpLoadingBar.start();
        var token=$window.sessionStorage.getItem("token");
        var data=$httpParamSerializer({dir:pDirArray[0],fileid:ArrId,token:token});
        $http.post("/api/zip",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
            Toast.showSimple("Zip Completed");
            cfpLoadingBar.complete();
        },function(err){
            Dialog.showAlert("Error",err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

    file.moveToTrash=function(fileIdArr,token,next){
        cfpLoadingBar.start();
        var data=$httpParamSerializer({fileid:fileIdArr,token:token});
        $http.post("/api/file/trash",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
            Toast.showSimple("Move to trash completed");
            cfpLoadingBar.complete();
        },function(err){
            Dialog.showAlert("Error",err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

    file.listTrash=function(token,next){
        cfpLoadingBar.start();
        $http.get("/api/trash?token="+token).then(function(data){
            next(data);
            cfpLoadingBar.complete();
        },function(err){
            Dialog.showAlert("Error",err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

    file.restoreFile=function(token,trashId,next){
        cfpLoadingBar.start();
        var data=$httpParamSerializer({fileid:trashId,token:token});
        $http.post("/api/file/trash/restore",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
            Toast.showSimple("Restore completed");
            cfpLoadingBar.complete();
        },function(err){
            Dialog.showAlert("Error",err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

    file.downloaderDl=function(url,next){
        var token=$window.sessionStorage.getItem("token");
        cfpLoadingBar.start();
        $http.get("/api/downloader?url="+url+"&token="+token).then(function(data){
            next(data);
            Toast.showSimple("Restore completed");
            cfpLoadingBar.complete();
        },function(err){
            Dialog.showAlert("Error",err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

    file.shareFile=function(fileId,share,next){
        var token=$window.sessionStorage.getItem("token");
        cfpLoadingBar.start();
        var data=$httpParamSerializer({token:token});
        $http.put("/api/file/share/"+fileId+"?share="+share,data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
            cfpLoadingBar.complete();
        },function(err){
            Dialog.showAlert("Error",err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

    file.shareFileTk=function(fileId,next){
        cfpLoadingBar.start();
        $http.get("/api/share/token/"+fileId).then(function(data){
            next(data);
            cfpLoadingBar.complete();
        },function(err){
            Dialog.showAlert("Error Token Get",err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

    return file;
});

app.config(function($mdIconProvider) {
    $mdIconProvider
        .iconSet('mime', '/images/icon/text-doc.svg', 24)
        .defaultIconSet('/images/icon/text-doc.svg', 24);
});