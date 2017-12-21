/**
 * Created by damon on 6/27/16.
 */
var app=angular.module('uiApp', ['authApp','ngMaterial','fileApp','uploadApp','ui.bootstrap.contextMenu']);
app.controller('uiCtrl',function($scope){

});

app.factory('Dialog',function($mdDialog, $mdMedia){
    var dialog={};

    dialog.showAlert=function(title,cont) {
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title(title)
                .textContent(cont)
                .ariaLabel('Alert')
                .ok('Got it!')
                .targetEvent()
        );
    };
    dialog.showConfirm = function(title,cont,next) {
        var confirm = $mdDialog.confirm()
            .title(title)
            .textContent(cont)
            .ariaLabel('Del Dialog')
            .targetEvent()
            .ok('Please do it!')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            //$scope.status = 'You decided to get rid of your debt.';
            next(true);
        }, function() {
            //$scope.status = 'You decided to keep your debt.';
            next(false);
        });
    };

    dialog.showPrerenderedDialog = function(id) {
        $mdDialog.show({
            controller: DialogController,
            contentElement:id,
            parent: angular.element(document.body),
            targetEvent: '',
            clickOutsideToClose: true
        });
    };

    function DialogController($mdDialog) {
        dialog.hide = function() {
            $mdDialog.hide();
        };
        dialog.cancel = function() {
            $mdDialog.cancel();
        };
        dialog.answer = function(answer) {
            $mdDialog.hide(answer);
        };
    }

    return dialog;
});

app.factory('Toast',function($mdToast){
    var toast={};
    var last = {
        bottom: true,
        top: false,
        left: false,
        right: true
    };
    toast.toastPosition = angular.extend({},last);
    toast.getToastPosition = function() {
        sanitizePosition();
        return Object.keys(toast.toastPosition)
            .filter(function(pos) { return toast.toastPosition[pos]; })
            .join(' ');
    };
    function sanitizePosition() {
        var current = toast.toastPosition;
        if ( current.bottom && last.top ) current.top = false;
        if ( current.top && last.bottom ) current.bottom = false;
        if ( current.right && last.left ) current.left = false;
        if ( current.left && last.right ) current.right = false;
        last = angular.extend({},current);
    }
    toast.showSimple = function(cont) {
        var pinTo = toast.getToastPosition();
        $mdToast.show(
            $mdToast.simple()
                .textContent(cont)
                .position(pinTo )
                .hideDelay(3000)
        );
    };
    toast.showLoading = function(cont) {
        var pinTo = toast.getToastPosition();
        $mdToast.show(
            $mdToast.simple()
                .textContent(cont)
                .position(pinTo )
        );
    };
    return toast;
});