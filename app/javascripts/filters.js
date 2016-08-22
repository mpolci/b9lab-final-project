;(function () {

  let filters = [
    {
      name: 'ethereumTimestamp',
      toView: function (data) { return new Date(data * 1000) },
      fromView: function (data) { return Math.floor(data.getTime() / 1000) }
    },
    {
      name: 'unitEther',
      toView: function (data) { return web3.fromWei(web3.toBigNumber(data), 'ether').toNumber() },
      fromView: function (data) { return web3.toWei(data, 'ether') }
    },
  ]

  let app = angular.module('fundingHubApp')
  filters.forEach(function (f) {
    app.filter(f.name, function () {
      return f.toView
    })
    .directive(f.name, function() {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModelController) {
          ngModelController.$parsers.push(f.fromView)
          ngModelController.$formatters.push(f.toView)
        }
      }
    })
  })

  app.filter('num', function() {
    return function(input) {
      return input != null ? parseFloat(input) : null
    }
  })

  app.filter('projectStatus', function() {
    return function(input) {
      switch (input) {
        case 0:
          return 'in progress'
        case 1:
          return 'payed out'
        case 2:
          return 'refunded'
        default:
          return 'unknown'
      }
    }
  })

})()
