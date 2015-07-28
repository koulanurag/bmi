var app = angular.module('BMIWebApplication', ['ui.router']);

app.factory('posts', ['$http', 'auth', function($http, auth){
  var o = {
    posts: [],
  services: []
  };
o.getAll = function() {
    return $http.get('/posts').success(function(data){
    //return $http.get('/posts/user/'+user).success(function(data){
      angular.copy(data, o.posts);
    });
  };
  o.getAllServices = function(user) {
	   // return $http.get('/posts/user').success(function(data){
	    //return $http.get('/posts/user/'+user).success(function(data){
	      //angular.copy(data, o.services);
	  
	   // });
	  o.services = [{name: 'Service 1' }, {name: 'Service 2'}];
	  console.log("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb: ");
	  };
o.getMyPosts = function(user) {
    return $http.get('/posts/user/' + user, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
 	}).success(function(data){
      angular.copy(data, o.posts);
    });
  };

o.create = function(post) {
  return $http.post('/posts', post , {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
 	}).success(function(data){
	    o.posts.push(data);
	});
};
o.upvote = function(post) {
  return $http.put('/posts/' + post._id + '/upvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
    post.upvotes += 1;
  });
};
o.downvote = function(post) {
  return $http.put('/posts/' + post._id + '/downvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
    post.downvotes += 1;
  });
};

o.get = function(id) {
  return $http.get('/posts/' + id).then(function(res){
    return res.data;
  });
};
o.addComment = function(id, comment) {
  return $http.post('/posts/' + id + '/comments', comment, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  });
};

o.upvoteComment = function(post, comment) {
  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
    comment.upvotes += 1;
  });
};
  return o;
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      //templateUrl: '/home.html',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
	/*post: ['$stateParams', 'posts', function($stateParams, posts) {
		console.log("State: userhome: user: " + JSON.parse(JSON.stringify($stateParams)));
      	    return posts.get($stateParams.id);
    	    }]*/
  	postPromise: ['posts', function(posts){
      	  return posts.getAll();
    	  }]
   	}
    })
    .state('dashboard', {
      url: '/dashboard',
      params :{
            state: 'dashboard'  
        },
      //templateUrl: '/home.html',
      templateUrl: '/dashboard.html',
      controller: 'dashboardCtrl'
     // resolve: {
	/*post: ['$stateParams', 'posts', function($stateParams, posts) {
		console.log("State: userhome: user: " + JSON.parse(JSON.stringify($stateParams)));
      	    return posts.get($stateParams.id);
    	    }]*/
    	 
  	/*postPromise: ['$stateParams', 'posts', function($stateParams, posts){
  		console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: ");
      	  return posts.getAllServices($stateParams.user);
    	  }]*/
   	//}
    })
    .state('reports', {
      url: '/reports',
      params :{
            state: 'reports'  
        },
      templateUrl: '/report.html',
    })
    .state('userhome', {
      url: '/home/user/{user}',
      templateUrl: '/home.html',
      //templateUrl: '/../../views/home.html',
      controller: 'MainCtrl',
      resolve: {
  	postPromise: ['$stateParams', 'posts', function($stateParams, posts){
	  console.log("state: userhome: " + $stateParams.user);
      	  return posts.getMyPosts($stateParams.user);
      	  //return posts.getAll();//MyPosts($stateParams.user);
    	  }]
   	}
    })
    .state('posts', {
  	url: '/posts/{id}',
	templateUrl: '/posts.html',	
  	controller: 'PostsCtrl',
	resolve: {
	    post: ['$stateParams', 'posts', function($stateParams, posts) {
		console.log("State: posts: user: " + JSON.parse(JSON.stringify($stateParams.id)));
      	    return posts.get($stateParams.id);
    	    }]
  	}
     })
     .state('login', {
  	url: '/login',
	  templateUrl: '/dashboard.html',
  	controller: 'AuthCtrl',
  	onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})
      .state('register', {
	  url: '/register',
	  templateUrl: '/register.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	}]
      });

  $urlRouterProvider.otherwise('/login');
}]);


app.controller('MainCtrl', [
'$scope',
'$stateParams',
'posts',
'auth',
function($scope, $stateParams, posts, auth){
  $scope.test = 'Hello world!';
  $scope.posts = posts.posts;
  console.log("Inside mainnnnnnnnnnnnnnnnnnnnnnnnn: ");
  //$scope.services = posts.services;
  $scope.services = [{name: 'Service1'},{name: 'Service2'}];
  //$scope.services = [];
  $scope.isLoggedIn = auth.isLoggedIn;
  console.log("Controller invoked.  Test: ", $scope.test);
  $scope.addPost = function(){
	console.log('MainCtrl:: adPost: $scope.title:');
	if(!$scope.title || $scope.title === '') { return; }
	posts.create({
    		title: $scope.title,
	    	link: $scope.link,
		});
	/*	$scope.posts.push({
	    title: $scope.title,
	    link: $scope.link,
	    upvotes: 0,
	    comments: [
	    	{author: 'Joe', body: 'Cool post!', upvotes: 0},
	    	{author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
	    ]
  });*/
  	$scope.title = '';
	$scope.link = '';
  };


 $scope.incrementUpvotes = function(post) {
	posts.upvote(post);
 };
 $scope.incrementDownvotes = function(post) {
	posts.downvote(post);
 };

}]);

