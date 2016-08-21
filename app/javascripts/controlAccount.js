angular.module('fundingHubApp')

.service('controlAccountService', function ($q) {
  var self = this
  angular.extend(this, {
    selectedAccount: null,

    getAvailableAccounts: getAvailableAccounts,
    getBalance: getBalance,
  })

  /*********************************************************/

  function getAvailableAccounts() {
    return $q(function(resolve, reject) {
      web3.eth.getAccounts(function (err, accounts) {
        if (err) return reject(err)
        resolve(accounts)
      })
    })
  }

  function getBalance(address) {
    return $q(function(resolve, reject) {
      web3.eth.getBalance(address, function (err, value) {
        if (err) return reject(err)
        resolve(value)
      })
    })
  }
})

.controller('controlAccountController', function ($rootScope, $log, controlAccountService) {
  var self = this
  angular.extend(this, {
    accounts: [],
    selected: controlAccountService.selectedAccount,
    balance: null,

    onSelectedChange: onSelectedChange,
  })

  controlAccountService.getAvailableAccounts().then(function (accounts) {
    self.accounts = accounts
    if (accounts.length > 0) {
      self.selected = accounts[0]
      onSelectedChange()
    }
  })

  /*********************************************************/

  function onSelectedChange() {
    controlAccountService.selectedAccount = self.selected
    controlAccountService.getBalance(self.selected).then(function (value) {
      self.balance = value
    })
    $rootScope.$broadcast('controlAccountChanged')
  }

})
