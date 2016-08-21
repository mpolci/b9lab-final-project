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

    doCreate: doCreate,
  })

  function doCreate() {
    fundingHubService.createProject(self.name, self.description, self.url, self.targetAmount, self.deadline)
    .then(function (txid) {
      $log.info('New Transaction: ', txid)
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

    doContribute: doContribute,
  })

  _refreshContribution()
  $scope.$on('controlAccountChanged', _refreshContribution)

  function _refreshContribution() {
    fundingHubService.getCurrentAccountContribution(self.details.address)
    .then(function (value) {
      self.controlAccountContribution = value
    })
  }

  function doContribute() {
    fundingHubService.contributeToProject(self.details.address, self.contribInput)
    .then(function (txid) {
      $log.info('New Transaction: ', txid)
    })
  }


})
