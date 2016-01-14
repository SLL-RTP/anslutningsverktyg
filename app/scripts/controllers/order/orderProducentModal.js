'use strict';

angular.module('avApp')
  .controller('OrderProducentModalCtrl', ['$scope', '$uibModalInstance', '$log', 'BestallningState', 'ProducentbestallningState', 'canHandleLogiskaAdresserInUnity',
      function ($scope, $uibModalInstance, $log, BestallningState, ProducentbestallningState, canHandleLogiskaAdresserInUnity) {
        $scope.bestallning = BestallningState.current();
        $scope.producentbestallning = ProducentbestallningState.current();
        $scope.canHandleLogiskaAdresserInUnity = canHandleLogiskaAdresserInUnity;

        var isForandradAnslutning = function(anslutning) {
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

        var isUppdateraProducentAnslutning = function(anslutning) {
          return ((anslutning.befintligaLogiskaAdresser && anslutning.befintligaLogiskaAdresser.length > 0) || anslutning.tidigareRivtaProfil || anslutning.tidigareUrl);
        };

        $scope.nyaProducentanslutningar = _.filter($scope.producentbestallning.producentanslutningar, function(anslutning) {
          return isForandradAnslutning(anslutning) && !isUppdateraProducentAnslutning(anslutning);
        });

        $scope.uppdateradProducentanslutningar = _.filter($scope.producentbestallning.producentanslutningar, function(anslutning) {
          return isForandradAnslutning(anslutning) && isUppdateraProducentAnslutning(anslutning);
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