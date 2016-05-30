'use strict';

angular.module('avApp')
  .controller('LogiskAdressAlertController', ['$scope', '$attrs',
  function($scope, $attrs) {
    $scope.closeable = 'close' in $attrs;
    this.close = $scope.close;
  }])


  .directive('logiskAdressAlert', function() {
    return {
      restrict: 'E',
      controller: 'LogiskAdressAlertController',
      templateUrl: 'templates/logisk-adress-alert.html',
      scope: {
        logiskAdressNamn: '@',
        logiskAdressHsaId: '@',
        close: '&',
        closeDisabled: '=',
        type: '@'
      }
    };
  });
