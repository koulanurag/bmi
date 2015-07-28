//var app = angular.module('BMIWebApplication', ['ui.router']);

app.factory('issues', ['$http', 'auth', function($http, auth){
  
	var o = {
		issuesforme: [],
		issuesbyme: []
	};

  o.create = function(issue) {
		return $http.post('/issues/issues', issue, {
    	  headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
  	    o.issuesbyme.push(data);
	  });
 	};

	/*o.getAll = function() {
		return $http.get('/issues/issues/').success(function(data) {
			angular.copy(data, o.issues);
    });
  };*/

  o.getIssuesForMe = function() {
    console.log("o.getIssuesForMe: user: " + auth.currentUser());
    return $http.get('/issues/issues/foruser/' + auth.currentUser()).success(function(data) {
      angular.copy(data, o.issuesforme);
    });
  };
  o.getIssuesForUser = function(user) {
    return $http.get('/issues/issues/foruser/' + user).success(function(data) {
      $http.get('/issues/issues/byuser/' + user).success(function(data) {
        angular.copy(data, o.issuesbyme);
      })
      angular.copy(data, o.issuesforme);
    });
  };
  
  o.getIssuesCreatedByUser = function(user) {
    return $http.get('/issues/issues/byuser/' + user).success(function(data) {
      angular.copy(data, o.issuesbyme);
    });
  };
 return o;
}]);


app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
   .state('askquestion', {
      url: '/home/ask/{user}',
      templateUrl: '/issue.html',
      controller: 'IssueCtrl',
      resolve: {
  	    postPromise: ['$stateParams', 'issues', function($stateParams, issues){
          console.log("In askquestion state: User: "+ $stateParams.user);
      	  return issues.getIssuesForUser($stateParams.user);
    	  }]
   	  }
    })
   .state('issuesforuser', {
      url: '/home/ask/{user}',
      templateUrl: '/issue.html',
      controller: 'IssueCtrl',
      resolve: {
  	    postPromise: ['$stateParams', 'issues', function($stateParams, issues){
          console.log("In askquestion state: User: "+ $stateParams.user);
      	  return issues.getIssuesForUser($stateParams.user);
    	  }]
   	  }
    })
    .state('issuesforme', {
      url: '/home/ask/',
      templateUrl: '/issue.html',
      controller: 'IssueCtrl',
      resolve: {
  	    postPromise: ['$stateParams', 'issues', function($stateParams, issues){
          console.log("In askquestion state: User: "+ $stateParams.user);
      	  return issues.getIssuesForMe();
    	  }]
   	  }
    });

  $urlRouterProvider.otherwise('/login');
}]);


app.controller('IssueCtrl', [
'$scope',
'$stateParams',
'issues',
'auth',
function($scope, $stateParams, issues, auth){
  $scope.test = 'Hello world!';
  $scope.issuesforme = issues.issuesforme;
  $scope.issuesbyme = issues.issuesbyme;
  $scope.isLoggedIn = auth.isLoggedIn;
  console.log("IssueCtrl invoked.  Test: ", $scope.test);
  $scope.addQuestion = function() {
		//var toUserStr = $scope.toUsers;
		console.log("MainCtrl:: addQuestion: " + $scope.to +"  Question:" + $scope.question);
    var toUsers = $scope.to.match( /(?=\S)[^,]+?(?=\s*(,|$))/g )
    toUsers = toUsers.map(function(x){return x.replace(/@/g, '');});
		console.log("MainCtrl:: addQuestion: Users are: "+ toUsers);
		issues.create({
			question: $scope.question,
			tousers: toUsers,
		});
				
  };
}]);

