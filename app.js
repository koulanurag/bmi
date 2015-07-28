var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var mysql      = require('mysql');
var config = require('./config/config');
require('./models/Posts');
require('./models/Comments');
require('./models/Users');
require('./models/Issues');
require('./models/Scenario');
require('./models/Parameters');
require('./config/passport');
require('./config/config');

mongoose.connect('mongodb://sj-il-bmi-mongo/news');
var routes = require('./routes/index');
var issues = require('./routes/issues');
var users = require('./routes/users');
var whatifs = require('./routes/whatifs');
var service = require('./routes/service');
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
app.use(passport.initialize());
app.use('/', routes);
app.use('/issues', issues);
app.use('/users', users);
app.use('/scenario', whatifs);
app.use('/service', service);

console.log("Testing config :: " + config.mysql.host);
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
