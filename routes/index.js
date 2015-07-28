var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var LdapAuth = require('ldapauth-fork');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
var config = require('../config/config');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/posts', function(req, res, next) {
  Post.find( function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

router.get('/posts/user/:user', function(req, res, next) {
//router.get('/posts/user/', function(req, res, next) {
  var username =  req.params.user ;
  Post.find({'author': username }, function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});


router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;
  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

//router.param('user', function(req, res, next, id) {
  //print("User param " + id );
  //return '\'' + id + '\'';
//});


/*router.get('/posts/:post', function(req, res) {
  res.json(req.post);
});*/

router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.put('/posts/:post/downvote', auth, function(req, res, next) {
  req.post.downvote(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});

router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;
  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});


router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
  /*if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

 passport.authenticate('ldapauth', {session: false}, function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }*/
    console.log("In All :: header: " + JSON.stringify(req.headers['auth_user']));
    var username = "";
    if (config.dummyuser) 
      username = config.dummyuser;
    else
      username = req.headers['auth_user'];

    console.log("In login :: username: " + username);
    var ldap = new LdapAuth(
    {
      "url": "ldap://ds.cisco.com:389",
      "adminDn": "bmi.gen@cisco.com",
      "adminPassword": "Cisco123",
      "searchBase": "OU=Cisco Users,DC=cisco,DC=com",
      "searchFilter": "(sAMAccountName={{username}})",
      "searchAttributes": ["cn", "givenName", "sn", "mail", "title", "employeeType"],
      "verbose": false,
      "cache": false,
      "connectTimeout": 2000
    });
    ldap._findUser(username, function(err, ldapData){
    if (err) console.log("Errer fetching data from LDAP:" + err);
    console.log("LDAP Data:"+  JSON.stringify(ldapData));
    var user = ldapData;

    // Generate a JSON response reflecting authentication status
    if (! user) {
    console.log("/login: falied " );
      //return res.send({ success : false, message : 'authentication failed', info: info });
      return res.status(401).json(info);
    } else {
    var currentUser = new User();
    currentUser.username = user.cn;
    currentUser.firstname = user.givenName;
    currentUser.lastname = user.sn;
    //currentUser.password = user.password;    
    console.log("/login: username:" + JSON.stringify(user));
    //return res.send({ success : true, message : 'authentication succeeded' , info: info});
      return res.json({token: currentUser.generateJWT()});
    }
  });//(req, res, next);
  /*passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
  */
});
module.exports = router;
