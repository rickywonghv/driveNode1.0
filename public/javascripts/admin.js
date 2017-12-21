/**
 * Created by damon on 6/25/16.
 */
var app=angular.module('adminApp', ['ngMaterial','ngCookies','authApp','fileApp','angular-loading-bar','ngAnimate']);
app.controller('adminCtrl',function($scope,$window,AdminManage,Dialog,$interval,cfpLoadingBar){
    $scope.usersList=function(){
        AdminManage.listUsers(function(data){
            $scope.admins=data.data;
        });
    };

    $scope.userMore=function(userId){
        
    };

    $scope.newUserDia=function(){
        Dialog.showPrerenderedDialog("#newUser");
    };
    
    $scope.createUser=function(){
        cfpLoadingBar.start();
        if($scope.user.username&&$scope.user.password&&$scope.user.conpassword&&$scope.user.email&&$scope.user.name&&$scope.user.space&&$scope.user.admin){
            var token=$window.sessionStorage.getItem("token");
            var query={username:$scope.user.username,password:$scope.user.password,conpassword:$scope.user.conpassword,email:$scope.user.email,name:$scope.user.name,space:$scope.user.space,admin:$scope.user.admin,token:token};
            AdminManage.createUser(query,function(data){
                if(data.data.success){
                    $scope.result="User Added";
                    cfpLoadingBar.complete();
                    $interval(function(){$scope.usersList()},36,1);
                    $scope.success=data.data.data;
                }else{
                    $scope.errors=data.data.error;
                }
            })
        }
    };

    $scope.userData=function(userId){
        cfpLoadingBar.start();
        Dialog.showPrerenderedDialog("#userData");
        AdminManage.userData(userId,function(data){
            $scope.userData.username=data.data[0].username;
            $scope.userData.id=data.data[0]._id;
            $scope.userData.email=data.data[0].email;
            $scope.userData.admin=data.data[0].admin;
            $scope.userData.createDT=data.data[0].createDT;
            $scope.userData.updateDT=data.data[0].updateDT;
            cfpLoadingBar.complete();
        });
    };

    $scope.spaces = ('Unlimit 100gb 50gb 30gb 10gb 5gb 2gb 1gb 500MB')
        .split(' ').map(function(space) {
        return {abbrev: space};
    });

});
app.factory('AdminManage',function($http,$window,$httpParamSerializer){
    var admin={};
    var token=$window.sessionStorage.getItem("token");
    admin.listUsers=function(next){
        $http.get("/admin/api/admin?token="+token).then(function(data){
            next(data.data.data);
        },function(err){
            next(err.data);
        })
    };
    
    admin.userData=function(userId,next){
        $http.get("/admin/api/admin/"+userId+"?token="+token).then(function(data){
            next(data.data.data);
        },function(err){
            next(err.data);
        })
    };
    
    admin.createUser=function(query,next){
        var data=$httpParamSerializer(query);
        $http.post("/api/user",data,{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(data){
            next(data);
        },function(err){
            next(err);
        });
    };
    
    return admin; 
});