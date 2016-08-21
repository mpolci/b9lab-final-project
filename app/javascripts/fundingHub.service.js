angular.module('fundingHubApp').service('fundingHubService', function ($rootScope, $q, $log, controlAccountService) {
  var self = this
  angular.extend(this, {
    projects: {},
    createProject: createProject,
    contributeToProject: contributeToProject,
    getCurrentAccountContribution: getCurrentAccountContribution,
  })
  var hub = FundingHub.deployed()
  var prjInfoOutputs = Project.abi.find(function (item) { return item.name === 'info' }).outputs


  $q.when(hub.getProjects())
  .then(function (projects) {
    $log.debug(projects)
    projects.forEach(_addProj)
  })

  eventNewProject = hub.NewProject(function (error, result) {
    if (error) return $log.error(error)
    _addProj(result.args.project)
  })

  function _addProj(addr) {
    var pd = { address: addr }
    self.projects[addr] = pd
    _fetchProjectDetails(addr)
    .then(function (details) {
      angular.extend(pd, details)
    })
  }

  function _fetchProjectDetails(address) {
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

  function getCurrentAccountContribution(prjAddr) {
    return controlAccountService.selectedAccount
      ? $q.when(Project.at(prjAddr).contributionOf.call(controlAccountService.selectedAccount))
      : $q.reject('No control account selected')
  }

  function createProject(name, desc, url, target, deadline) {
    var source = controlAccountService.selectedAccount
    return $q.when(hub.createProject(name, desc, url, target, deadline, {from: controlAccountService.selectedAccount}))
    .then(function (txid) {
      $rootScope.$broadcast('NewTransaction', { from: source, txid: txid })
      return txid
    })
  }

  function contributeToProject(prjAddr, amount) {
    var source = controlAccountService.selectedAccount
    return $q.when(hub.contribute(prjAddr, {from: source, value: amount}))
    .then(function (txid) {
      $rootScope.$broadcast('NewTransaction', { from: source, txid: txid })
      return txid
    })
  }
})
