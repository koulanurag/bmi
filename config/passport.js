var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var LdapStrategy = require('passport-ldapauth');

var OPTS = {
  server: {
        url: "ldap://ds.cisco.com:389",
                //adminDn: "innovus.gen@cisco.com",
                //adminPassword: "innovus123",
                adminDn: "bmi.gen@cisco.com",
                adminPassword: "Cisco123",
                searchBase: "OU=Cisco Users,DC=cisco,DC=com",
                searchFilter: "(sAMAccountName={{username}})",
                searchAttributes: ["cn", "givenName", "sn", "mail", "title", "employeeType"],
                verbose: false,
                cache: false,
    connectTimeout: 2000
    //url: 'ldap://ldap.forumsys.com:389',
    //bindDn: 'cn=read-only-admin,dc=example,dc=com',
    //bindCredentials: 'password',
    //searchBase: 'dc=example,dc=com',
    //searchFilter: '(uid={{username}})'
  }
};
passport.use(new LdapStrategy(OPTS));

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
