//var app = angular.module('BMIWebApplication', ['ui.router']);

app.factory('scenarios', ['$http', 'auth', function($http, auth){
  
	var o = {
		scenarios: [],
		services: [],
    parameters: [],
    scenario: {}
	};

  o.create = function(scenario) {
		return $http.post('/scenario', scenario, {
    	  headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
  	    o.scenarios.push(data);
	  });
 	};

  o.update = function() {
		return $http.put('/scenario/'+scenario._id, scenario, {
    	  headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
  	    scenario = data;
	  });
  };
	/*o.getAll = function() {
		return $http.get('/scenarios/scenarios/').success(function(data) {
			angular.copy(data, o.scenarios);
    });
  };*/

  o.getScenarios = function() {
    console.log("o.getScenarios: user: " + auth.currentUser());
    return $http.get('/scenario/' + auth.currentUser()).success(function(data) {
    //return $http.get('/scenario/jsarin').success(function(data) {
      angular.copy(data, o.scenarios);
    });
  };
  
 o.setScenario = function(id) {
    console.log("o.setScenario: id : " + id);
    return $http.get('/scenario/get/' + id).success(function(data) {
      angular.copy(data, o.scenario);
    });
  };
 o.getServices = function() {
    //return $http.get('/service/owner/'  + auth.currentUser()).success(function(data) {
    return $http.get('/service/owner/jsarin' ).success(function(data) {
      angular.copy(data, o.services);
    });
  };

  o.getParameters = function() {
    //return $http.get('/service/owner/'  + auth.currentUser()).success(function(data) {
    return $http.get('/scenario/parameters/list' ).success(function(data) {
      console.log("GetParameters: "+ data);
      //return data;
      angular.copy(data, o.parameters);
    });
  };

 return o;
}]);


app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
   .state('scenario', {
      url: '/scenario',
      templateUrl: '/scenario.html',
      controller: 'ScenarioCtrl',
      resolve: {
  	    postPromise: ['$stateParams', 'scenarios', function($stateParams, scenarios){
          console.log("In Scenario List state: User: "+ $stateParams.user);
          scenarios.getServices();
          scenarios.getParameters();
      	  return scenarios.getScenarios();
    	  }]
   	  }
    }).state('getscenario', {
      url: '/scenario/:scenario_id',
      templateUrl: '/scenario.html',
      controller: 'ScenarioCtrl',
      resolve: {
  	    postPromise: ['$stateParams', 'scenarios', function($stateParams, scenarios){
          console.log("In Get Scenario state: scenario_id: "+ $stateParams.scenario_id);
          scenarios.getServices();
          scenarios.getParameters();
          return scenarios.setScenario($stateParams.scenario_id);
      	  //return scenarios.getScenarios();
    	  }]
   	  }
    });;
  $urlRouterProvider.otherwise('/login');
}]);


app.controller('ScenarioCtrl', [
'$scope',
'$stateParams',
'scenarios',
'auth',
'$timeout',
function($scope, $stateParams, scenarios, auth,$timeout){
  $scope.test = 'Hello world!';
  $scope.scenarios = scenarios.scenarios;
  $scope.services = scenarios.services;
  $scope.scenario = scenarios.scenario;
  $scope.parameters = scenarios.parameters;
  $scope.quarters = ["Q1","Q2","Q3","Q4"];
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.selectedservices = {};
  $scope.selectedquarters = {};
  console.log("ScenarioCtrl invoked.  Test: ", $scope.test);
  if (angular.isDefined(scenarios.scenario.name) ) {
    $scope.showme = true;
    console.log("Selected services: "+$scope.scenario.services);
    services =  $scope.scenario.services.split(',');
    for (i=0; i< services.length; i++) {
      service = services[i];
      $scope.selectedservices[service] = true;
    }  
   // $scope.selectedservices = $scope.scenario.services;
  }
  $scope.setScenario = function(id) {
    console.log("SetScenario :: id: "+ id);
  }
  $scope.createNewScenario = function() {
    $scope.scenario = {};
    $scope.selectedservices = {};
    $scope.showme = true;
  }
  $scope.addParameter = function() {
    var param = $scope.Parameter;
    //console.log("scope.addParmeter(): Parameter: " + param);
    $scope.Parameter = "";
    var value = $scope.pvalue;
    //console.log("scope.addParmeter(): value: " + value);
    $scope.pvalue = "";
    var comment = $scope.pcomment;
    //console.log("scope.addParmeter(): value: " + value);
    $scope.pcomment = "";

    var quarters = [];
    //console.log("scope.addParmeter(): quarters: Q1: " + $scope.selectedquarters["Q1"]);
    for(var i=0; i<4; i++) {
      console.log("quarters: "+i+" : "+$scope.selectedquarters["Q"+(i+1)]);
      if ($scope.selectedquarters["Q"+(i+1)] == true)
        quarters.push("Q"+(i+1)); 
    }
    //console.log("Selected quarters = " + quarters);
    $scope.selectedquarters = {};
    if (angular.isUndefined($scope.scenario.parameters))
      $scope.scenario.parameters = [];
    $scope.scenario.parameters.push({'name': param, 'value': value, 'applytoquarters': quarters.join(","),
                                      'comment': comment});
  };
  $scope.addScenario = function() {
		//var toUserStr = $scope.toUsers;
		console.log("ScenarioCtrl:: addScenario: Scenario Name: " + $scope.scenario.name);
    console.log("ScenarioCtrl:: addScenario: services : " + $scope.getSelectedServices());
    $scope.scenario.services =  $scope.getSelectedServices();
    console.log("ScenarioCtrl:: addScenario: parameters: " + $scope.scenario.parameters);
    console.log("ScenarioCtrl:: addScenario: user: " + auth.currentUser());
    $scope.scenario.user = auth.currentUser();
    scenarios.create($scope.scenario); 
    alert('Scenario ' + $scope.scenario.name + ' saved suffully and prediction data is stored in db.');
   	};			
  $scope.getSelectedServices = function() {
   serviceids = Object.keys($scope.selectedservices);
   console.log("Services: "+ serviceids);
   services = [];
   for(var i=0;i<serviceids.length;i++) {
     service = serviceids[i];
     if ($scope.selectedservices[service])      {
       console.log("Service id: " +service);
       services.push(service);
     }
   }
   return services;
  };
  
  $timeout(function(){
      google.setOnLoadCallback(drawVisualization);
  })
}]);

