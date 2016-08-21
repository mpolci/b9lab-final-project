angular.module('fundingHubApp').service('fundingHubService', function ($q, controlAccountService) {
  var self = this
  angular.extend(this, {
    getProjects: getProjects,
    getProjectDetails: getProjectDetails,

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

  function createProject() {

  }

  function contributeToProject() {

  }
})
