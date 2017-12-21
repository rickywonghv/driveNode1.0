'use strict';
var u=angular.module('uploadApp', ['angularFileUpload','authApp','fileApp','ui.bootstrap.contextMenu']);
u.controller('uploadCtrl', ['$scope', 'FileUploader','$window','$location','Action','Dialog','$rootScope', function($scope, FileUploader,$window,$location,Action,Dialog,$rootScope) {
        $scope.uploadDialog=function(currentDir){
            Dialog.showPrerenderedDialog("#uploadDia");
            $rootScope.dir=currentDir;
        };
        $scope.token=$window.sessionStorage.getItem("token");
        //$location.search().dir;
        var uploader = $scope.uploader = new FileUploader({
            url: '/api/upload'
        });

        // FILTERS

        uploader.filters.push({
            name: 'customFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                return this.queue.length < 10;
            }
        });

        // CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function(fileItem) {
            //console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            //console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            $scope.tokenfield=$window.sessionStorage.getItem("token");
            item.formData.push({token:$scope.token,dir:$rootScope.dir});
            //console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            //console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function(progress) {
            //console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            //console.info('onSuccessItem', fileItem, response, status, headers);
            $scope.success="Upload Success";
            Action.toast(fileItem._file.name+ " is uploaded");
            $scope.listFile($rootScope.dir);
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            $scope.error=response.error;
            Action.timeInter();
            //console.info('onErrorItem', fileItem, response, status, headers);
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            //console.info('onCancelItem', fileItem, response, status, headers);
            Action.toast("File: "+fileItem+" is cancel to upload!");
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {

            //console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function() {
            //console.info('onCompleteAll');
        };

        //console.info('uploader', uploader);
    }]);
u.factory('Action',function($interval,$window,Dialog,Toast){
   var action={};
   action.timeInter=function(){
       Dialog.showAlert("Error","No Space");
       $interval(function(){$window.location.reload()},3600*5,1);
   };
   action.toast=function(cont){
       Toast.showSimple(cont);
   };

   return action;
});