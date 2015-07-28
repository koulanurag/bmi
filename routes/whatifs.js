var express    = require("express");
var router = express.Router();
var mysql      = require('mysql');
var mongoose = require('mongoose');
var Scenario = mongoose.model('Scenario');
var Parameter = mongoose.model('Parameter');
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
    console.log('Config variables: mysql host: '+ config.mysql.host);
    console.log("Database is connected ... \n\n");  
} else {
    console.log("Error connecting database ... \n\n");  
}
});

router.get("/",function(req,res){
connection.query('SELECT * from rtbcostpoolsprediction LIMIT 10', function(err, rows, fields) {
  //connection.end();
  if (!err) {
    console.log('The solution is: ', rows[0]['Quarter']);
    res.json(rows);
  }
  else
    console.log('Error while performing Query.');
  });
});

function getParameterCostPoolsMapping(callback) {
  Parameter.find().exec(function(err, parameters) {
    if(err) { callback(null); }
    callback(parameters);
    });
}

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

function predict(records, request, mapping) {
  var parameters = request.parameters;
  parameters.forEach(function (param, index, parameters) {
    //console.log("Param Name: " + param.name);
    //requestid = getTimeStamp()+ "-"+ request.user;
    
    var affectingcostpools = [];
    for(i=0; i < mapping.length; i++) {
      if (mapping[i].name == param.name) {
        affectingcostpools = mapping[i].costpools.split(/[\s,]+/);
        //console.log("Affecting costpools for " + param.name + " are " + affectingcostpools[0]);
        break;
      }
    }
    var affectingquarters = [];
    affectingquarters = param.applytoquarters.split(/[\s,]+/);

    for (i=0; i< records.length; i++) {
      var record = records[i];
      record.scenarioid = request._id;
      record.user = request.user;
      delete record.Auto_Regressive;
      delete record.Order_Difference;
      delete record.Moving_Average;
      record.Forecast = "N";

      if (affectingcostpools.indexOf(record.costpool) != -1) {
        // Check whether Parameter to apply to this Quarter or Not.
        var apply = false;
        for (j=0; j<affectingquarters.length; j++) {
          if (record.Quarter.indexOf(affectingquarters[j]) != -1) {
            apply = true;
            break;
          }
        }
        if (apply == false)
          continue;

        var value = param.value;
        if (value.indexOf("%") != -1) {   // Its percentage value handle it accordingly.
          value = value.substring(0, value.length - 1);
          value = parseFloat(value);
          //console.log("Apply % " + value + " % to costpool " + record.costpool + " for Quarters : " + param.applytoquarters);
          record.Prediction = record.Prediction + ((record.Prediction*value)/100);
        } else { // Its absolute value handle it accrodingly.
          value = parseFloat(value);
          //console.log("Apply absolute" + value + " to costpool for Quarters : " + param.applytoquarters);
          record.Prediction += value;
        }
      }
      records[i] = record;
    }
  });
  return records; 
}

function getTimeStamp() {
  var d = new Date();
  var text = d.toISOString().replace(/-/g,"").replace(/:/g,"").replace(/\./g,"").replace(/T/g,"").replace(/Z/g,"");
  return text;
}

function removeDataforScenario(scenario, callback) {
  connection.query("DELETE from rtbcostpoolsprediction WHERE scenarioid = '"+scenario._id+"'",
      function(err, result) {
        if (err) {
          console.log("Error while delete prediction data for scenario"); 
          callback(false);
        } else {
          callback(true);  
        }
      });
}

function storeData(scenario, records, callback) {
  // First delete the data for scenario.
  removeDataforScenario(scenario, function(result){
    if (result == false) {
      callback(null);
    } else {
      var data = [records.length];
      for(i=0; i<records.length; i++) {
        var r = records[i];
        data[i] = [ r.serviceid, r.costpool, r.Quarter, r.Prediction, r.Forecast, r.user, r.scenarioid];
      }
      
      connection.query( "INSERT INTO rtbcostpoolsprediction (serviceid, costpool, Quarter, Prediction, Forecast, user, scenarioid) VALUES ? ", [data], function(err, result) {
        if (!err) {
          console.log("Data insert succeed. %j records inserted.", result.affectedRows );
          callback(records);
        } else {
          console.log("Data insertion failed!!! Error: " + err);
          callback(null);
        }
      });
    }
  });
  
}

