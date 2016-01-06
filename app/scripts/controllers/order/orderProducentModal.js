'use strict';

angular.module('avApp')
  .controller('OrderProducentModalCtrl', ['$scope', '$uibModalInstance', '$log', 'BestallningState', 'ProducentbestallningState', 'canHandleLogiskaAdresserInUnity',
      function ($scope, $uibModalInstance, $log, BestallningState, ProducentbestallningState, canHandleLogiskaAdresserInUnity) {
        $scope.bestallning = BestallningState.current();
        $scope.producentbestallning = ProducentbestallningState.current();
        $scope.canHandleLogiskaAdresserInUnity = canHandleLogiskaAdresserInUnity;

        $scope.forandradAnslutning = function(anslutning) {
          if (anslutning.nyaLogiskaAdresser && anslutning.nyaLogiskaAdresser.length) {
            return true;
          } else if (anslutning.borttagnaLogiskaAdresser && anslutning.borttagnaLogiskaAdresser.length) {
            return true;
          } else if (anslutning.tidigareUrl && anslutning.url !== anslutning.tidigareUrl) {
            return true;
          } else if (anslutning.tidigareRivtaProfil && anslutning.rivtaProfil !== anslutning.tidigareRivtaProfil) {
            return true;
          }
          return false;
        };

        $scope.ok = function () {
          $uibModalInstance.close();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }
    ]
  );
