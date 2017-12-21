/**
 * Created by damon on 6/27/16.
 */
var app=angular.module('profileApp', ['authApp','fileApp','uiApp','ui.bootstrap.contextMenu']);
app.controller('profileCtrl',function($scope,$window,Dialog,Toast,Profile){
   $scope.profile=function(){

       Dialog.showPrerenderedDialog("#profileDialog");

   };
    $scope.showProfile=function(){
        var token=$window.sessionStorage.getItem("token");
        Profile.showProfile(token,function(data){
            $scope.proUser=data.username;
            $scope.proEmail=data.email;
            if(data.admin){
                var role='Admin';
            }else{
                var role='User';
            }
            $scope.proRole=role;
            $scope.proSpace=data.spaceU;
            $scope.proFilesSize=data.filesSizeU;
            $scope.usedVal=(data.filesSize/data.space)*100;
        });
    };
    
    $scope.showChpwd=function(){
        Dialog.showPrerenderedDialog("#chpwdDialog");
        
    };
    $scope.chpwd=function(){
        if($scope.npwd!==$scope.conpwd){
            $scope.chpwdResult="Password are not match!";
        }else{
            Profile.chpwd($scope.opwd,$scope.npwd,$scope.conpwd,function(data){
                if(data.success){
                    $scope.chpwdResult="Password changed!";
                }else{
                    $scope.chpwdResult=data.data.error;
                }
            });
        }
    }
});

app.factory('Profile',function($http,$window,cfpLoadingBar,Toast,Dialog,$httpParamSerializer){
   var profile={};
   profile.showProfile=function(token,next){
       var username=$window.sessionStorage.getItem("username");
       var role=$window.sessionStorage.getItem("role");
       $http.get("/api/profile?token="+token).then(function(data){
          next(data.data);
       },function(err){
           next(err);
       });
   };

    profile.chpwd=function(opwd,npwd,conpwd,next){
        var token=$window.sessionStorage.getItem("token");
        cfpLoadingBar.start();
        var data=$httpParamSerializer({token:token,opwd:opwd,npwd:npwd,conpwd:conpwd});
        $http.post("/api/chpwd",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
            Toast.showSimple("Password changed");
            cfpLoadingBar.complete();
        },function(err){
            Toast.showSimple(err.data.error);
            next(err);
            cfpLoadingBar.complete();
        });
    };

   return profile;
});