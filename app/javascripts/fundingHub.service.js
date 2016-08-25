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

  // do some checks on FundingHub smart contract
  if (!hub) return $log.error('FundingHub not deployed')
  web3.eth.getCode(FundingHub.address, function (err, value) {
    if (value === '0x0' || FundingHub.binary.lastIndexOf(value.substr(2)) === -1) {
      $log.error('FundingHub stored address does not contains valid binary')
    }
  })

  // retrieve projects list and details
  $q.when(hub.getProjects())
  .then(function (projects) {
    $log.debug(projects)
    projects.forEach(_addProj)
  })

  // listen for new projects on the hub
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

  function _getTxReceipt(txid) {
    return $q(function (resolve, reject) {
      web3.eth.getTransactionReceipt(txid, function (err, receipt) {
        if (err) return reject(err)
        if (!receipt) return reject('Transaction not found')
        resolve(receipt)
      })
    })
  }

  function createProject(name, desc, url, target, deadline) {
    if (!(parseInt(target) > 0)) return $q.reject('Target cannot be 0')
    if (!name || !deadline) return $q.reject('Missing argument')
    if (deadline <= Date.now() / 1000) return $q.reject('The deadline is not in the future')
    var source = controlAccountService.selectedAccount
    var gas = 800000
    var tx
    return $q.when(hub.createProject(name, desc, url, target, deadline, {from: controlAccountService.selectedAccount, gas: gas}))
    .then(function (txid) {
      $rootScope.$broadcast('NewTransaction', { from: source, txid: txid })
      tx = txid
      return _getTxReceipt(txid)
    })
    .then(function (receipt) {
      $log.debug('Consumed gas', receipt.gasUsed)
      if (receipt.gasUsed === gas) return $q.reject('Out of gas')
      return tx
    })
  }

  function contributeToProject(prjAddr, amount) {
    var prjDetails = self.projects[prjAddr]
    if (!prjAddr) return $q.reject('Unknown project address')
    var prj = Project.at(prjAddr)
    var source = controlAccountService.selectedAccount
    var gas = 300000
    var tx
    return $q.when(hub.contribute(prjAddr, {from: source, value: amount, gas: gas}))
    .then(function (txid) {
      $rootScope.$broadcast('NewTransaction', { from: source, txid: txid })
      tx = txid
      return _getTxReceipt(txid)
    })
    .then(function (receipt) {
      $log.debug('Consumed gas', receipt.gasUsed)
      if (receipt.gasUsed === gas) return $q.reject('Out of gas')
      return $q.all([
        prj.collectedFunds(),
        prj.status(),
      ])
    })
    .then(function (values) {
      prjDetails.collectedFunds = values[0]
      prjDetails.status = values[1].toNumber()
      return tx
    })
  }

})
