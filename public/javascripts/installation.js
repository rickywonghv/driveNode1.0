var app = angular.module('initApp', ['ngMaterial', 'ngCookies', 'angular-loading-bar', 'ngAnimate', 'angularFileUpload', 'ui.bootstrap.contextMenu']);
app.controller('initCtrl', function ($scope, $window, $interval, cfpLoadingBar, initService, $location, Action,FileUploader){
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

  $scope.uploadKey=function(){
    //Dialog.showPrerenderedDialog("#uploadKey");
  }

  var uploader = $scope.uploader = new FileUploader({
    url: '/installation/keyupload'
  });

  // FILTERS

  uploader.filters.push({
    name: 'customFilter',
    fn: function (item /*{File|FileLikeObject}*/, options) {
      return this.queue.length < 10;
    }
  });

  // CALLBACKS

  uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
    console.info('onWhenAddingFileFailed', item, filter, options);
  };
  uploader.onAfterAddingFile = function (fileItem) {
    //console.info('onAfterAddingFile', fileItem);
  };
  uploader.onAfterAddingAll = function (addedFileItems) {
    //console.info('onAfterAddingAll', addedFileItems);
  };
  uploader.onBeforeUploadItem = function (item) {
    //item.formData.push({ token: $scope.token, dir: $rootScope.dir });
    //console.info('onBeforeUploadItem', item);
  };
  uploader.onProgressItem = function (fileItem, progress) {
    //console.info('onProgressItem', fileItem, progress);
  };
  uploader.onProgressAll = function (progress) {
    //console.info('onProgressAll', progress);
  };
  uploader.onSuccessItem = function (fileItem, response, status, headers) {
    //console.info('onSuccessItem', fileItem, response, status, headers);
    $scope.success = "Upload Success";
    Action.toast(fileItem._file.name + " is uploaded");
    $scope.listFile($rootScope.dir);
  };
  uploader.onErrorItem = function (fileItem, response, status, headers) {
    $scope.error = response.error;
    Action.timeInter();
    //console.info('onErrorItem', fileItem, response, status, headers);
  };
  uploader.onCancelItem = function (fileItem, response, status, headers) {
    //console.info('onCancelItem', fileItem, response, status, headers);
    Action.toast("File: " + fileItem + " is cancel to upload!");
  };
  uploader.onCompleteItem = function (fileItem, response, status, headers) {

    //console.info('onCompleteItem', fileItem, response, status, headers);
  };
  uploader.onCompleteAll = function () {
    //console.info('onCompleteAll');
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
app.factory('Action', function ($interval, $window) {
  var action = {};
  action.timeInter = function () {
    //Dialog.showAlert("Error", "No Space");
    $interval(function () { $window.location.reload() }, 3600 * 5, 1);
  };

  return action;
});