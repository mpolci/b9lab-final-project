angular.module('fundingHubApp').service('fundingHubService', function ($q, controlAccountService) {
  var self = this
  angular.extend(this, {
    getProjects: getProjects,
    getProjectDetails: getProjectDetails,
    createProject: createProject,
  })
  var hub = FundingHub.deployed()
  var prjInfoOutputs = Project.abi.find(function (item) { return item.name === 'info' }).outputs

  function getProjects() {
    return $q.when(hub.getProjects())
  }

  function getProjectDetails(address) {
    var details = { address: address }
    var prj = Project.at(address)
    return $q.all([
      prj.info(),
      prj.collectedFunds(),
      prj.status(),
    ])
    .then(function (values) {
      prjInfoOutputs.forEach(function (v, i) {
        details[v.name] = values[0][i]
      })
      details.collectedFunds = values[1]
      details.status = values[2].toNumber()
      return details
    })
  }

  function getCurrentAccountContribution() {
    return controlAccountService.selectedAccount
      ? $q.when(Project.at(self.selectedProject.address).contributionOf.call(controlAccountService.selectedAccount))
      : $q.reject('No control account selected')
  }

  function createProject(name, desc, url, target, deadline) {
    return $q.when(hub.createProject(name, desc, url, target, deadline, {from: controlAccountService.selectedAccount}))
  }

  function contributeToProject() {

  }
})
