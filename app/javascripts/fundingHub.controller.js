angular.module('fundingHubApp').controller('FundingHubController', function ($scope, $log, $q, fundingHubService) {
  var self = this
  angular.extend(this, {
    projects: [],
    selectedProject: null,
    createProject: null,

    goToProject: goToProject,
    goToCreate: goToCreate,
    doCreate: doCreate,
  })

  fundingHubService.getProjects()
  .then(function (projects) {
    $log.debug(projects)
    self.projects = projects.map(function (addr) {
      return { address: addr }
    })
  })
  .then(function () {
    self.projects.forEach(function (p) {
      fundingHubService.getProjectDetails(p.address)
      .then(function (details) {
        angular.extend(p, details)
      })
    })
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

  function doCreate() {
    if (!self.createProject) return $log.error('invalid state')
    var args = self.createProject
    fundingHubService.createProject(args.name, args.description, args.url, args.targetAmount, args.deadline)
    .then(function (txid) {
      //TODO
    })
  }

  function doContribute() {

  }

})

.controller('ProjectController', function ($scope, $routeParams, $log, $q, fundingHubService) {
  var self = this
  angular.extend(this, {
    details: null,

  })
  fundingHubService.getProjectDetails

})
