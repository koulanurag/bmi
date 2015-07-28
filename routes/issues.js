var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var User = mongoose.model('User');
var Issue = mongoose.model('Issue');
var jwt = require('express-jwt');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/issues', function(req, res, next) {
	Issue.find( function(err, issues) {
		if(err) { return next(err); }
		res.json(issues);
		});
});

router.get('/issues/foruser/:user', function(req, res, next) {
  var username =  req.params.user ;
	Issue.find().where({tousers: {$elemMatch: {$eq: username} } }).exec(function(err, issues) {
		if(err) { return next(err); }
		res.json(issues);
		});
});

router.get('/issues/byuser/:user', function(req, res, next) {
  var username =  req.params.user ;
	Issue.find().where({creator: {$eq: username} }).exec(function(err, issues) {
		if(err) { return next(err); }
		res.json(issues);
		});
});



router.post('/issues', auth, function(req, res, next) {
  var issue = new Issue(req.body);
  issue.creator = req.payload.username;
  issue.save(function(err, issue){
    if(err){ return next(err); }
    res.json(issue);
  });
});
module.exports = router;
