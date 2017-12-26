var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs=require("fs");
var mongoose=require("mongoose");
var pdf = require('express-pdf');


var child_process=require("child_process");

var routes = require('./routes/index');
var api=require('./routes/api');
var admin=require('./routes/admin');
var adminapi=require('./routes/adminapi');
var installation=require('./routes/installation');

var dirck=function(path,dirname){
    if(!fs.existsSync(path+dirname)){
      fs.mkdirSync(path+dirname);
    }
};
require("./db");

dirck("./","files");
dirck("./files/","encrypt");
dirck("./files/","decrypt");
dirck("./files/","downloads");
dirck("./files/","qr");
dirck("./files/","zip");
dirck("./files/zip/","decrypt");
dirck("./files/zip/","encrypt");

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(pdf);
app.use('/jquery',express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/angular',express.static(path.join(__dirname, '/node_modules/angular')));
app.use('/angular-animate',express.static(path.join(__dirname, '/node_modules/angular-animate')));
app.use('/angular-aria',express.static(path.join(__dirname, '/node_modules/angular-aria')));
app.use('/angular-material',express.static(path.join(__dirname, '/node_modules/angular-material')));
app.use('/angular-loading-bar',express.static(path.join(__dirname, '/node_modules/angular-loading-bar')));
app.use('/jq',express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/bs',express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use('/cookie',express.static(path.join(__dirname, '/node_modules/angular-cookies')));
app.use('/upload',express.static(path.join(__dirname, '/node_modules/angular-file-upload/dist')));
app.use('/context-menu',express.static(path.join(__dirname, '/node_modules/angular-bootstrap-contextmenu')));
app.use('/angular-audio',express.static(path.join(__dirname, '/node_modules/angular-audio/app')));



app.use('/', routes);
app.use('/api', api);
app.use('/admin',admin);
app.use('/admin/api',adminapi);
app.use('/installation',installation);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