function saveScenario(request, callback) {
  var scenario = new Scenario(request);
  scenario.save(function(err, scenario){
    if(err){ console.log("Error while storing Scenario!!!: Error: " + err); return callback(null); }
    return callback(scenario);
  });
 
}

function runScenario(scenario, callback) {
  getRTBDataForServices(scenario.services, function(records) { 
    //console.log("In getData callback");
    if (records != null) {
      getParameterCostPoolsMapping(function (mapping) {
      //console.log(records);
        if (mapping != null) {
          records = predict(records, scenario, mapping);
          storeData(scenario, records, function(records){
            if(records == null) {
              var response = new Array();
              response['message'] = "Error while storing prediction data.";
              callback(response);
            } else {
              var response = new Array();
              scenarioid = scenario._id;
              response['message'] = "Prediction Adjustment request completed. Adjsted data stored in DB for scenarioid = "+ scenarioid;
              response['query'] = "SELECT * from rtbcostpoolsprediction where scenarioid = '" + scenarioid +"'";
              response['result'] = records.length + " records stored in DB.";
              response['scenario'] = scenario;
              callback(response);
            }
            });
        }
      });
    } else {
      var response = new Array();
      response['message'] = "Error while running prediction!!!";
      callback(response);
    }
    
  });

}

router.post('/', function(req, res, next) {
  var request = req.body;
  console.log("Storing Scenario:" + request.name);
  //req.body.requestid = getTimeStamp()+ "-"+ request.user;
  saveScenario(request, function(scenario){
  // Scenario is saved, now do prediction
    runScenario(scenario, function(response) {
      res.json({message: response['message'], 
                query: response['query'], 
                result: response['result'], 
                scenario: scenario});
              });
  });
});

router.put('/:scenario_id', function(req, res, next) {
  console.log("Running PUT: scenario_id = "+ req.params.scenario_id);
  Scenario.findById(req.params.scenario_id, function(err, scenario) {
    if (err || scenario == null) { 
      res.send("Scenario with id : " + req.params.scenario_id + " Not found: Error: " + err);
    } else {
    //console.log(" Scenario found from DB: " + scenario);
    var update = new Scenario(req.body);
      scenario.update(update, function(err, scenario) { 
      //console.log("Scenario from request body: " + update);
      if (err) {
        console.log("Error while updating scenario. Error: " + err);
        res.json({message: "Error while updating scenario.", error: err});
      }
      // Scenario is saved, now do prediction
      
      runScenario(scenario, function(response) {
      res.json({message: response['message'], 
                query: response['query'], 
                result: response['result'], 
                scenario: scenario});
              });
      });
     }  
    });
}); 

router.delete('/:scenario_id', function(req, res, next) {
  console.log("Running DELETE: scenario_id = "+ req.params.scenario_id);

  Scenario.findById(req.params.scenario_id, function(err, scenario) {
    if (!err && scenario != null) {
      removeDataforScenario(scenario, function(result) {
        if (result == true) {
          Scenario.remove({_id: req.params.scenario_id}, 
                          function(err, scenario){
                            if (err) 
                              res.json({status: 'failed', message: 'Error deleting scenario!!!', error: err});
                            res.json({status: 'success', message: 'Succefully deleted scenario!!!'});
                          });
        } else {
          res.json({status: 'failed', message: 'Error deleting scenario prediction data!!!'});
        }
      });
    } else {
      res.json({status: 'failed', message: 'Error deleting scenario!!!', error: err});
    }
  });
});

router.get('/:user', function(req, res, next) {
  var username =  req.params.user ;
  console.log("Get scenarios for user: " + username);
  Scenario.find().where({user: {$eq: username} }).exec(function(err, scenarios) {
    if(err) { return next(err); }
    res.json(scenarios);
    });
 
});

router.get('/get/:id', function(req, res, next) {
  var id =  req.params.id ;
  console.log("Get scenario for id: " + id);
  Scenario.findById(id).exec(function(err, scenario) {
    if(err) { return next(err); }
    res.json(scenario);
    });
 
});

router.get('/parameters/list', function(req, res, next) {
  
  getParameterCostPoolsMapping( function (mapping) {
    if (mapping != null){
      //console.log("Mapping data: " +  mapping);
      res.json(mapping);
    } else {
      res.json("Error getting parameters list.");
    }
  });  
});

module.exports = router;
