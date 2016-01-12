'use strict';

angular.module('avApp')
  .controller('OrderKonsumentModalCtrl', ['$scope', '$uibModalInstance', '$log', 'BestallningState', 'KonsumentbestallningState',
      function ($scope, $uibModalInstance, $log, BestallningState, KonsumentbestallningState) {

        $scope.bestallning = BestallningState.current();

        $scope.konsumentbestallning = KonsumentbestallningState.current();

        $scope.nyaKonsumentanslutningar = _.filter($scope.konsumentbestallning.konsumentanslutningar, function(anslutning) {
          return !anslutning._existing;
        });

        $scope.uppdateradKonsumentanslutningar = _.filter($scope.konsumentbestallning.konsumentanslutningar, function(anslutning) {
          return anslutning._existing;
        });

        $scope.ok = function () {
          $uibModalInstance.close();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }
    ]
  );
