'use strict';

angular.module('avApp')
  .controller('OrderKonsumentCtrl', ['$scope', '$state', '$log', '$uibModal', 'BestallningState', 'KonsumentbestallningState', 'AnslutningStatus', 'FormValidation', 'Bestallning',
      function ($scope, $state, $log, $uibModal, BestallningState, KonsumentBestallningState, AnslutningStatus, FormValidation, Bestallning) {

        if (!BestallningState.current().driftmiljo || !BestallningState.current().driftmiljo.id) {
          $log.warn('going to parent state');
          $state.go('order');
          return;
        }

        $scope.updateAnslutningarIValdTjanstedoman = function () {
          if ($scope.konsumentbestallning.driftmiljo && $scope.konsumentbestallning.tjanstekomponent && $scope.selectedTjanstedoman) {
            var tjanstekomponentId = $scope.konsumentbestallning.tjanstekomponent.hsaId;
            var driftmiljoId = $scope.konsumentbestallning.driftmiljo.id;
            var tjanstedomanId = $scope.selectedTjanstedoman.tjansteDomanId;
            populateScopeWithAnslutningData(driftmiljoId, tjanstedomanId, tjanstekomponentId);
          }
        };

        $scope.selectAllLogiskaAdresser = function(kontrakt) {
          if ($scope.matrix) {
            var cc = contractKey(kontrakt);
            _.each(_.keys($scope.matrix), function(key) {
              if ($scope.matrix[key][cc]) {
                $scope.matrix[key][cc].checked = kontrakt._checkAll;
              }
            });
            updateAnslutningarOnOrder();
          }
        };

        $scope.filterLogiskaAdresser = function(inputText) {
          if (inputText) {
            $scope.logiskaAdresser = _.filter($scope.logiskaAdresserIValdTjanstedoman, function(logiskAdress) {
              return logiskAdress.namn.toLowerCase().indexOf(inputText.toLowerCase()) > -1 ||
                logiskAdress.hsaId.toLowerCase().indexOf(inputText.toLowerCase()) > -1;
            });
          } else {
            $scope.logiskaAdresser = $scope.logiskaAdresserIValdTjanstedoman;
          }
        };

        var populateScopeWithAnslutningData = function(environmentId, serviceDomainId, serviceConsumerHsaId) {
          var newMatrix = {};
          var logiskaAdresser = [];
          var kontraktIValdTjanstedoman = [];
          AnslutningStatus.getKonsumentanslutningar(serviceConsumerHsaId, environmentId, serviceDomainId)
            .then(function (matrix) {
              $log.debug(matrix);
              _.each(matrix, function (kaStatus) {
                var kontrakt = _.pick(kaStatus, ['tjanstekontraktNamn', 'tjanstekontraktNamnrymd', 'tjanstekontraktMajorVersion', 'tjanstekontraktMinorVersion']);
                var cc = contractKey(kaStatus);
                _.each(kaStatus.logiskAdressStatuses, function (laStatus) {
                  if (!_.find(logiskaAdresser, _.pick(laStatus, 'hsaId'))) {
                    logiskaAdresser.push(_.pick(laStatus, 'hsaId', 'namn'));
                  }
                  if (!newMatrix[laStatus.hsaId]) {
                    newMatrix[laStatus.hsaId] = {};
                  }
                  newMatrix[laStatus.hsaId][cc] = {
                    enabled: laStatus.enabled,
                    checked: laStatus.enabled,
                    possible: laStatus.possible
                  };
                  if (laStatus.enabled) { //start tracking _existing status here
                    kontrakt._existing = true;
                  }
                });
                kontraktIValdTjanstedoman.push(kontrakt);
              });
              $scope.matrix = newMatrix;
              $scope.logiskaAdresserIValdTjanstedoman = logiskaAdresser; //samtliga logiska adresser
              $scope.logiskaAdresser = logiskaAdresser; //logiska adresser som visas
              $scope.kontraktIValdTjanstedoman = kontraktIValdTjanstedoman;
            });
        };

        //update anslutningar on order based on status in matrix.
        //The matrix keeps the complete state since we can only work with one tjänstedomän at a time
        var updateAnslutningarOnOrder = function() {
          var newRemoveWarning = false;
          if ($scope.matrix) {
            var anslutningar = [];
            _.each(_.pairs($scope.matrix), function(pair) {
              var logiskAdress = _.find($scope.logiskaAdresser, {hsaId: pair[0]});
              _.each(_.pairs(pair[1]), function(innerPair) {
                var cc = innerPair[0];
                var contractLogiskAdressStatus = innerPair[1];
                var kontrakt = _.find($scope.kontraktIValdTjanstedoman, function(kontrakt) {
                  return contractKey(kontrakt) === cc;
                });
                var anslutning = _.find(anslutningar, _.pick(kontrakt, [
                    'tjanstekontraktNamnrymd', 'tjanstekontraktMajorVersion', 'tjanstekontraktMinorVersion'
                  ]));
                if (!anslutning) {
                  anslutning = _.clone(kontrakt);
                  anslutning.nyaLogiskaAdresser = [];
                  anslutning.borttagnaLogiskaAdresser = [];
                }
                if (!contractLogiskAdressStatus.enabled && contractLogiskAdressStatus.checked) {
                  anslutning.nyaLogiskaAdresser.push(_.clone(logiskAdress));
                }
                if (contractLogiskAdressStatus.enabled && !contractLogiskAdressStatus.checked) {
                  anslutning.borttagnaLogiskaAdresser.push(_.clone(logiskAdress));
                }
                anslutningar.push(anslutning);
              });
            });
            _.each(anslutningar, function(anslutning) {
              if (anslutning.borttagnaLogiskaAdresser.length) { //we have at least one unchecked logisk adress
                newRemoveWarning = true;
              }
              if (anslutning.nyaLogiskaAdresser.length || anslutning.borttagnaLogiskaAdresser.length) {
                KonsumentBestallningState.addAnslutning(anslutning);
                _.each(anslutning.nyaLogiskaAdresser, function(nyLogiskAdress) {
                  KonsumentBestallningState.addLogiskAdressToAnslutning(nyLogiskAdress, anslutning);
                });
                _.each(anslutning.borttagnaLogiskaAdresser, function(borttagenLogiskAdress) {
                  KonsumentBestallningState.removeLogiskAdressFromAnslutning(borttagenLogiskAdress, anslutning);
                });
              } else {
                KonsumentBestallningState.removeAnslutning(anslutning);
              }
            });
            $scope.removeWarning = newRemoveWarning;
          }
        };

        var contractKey = function(anslutning) {
          var namnrymd = anslutning.tjanstekontraktNamnrymd;
          var major = anslutning.tjanstekontraktMajorVersion;
          var minor = anslutning.tjanstekontraktMinorVersion;
          return namnrymd + '_' + major + '_' + minor;
        };

        var _recheckOrderValidity = function () {
          if ($scope.sendOrderClicked) {
            $scope.orderValid = FormValidation.checkGlobalValidation();
          }
        };

        $scope.$on('gv-leaving-element-invalid', _recheckOrderValidity);
        $scope.$on('gv-leaving-element-valid', _recheckOrderValidity);
        $scope.$on('gv-element-invalid', _recheckOrderValidity);
        $scope.$on('gv-element-invalid-in-focus', _recheckOrderValidity);
        $scope.$on('gv-element-valid', _recheckOrderValidity);
        $scope.$on('gv-element-valid-in-focus', _recheckOrderValidity);

        $scope.$on('send-order', function() {
          $scope.sendOrderClicked = true;
          if (!FormValidation.validateForms()) {
            $log.warn('--- order is not valid ---');
            $scope.orderValid = false;
          } else {
            $log.debug('--- order is valid ---');
            $scope.orderValid = true;

            var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: 'views/order/konsument-modal.html',
              controller: 'OrderKonsumentModalCtrl',
              size: 'lg'
            });

            modalInstance.result.then(function () {
              $log.debug('user clicked OK');
              Bestallning.createKonsumentbestallning(KonsumentBestallningState.current(), BestallningState.current()).then(function (status) {
                if (status === 201) {
                  $log.debug('Going to \'order-confirmation\' state');
                  $state.go('order-confirmation');
                }
              });
            }, function () {
              $log.debug('modal dismissed');
            });
          }
        });

        var _reset = function() {
          $log.debug('--- reset ---');
          _.assign($scope, {
            orderValid: true,
            sendOrderClicked: false,
            selectedTjanstedoman: undefined,
            logiskaAdresser: [],
            logiskaAdresserIValdTjanstedoman: []
          });
          $scope.$broadcast('show-errors-reset');
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

        $scope.$watch(function () {
          return !!$scope.konsumentbestallning.tjanstekomponent && !!$scope.konsumentbestallning.konsumentanslutningar.length;
        }, function (newVal) {
          BestallningState.setSpecificOrderSatisfied(newVal);
        });

        $scope.$watch(function () {
          return $scope.orderValid;
        }, function (newVal) {
          BestallningState.setSpecificOrderValid(newVal);
        });

        $scope.contractKey = contractKey;
        $scope.updateAnslutningarOnOrder = updateAnslutningarOnOrder;

      }
    ]
  );
