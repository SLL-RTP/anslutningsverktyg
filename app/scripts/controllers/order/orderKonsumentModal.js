'use strict';

angular.module('avApp')
  .controller('OrderKonsumentModalCtrl', ['$scope', '$uibModalInstance', '$log', 'BestallningState', 'KonsumentbestallningState',
      function ($scope, $uibModalInstance, $log, BestallningState, KonsumentbestallningState) {

        $scope.bestallning = BestallningState.current();

        $scope.konsumentbestallning = KonsumentbestallningState.current();

        $scope.ok = function () {
          $uibModalInstance.close();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }
    ]
  );
