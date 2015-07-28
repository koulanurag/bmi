var express    = require("express");
var router = express.Router();
var mysql      = require('mysql');
var config = require('../config/config');

var connection = mysql.createConnection({
  host     : config.mysql.host,
  port     : config.mysql.port,
  user     : config.mysql.user,
  password : config.mysql.password,
  database : config.mysql.db
});

connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... \n\n");  
} else {
    console.log("Error connecting database ... \n\n");  
}
});
  var basequery = "select serviceid, dimservice.name servicename, servicecategory, servicedomain, serviceexecutive, serviceowner, description," 
+" architectname, servicearchitect, archgrouping, " 
+" dimservicecategory.name category,"
+" dimservicedomain.name domain,"
+" dimworker_owner.name ownername, dimworker_owner.cec ownercec,"
+" dimworker_exec.name executivename, dimworker_exec.cec executivecec"
+" from dimservice, dimservicecategory, dimservicedomain, dimworker dimworker_owner, dimworker dimworker_exec"
+" where dimservice.servicecategory = dimservicecategory.categoryid "
+" AND dimservice.servicedomain = dimservicedomain.domainid"
+" AND dimservice.serviceowner = dimworker_owner.workerid"
+" AND dimservice.serviceexecutive = dimworker_exec.workerid";


router.get("/",function(req,res){
  connection.query(basequery, function(err, rows, fields) {
  //connection.end();
  if (!err) {
    console.log('The List of services is ', rows);
    res.json(rows);
  }
  else
    console.log('Error while performing Query. Error: ' + err);
  }); 
});

router.get("/owner/:user",function(req,res){
  var owner = req.params.user; 
  var query = basequery + " AND dimworker_owner.cec = '" + owner +"'";
  connection.query(query, function(err, rows, fields) {
  //connection.end();
  if (!err) {
    //console.log('The List of services for owner: ' + owner + ' : ', rows);
    res.json(rows);
  }
  else
    console.log('Error while performing Query. Error: ' + err);
  }); 
});

function getRTBDataForServices(services, callback) {
  var querystr = "";
  if (services == "*") {
    querystr = "SELECT * from rtbcostpoolsprediction WHERE user = 'system'";
  } else {
    querystr = "SELECT * FROM rtbcostpoolsprediction WHERE user = 'system' AND serviceid IN (" +services +")";
  }
  console.log("Query to get Service Data: " + querystr);
  var records;
  connection.query(querystr, function(err, rows, fields) {
    //connection.end();
    if(!err) {
      console.log('Number of rows fetched: ', rows.length);
      callback(rows);
      return rows;
    } else {
      console.log('Error while performing Query to get Service data. Error:' + err);
      callback(null);
    }
  });
}

module.exports = router;
