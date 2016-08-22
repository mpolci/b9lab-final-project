angular.module('fundingHubApp', ['ui.router'])

.config(function($stateProvider) {
  $stateProvider
  .state('project', {
    params: {
      address: ''
    },
    templateUrl: 'views/project.html',
    controller: 'ProjectDetails',
    controllerAs: 'project'
  })
  .state('create', {
    templateUrl: 'views/create.html',
    controller: 'CreateProject',
    controllerAs: 'create'
  })
})
