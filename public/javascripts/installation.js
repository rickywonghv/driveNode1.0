var app=angular.module('initApp', ['ngMaterial','ngCookies','angular-loading-bar','ngAnimate']);
app.controller('initCtrl',function($scope,$window,$interval,cfpLoadingBar,initService,$location){
  $scope.backBtnSuccess=true;
  $scope.backDrive=function(){
    if(!$scope.backBtnSuccess){
      window.location.href="/"
    }
  }
  $scope.initial=function(){
    var password=$scope.init.password;
    var conpassword=$scope.init.confirmPassword;
    initService.initial(password,conpassword,function(data){
      if(data){
        if(data.success){
          $scope.msg=data.data;
          $scope.backBtnSuccess=false;
        }else{
          $scope.msg=data.data;
          $scope.backBtnSuccess=true;
        }
      }
    });
  };
});
app.factory('initService',function($http,$window,$httpParamSerializer){
  var init={};
  init.initial=function(password,conpassword,next){
    var data=$httpParamSerializer({password:password,conpassword:conpassword});
    $http.post("/init",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
        next(data.data);
    },function(err){
        next(err);
    });
  }
  return init;
});
