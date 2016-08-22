angular.module('fundingHubApp')

.controller('ProjectsList', function (fundingHubService) {
  var self = this
  angular.extend(this, {
    projects: fundingHubService.projects,
  })
})

.controller('CreateProject', function ($log, fundingHubService) {
  var self = this
  angular.extend(this, {
    name: '',
    description: '',
    url: '',
    targetAmount: '',
    deadline: Math.floor(Date.now() / 1000),
    error: null,

    doCreate: doCreate,
  })

  function doCreate() {
    self.error = null
    fundingHubService.createProject(self.name, self.description, self.url, self.targetAmount, self.deadline)
    .then(function (txid) {
      $log.info('New Transaction: ', txid)
    })
    .catch(function (err) {
      self.error = err.toString()
      $log.error(err)
    })
  }

})

.controller('ProjectDetails', function ($scope, $stateParams, $log, fundingHubService) {
  $log.debug('selected project', $stateParams.address)
  var self = this
  angular.extend(this, {
    details: fundingHubService.projects[$stateParams.address],
    controlAccountContribution: 0,
    contribInput: 0,
    error: null,

    doContribute: doContribute,
  })

  _refreshContribution()
  $scope.$on('ControlAccountChanged', _refreshContribution)

  function _refreshContribution() {
    fundingHubService.getCurrentAccountContribution(self.details.address)
    .then(function (value) {
      self.controlAccountContribution = value
    })
  }

  function doContribute() {
    self.error = null
    fundingHubService.contributeToProject(self.details.address, self.contribInput)
    .then(function (txid) {
      $log.info('New Transaction: ', txid)
      _refreshContribution()
    })
    .catch(function (err) {
      self.error = err.toString()
      $log.error(err)
    })
  }


})
