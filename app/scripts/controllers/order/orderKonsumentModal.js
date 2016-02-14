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

        $scope.print = function() {
          var printContents = document.getElementsByClassName('modal-body')[0].innerHTML;
          var popupWin = window.open('', '_blank');
          popupWin.document.open();
          popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="styles/main.css" /></head><body>' + printContents + '<script type="text/javascript">window.print(); window.onfocus=function(){ window.close();} </script></body></html>');
          popupWin.document.close();
        }
      }
    ]
  );
