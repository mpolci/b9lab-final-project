angular.module('fundingHubApp').controller('FundingHubController', function ($scope, $log, $q, fundingHubService) {
  var self = this
  angular.extend(this, {
    projects: fundingHubService.projects,
    selectedProject: null,
    createProject: null,

    goToProject: goToProject,
    goToCreate: goToCreate,
  })

  $scope.$on('controlAccountChanged', function () {
    if (self.selectedProject) refreshContribution()
  })

  function goToProject(idx) {
    self.createProject = null
    self.selectedProject = self.projects[idx]
    refreshContribution()
  }

  function refreshContribution() {
    fundingHubService.getCurrentAccountContribution()
    .then(function (value) {
      //TODO
    })
  }

  function goToCreate() {
    if (self.createProject) return
    self.selectedProject = null
    self.createProject = {
      name: '',
      description: '',
      url: '',
      targetAmount: '',
      deadline: Math.floor(Date.now() / 1000)
    }
  }

  function doContribute() {

  }

})

.controller('CreateProject', function ($log, fundingHubService) {
  var self = this
  angular.extend(this, {
    name: '',
    description: '',
    url: '',
    targetAmount: '',
    deadline: Math.floor(Date.now() / 1000),

    doCreate: doCreate,
  })

  function doCreate() {
    fundingHubService.createProject(self.name, self.description, self.url, self.targetAmount, self.deadline)
    .then(function (txid) {
      $log.info('New Transaction: ', txid)
    })
  }

})

.controller('ProjectDetails', function ($scope, $routeParams, $log, $q, fundingHubService) {
  var self = this
  angular.extend(this, {
    details: null,

  })
  fundingHubService.getProjectDetails

})
