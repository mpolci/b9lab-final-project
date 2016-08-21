angular.module('fundingHubApp').controller('FundingHubController', function ($scope, $log, fundingHubService) {
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

  function goToProject(idx) {
    self.createProject = null
    self.selectedProject = self.projects[idx]
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

  }

  function doContribute() {
    
  }

})