app.controller('PostsCtrl', [
'$scope',
'$stateParams',
'posts',
'post',
'auth',
function($scope, $stateParams, posts, post, auth){
//	$scope.post = posts.posts[$stateParams.id];
	$scope.post = post;
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.addComment = function(){
  	    if($scope.body === '') { return; }
	    posts.addComment(post._id, {
	      body: $scope.body,
	      author: 'user',
	    }).success(function(comment) {
	      $scope.post.comments.push(comment);
	  });
	  /*$scope.post.comments.push({
	    body: $scope.body,
	    author: 'user',
	    upvotes: 0
	  });*/
	  $scope.body = '';
	};
	$scope.incrementUpvotes = function(comment){
           posts.upvoteComment(post, comment);
        };

}]);

app.factory('auth', ['$http', '$window', function($http, $window){
   var auth = {};
auth.saveToken = function (token){
  $window.localStorage['BMIWebApplication-token'] = token;
};

auth.getToken = function (){
  return $window.localStorage['BMIWebApplication-token'];
};
auth.isLoggedIn = function(){
  var token = auth.getToken();

  if(token){
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.exp > Date.now() / 1000;
  } else {
    return false;
  }
};
auth.currentUser = function(){
  if(auth.isLoggedIn()){
    var token = auth.getToken();
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.username;
  }
};
auth.currentUserName = function(){
  if(auth.isLoggedIn()){
    var token = auth.getToken();
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.firstname + ' ' + payload.lastname; 
  }
};
auth.register = function(user){
  return $http.post('/register', user).success(function(data){
    auth.saveToken(data.token);
  });
};
auth.logIn = function(user){
  return $http.post('/login', user).success(function(data){
    auth.saveToken(data.token);
  });
};
auth.logOut = function(){
  $window.localStorage.removeItem('BMIWebApplication-token');
};
  return auth;
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};
  console.log("In AuthCtrl: login in global");
  auth.logIn($scope.user).error(function(error){
    $scope.error = error;
  }).then(function(){
    console.log("In AuthCtrl: login after SSO");
    //$state.go('userhome',  { user: auth.currentUser() });
    $state.go('dashboard',  { user: auth.currentUser() });
  });
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
	console.log("In AuthCtrl: login");
      $state.go('userhome',  { user: auth.currentUser() });
    });
  };
}]);

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.currentUserName = auth.currentUserName;
  $scope.logOut = auth.logOut;
}]);


app.controller('dashboardCtrl', ['$scope','$rootScope','$timeout',
    function ($scope, $rootScope,$timeout) {
        
        $scope.showServiceView = false;
        $scope.selectedService={};
        $scope.showService = function(service){
            $scope.showServiceView = true;
            $scope.selectedService = service;
        }
        
        
        $scope.alerts =["Alert Message 1","Alert Message 2","Alert Message 3"];
        $scope.timePeriod=['Quaterly','Annual']
        $scope.servicePortifolioData = [{'title':'EMA','description':'Enterprise Architechiture Modeling Systems','value':'138$','increase':true},
                                        {'title':'ESPM','description':'Enterprise Service Performance Management', 'value':'0.7%','increase':false},
                                        {'title':'SIR','description':'Strategic Invoation And Research','value':'25%','increase':false}]
        
        $scope.maximize = function(id_of_box){
            $( '#'+ id_of_box ).addClass( "pop-up");
        }    
        $scope.close = function(id_of_box){
            $( '#'+ id_of_box ).removeClass( "pop-up"); 
            $( '#'+ id_of_box ).css( 'left','');
            $( '#'+ id_of_box ).css( 'top','');
        }                                
        $timeout(function(){
            $('.draggable').draggable({
                cursor: "crosshair",        
                handle: ".panel-heading",   //to allow dragging only from header
                distance: 5 ,//to avoid unwanted dragging
            })
        });

    }]);
    
app.controller('headerCtrl', ['$scope','$rootScope','$timeout','$stateParams',
    function ($scope, $rootScope,$timeout,$stateParams) {
        $scope.navigation={
            
                            'dashboard': {'title':"My DashBoard",'url':'','active':false},
                             'reports':  {'title':"Reports",'url':'','active':false}
                            
                        }
        angular.forEach($scope.navigation,function(value,key){
            if(key == $stateParams.state){
                value.active = true;
            }
            else{
                value.active = false;
            }
        })
        $timeout( function(){
            console.log($stateParams)
        })
        
    }])
    
