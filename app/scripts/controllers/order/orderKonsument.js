'use strict';

angular.module('avApp')
  .controller('OrderKonsumentCtrl', ['$scope', '$state', '$q', 'BestallningState', 'KonsumentbestallningState', 'ServiceContract', 'LogicalAddress',
      function ($scope, $state, $q, BestallningState, KonsumentBestallningState, ServiceContract, LogicalAddress) {

        if (!BestallningState.current().driftmiljo || !BestallningState.current().driftmiljo.id) {
          console.warn('going to parent state');
          $state.go('order');
          return;
        }

        $scope.updateAnslutningarIValdTjanstedoman = function () {
          if ($scope.konsumentbestallning.driftmiljo && $scope.konsumentbestallning.tjanstekomponent && $scope.selectedTjanstedoman) {
            $scope.logiskaAdresser = [];
            var tjanstekomponentId = $scope.konsumentbestallning.tjanstekomponent.hsaId;
            var driftmiljoId = $scope.konsumentbestallning.driftmiljo.id;
            var tjanstedomanId = $scope.selectedTjanstedoman.tjansteDomanId;
            ServiceContract.listAnslutningar(tjanstekomponentId, driftmiljoId, tjanstedomanId).then(function (anslutningar) {
              $scope.anslutningarIValdTjanstedoman = _.map(anslutningar, function (anslutning) {
                anslutning._paBestallning = KonsumentBestallningState.isAnslutningOnOrder(anslutning);
                return anslutning;
              });
              updateConnectedLogiskaAdresser(tjanstekomponentId, driftmiljoId, $scope.anslutningarIValdTjanstedoman);
            });
          }
        };

        $scope.selectAllLogiskaAdresser = function(anslutning) {
          if ($scope.matrix) {
            var cc = contractKey(anslutning);
            _.forOwn($scope.matrix, function(val, key) {
              var disabled = $scope.matrix[key][cc].disabled;
              $scope.matrix[key][cc].checked = !disabled && anslutning.checkAll;
            });
          }
        };

        var updateConnectedLogiskaAdresser = function(tjanstekomponentHsaId, driftmiljoId, anslutningar) {
          console.log('anslutningar', anslutningar);
          var promises = _.map(anslutningar, function(anslutning) {
            var deferred = $q.defer();
            LogicalAddress.getConnectedLogicalAddressesForContract(
              tjanstekomponentHsaId,
              driftmiljoId,
              anslutning.tjanstekontraktNamnrymd,
              anslutning.tjanstekontraktMajorVersion,
              anslutning.tjanstekontraktMinorVersion).then(function(logiskaAdresser) {
              deferred.resolve({
                anslutning: anslutning,
                logiskaAdresser: logiskaAdresser
              });
            });
            return deferred.promise;
          });
          $q.all(promises).then(function(holderArr) {
            var matrix = {};
            var logiskaAdresser = [];
            _.each(holderArr, function(holder) {
              console.log('holder', holder);
              var cc = contractKey(holder.anslutning);
              _.each(holder.logiskaAdresser, function(logiskAdress) {
                if (!_.find(logiskaAdresser, {hsaId: logiskAdress.hsaId})) {
                  logiskaAdresser.push(logiskAdress);
                }
                if (!matrix[logiskAdress.hsaId]) {matrix[logiskAdress.hsaId] = {};}
                matrix[logiskAdress.hsaId][cc] = {
                  installed: true,
                  checked: true
                };
              });
            });
            //TODO: need second pass to 'fill in blanks' ?
            $scope.matrix = matrix;
            $scope.logiskaAdresser = logiskaAdresser;
          });
        };

        var contractKey = function(anslutning) {
          var namnrymd = anslutning.tjanstekontraktNamnrymd;
          var major = anslutning.tjanstekontraktMajorVersion;
          var minor = anslutning.tjanstekontraktMinorVersion;
          return namnrymd + '_' + major + '_' + minor;
        };

        var _reset = function() {
          console.info('--- reset ---');
          _.assign($scope, {
            orderValid: true,
            sendOrderClicked: false,
            selectedTjanstedoman: undefined
          });
          $scope.$broadcast('show-errors-reset');
          _.each($scope.nat, function(nat) {
            delete nat._checked;
          });
        };

        _reset();

        KonsumentBestallningState.init().then(function () {
          $scope.konsumentbestallning = KonsumentBestallningState.current();
        });

        $scope.$watch(function () { //watching for changed tjanstekomponent in 'main' Bestallning
          return BestallningState.current().tjanstekomponent;
        }, function (newVal) {
          if (newVal) {
            _reset();
            KonsumentBestallningState.setTjanstekomponent(newVal);
            $scope.updateAnslutningarIValdTjanstedoman();
          }
        }, true);

        $scope.$watch(function () { //watching for changed nat in 'main' Bestallning
          return BestallningState.current().nat;
        }, function (newVal) {
          if (newVal) {
            KonsumentBestallningState.setNat(newVal);
            $scope.updateAnslutningarIValdTjanstedoman();
          }
        }, true);

        $scope.contractKey = contractKey;

      }
    ]
  );
