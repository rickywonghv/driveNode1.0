/**
 * Created by damon on 6/21/16.
 */
var app=angular.module('authApp', ['ngMaterial','ngCookies','uploadApp','fileApp','profileApp','adminApp','angular-loading-bar','ngAnimate','uiApp','ui.bootstrap.contextMenu','ngAria']);
    app.run(function($rootScope){
        $rootScope.online= navigator.onLine;
    });

    app.controller('loginCtrl', function($scope, AuthService,$window,$rootScope,$mdDialog, $mdMedia,cfpLoadingBar) {
        AuthService.ckConnection();
        cfpLoadingBar.start();
        $scope.credentials = {
            username: '',
            password: ''
        };
        $scope.status = '  ';
        $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
        function showAlert(title,cont) {
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
        
        $scope.login = function (credentials) {
            cfpLoadingBar.start();
            if(credentials.username&&credentials.password){
                AuthService.login(credentials).then(function(data){
                    cfpLoadingBar.complete();
                    if(data.success){
                        $rootScope.username=data.userdata.username;
                        $window.location.href="/";
                    }else{
                        showAlert("Error","Wrong Username or Password");
                        $scope.msg="Wrong Username or Password";
                    }
                });
            }else{
                cfpLoadingBar.complete();
                showAlert("Error","Please Enter Username and Password");
                $scope.msg="Please Enter Username and Password";
            }
        };
    });

    app.controller("authCtrl",function($scope,$window,USER_ROLES,AuthService,$rootScope,$cookies,cfpLoadingBar){
        cfpLoadingBar.start();
        if(AuthService.isAuthenticated()){
            $scope.currentUser = null;
            $scope.role = $window.sessionStorage.getItem("role");
            $scope.username = $window.sessionStorage.getItem("username");
        }else{
            $window.location.href="/login";
        }
        $scope.logout=function(){
            AuthService.destoy();
            $window.location.href="/login";
        };
        $scope.isAdmin=function(){
            return AuthService.isAdmin();
        };
        AuthService.ckConnection();
    });


    app.constant('USER_ROLES', {
        true: 'admin',
        false: 'user'
    });

    app.factory('AuthService', function ($http,$cookies,USER_ROLES,$window,$rootScope,Toast,Dialog) {
        var authService = {};
        
        authService.login = function (credentials) {
            return $http
                .post('/api/login', credentials)
                .then(function (res) {
                    if(res){
                        $window.sessionStorage.setItem("token",res.data.token);
                        $window.sessionStorage.setItem("username",res.data.userdata.username);
                        $cookies.put("token",$window.sessionStorage.getItem("token"),{path:'/'});
                        if(res.data.userdata.admin){
                            var admin="admin";
                        }else{
                            var admin="user";
                        }
                        $window.sessionStorage.setItem("role",admin);
                        authService.isAuthorized(res.data.userdata.username);
                        return res.data;
                    }
                },function(res){
                    return res.data;
                });
        };

        authService.isAdmin= function () {
            var role=$window.sessionStorage.getItem("role");
            if(role=="admin"){
                return true;
            }else{
                return false;
            }
        };
        
        authService.isAuthenticated = function () {
            var token=$cookies.get("token");
            var ssesTk=$window.sessionStorage.getItem("token");
            if(token&&ssesTk){
                return true;
            }
            return false;
        };
        authService.destoy=function(){
            $cookies.remove("token",{path:"/"});
            $cookies.remove("username",{path:"/"});
            $window.sessionStorage.setItem("role",'');
            $window.sessionStorage.setItem("token",'');
            $window.sessionStorage.setItem("username",'');
        };

        authService.isAuthorized = function (authorizedRoles) {
            return authorizedRoles;
        };

        authService.ckConnection=function(){
            $rootScope.$watch("online",function(newVal,oldVal){
                if(!newVal){
                    Dialog.showAlert("Connection Error!","Error! Please connect to Internet!");
                }
                if(!oldVal&&newVal){
                    Toast.showSimple("Network Connected");
                }
            });
        }

        return authService;
    });


    app.config(function($mdThemingProvider) {
        // Configure a dark theme with primary foreground yellow
        $mdThemingProvider.theme('docs-dark', 'default')
            .primaryPalette('yellow')
            .dark();
    });