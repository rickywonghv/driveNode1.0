/**
 * Created by damon on 6/25/16.
 */
var express = require('express');
var app = express();
var encryptor = require('file-encryptor');
var fs=require("fs");

var inputDir="./upload/";
var outputDir="./files/encrypt/";
var decryptDir="./files/decrypt/";
var dlDir="./files/downloads/";

var decryptZip="./files/zip/decrypt/";

var fileEn=function(filename,key,next){
    encryptor.encryptFile(inputDir+filename, outputDir+filename, key, function(err) {
        if(err){
            return next({success:false,error:err});
        }
        fs.unlinkSync(inputDir+filename);
        return next({success:true,data:{key:key}});
    });
};

var encryptDl=function(filename,orgName,key,next){
    encryptor.encryptFile(dlDir+orgName, outputDir+filename, key, function(err) {
        if(err){
            return next({success:false,error:err});
        }
        if(fs.existsSync(dlDir+orgName)){
            fs.unlinkSync(dlDir+orgName);
        }
        return next({success:true,data:{key:key}});
    });
};

var fileDe=function(filename,key,next){
    encryptor.decryptFile(outputDir+filename, decryptDir+filename, key, function(err) {
        if(err){
            return next({success:false,error:err});
        }
        return next({success:true,data:{key:key}});
    });
};

var fileDeZip=function(saveName,fileName,key,next){
    encryptor.decryptFile(outputDir+saveName, decryptZip+fileName, key, function(err) {
        if(err){
            return next({success:false,error:err});
        }
        return next({success:true,data:{key:key}});
    });
};

var fileEnZip=function(zipPath,desName,key,next){ //zipPath with zip filename
    encryptor.encryptFile(zipPath, outputDir+desName, key, function(err) {
        if(err){
            return next({success:false,error:err});
        }
        //fs.unlinkSync(zipPath);
        return next({success:true,data:{key:key}});
    });
};

module.exports.en=fileEn;
module.exports.de=fileDe;
module.exports.deZip=fileDeZip;
module.exports.enZip=fileEnZip;
module.exports.EnDl=encryptDl;