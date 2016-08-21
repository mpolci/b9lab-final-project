angular.module('fundingHubApp', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {
  $routeProvider
   .when('/project/:prjId', {
      templateUrl: 'project.html',
      controller: 'ProjectController',
    })
    .when('/create', {
      templateUrl: 'create.html',
      controller: 'CreateProjectController'
    });

  // configure html5 to get links working on jsfiddle
  $locationProvider.html5Mode(true);
});
