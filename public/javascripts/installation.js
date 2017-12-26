var app=angular.module('initApp', ['ngMaterial','ngCookies','angular-loading-bar','ngAnimate']);
app.controller('initCtrl',function($scope,$window,$interval,cfpLoadingBar,initService){
  $scope.initial=function(){
    var password=$scope.init.password;
    var conpassword=$scope.init.confirmPassword;
    initService.initial(password,conpassword,function(data){
      //console.log(data);

    });
  };
});
app.factory('initService',function($http,$window,$httpParamSerializer){
  // /192.168.1.105:3000/init
  var init={};
  init.initial=function(password,conpassword,next){
    var data=$httpParamSerializer({password:password,conpassword:conpassword});
    $http.post("/init",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
        next(data);
    },function(err){
        next(err);
    });
  }
  return init;
});
