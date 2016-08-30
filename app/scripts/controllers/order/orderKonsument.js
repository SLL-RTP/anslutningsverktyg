'use strict';

angular.module('avApp')
  .controller('OrderKonsumentCtrl', ['$scope', '$state', '$log', '$timeout', '$uibModal', 'BestallningState', 'KonsumentbestallningState', 'AnslutningStatus', 'FormValidation', 'Bestallning',
      function ($scope, $state, $log, $timeout, $uibModal, BestallningState, KonsumentBestallningState, AnslutningStatus, FormValidation, Bestallning) {

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
          console.time('selectAllLogiskaAdresser');
          if ($scope.matrix) {
            var ck = contractKey(kontrakt);
            _.each(_.keys($scope.matrix), function(laHsaId) {
              if ($scope.matrix[laHsaId][ck]) {
                if (kontrakt._checkAll) {
                  if (!$scope.matrix[laHsaId][ck].checked) {
                    $scope.matrix[laHsaId][ck].checked = true;
                    updateLogiskAdressOnAnslutning(laHsaId, ck);
                  }
                } else {
                  if ($scope.matrix[laHsaId][ck].checked !== $scope.matrix[laHsaId][ck].enabled) {
                    $scope.matrix[laHsaId][ck].checked = $scope.matrix[laHsaId][ck].enabled;
                    updateLogiskAdressOnAnslutning(laHsaId, ck);
                  }
                }
              }
            });
          }
          console.timeEnd('selectAllLogiskaAdresser');
        };

        $scope.filterLogiskaAdresser = function(inputText) {
          if (inputText) {
            console.time('filterLogiskaAdresser');
            $scope.logiskaAdresser = _.filter($scope.logiskaAdresserIValdTjanstedoman, function(logiskAdress) {
              return logiskAdress.namn.toLowerCase().indexOf(inputText.toLowerCase()) > -1 ||
                logiskAdress.hsaId.toLowerCase().indexOf(inputText.toLowerCase()) > -1;
            });
            console.timeEnd('filterLogiskaAdresser');
          } else {
            $scope.logiskaAdresser = $scope.logiskaAdresserIValdTjanstedoman;
          }
        };

        var populateScopeWithAnslutningData = function(environmentId, serviceDomainId, serviceConsumerHsaId) {
          console.time('populateScope');
          $scope.reloadingMatrix = true;
          var newMatrix = {};
          var logiskaAdresser = [];
          var kontraktIValdTjanstedoman = [];
          AnslutningStatus.getKonsumentanslutningar(serviceConsumerHsaId, environmentId, serviceDomainId)
            .then(function (matrix) {
              console.time('populateScope - After data received');
              var tmpLaObj = {};
              _.each(matrix, function (kaStatus) {
                var kontrakt = _.pick(kaStatus, ['tjanstekontraktNamn', 'tjanstekontraktNamnrymd', 'tjanstekontraktMajorVersion', 'tjanstekontraktMinorVersion']);
                var ck = contractKey(kaStatus);
                _.each(kaStatus.logiskAdressStatuses, function (laStatus) {
                  tmpLaObj[laStatus.hsaId] = { //doing this instead of _.find on logiskaAdresser for performance
                    hsaId: laStatus.hsaId,
                    namn: laStatus.namn
                  };
                  if (!newMatrix[laStatus.hsaId]) {
                    newMatrix[laStatus.hsaId] = {};
                  }
                  newMatrix[laStatus.hsaId][ck] = {
                    enabled: laStatus.enabled,
                    checked: laStatus.enabled,
                    possible: laStatus.possible
                  };
                  if (laStatus.enabled) { //start tracking _existing status here
                    kontrakt._existing = true;
                  }
                });
                kontrakt._key = ck;
                kontraktIValdTjanstedoman.push(kontrakt);
              });
              logiskaAdresser = _.values(tmpLaObj);
              $scope.matrix = newMatrix;
              $scope.logiskaAdresserIValdTjanstedoman = logiskaAdresser; //samtliga logiska adresser
              $scope.logiskaAdresser = logiskaAdresser; //logiska adresser som visas
              $scope.kontraktIValdTjanstedoman = _.sortBy(kontraktIValdTjanstedoman, 'tjanstekontraktNamnrymd'); //pre-sort since we iterate multiple times
              $scope.removeWarning = false;
              $scope.reloadingMatrix = false;
              console.timeEnd('populateScope - After data received');
              console.timeEnd('populateScope');
            });
        };

        var updateLogiskAdressOnAnslutning = function(logiskAdressHsaId, kontraktKey) {
          if ($scope.matrix) {
            if (logiskAdressHsaId && kontraktKey) {
              var laStatus = $scope.matrix[logiskAdressHsaId][kontraktKey];
              var kontrakt = _.find($scope.kontraktIValdTjanstedoman, {_key: kontraktKey});
              var logiskAdress = _.find($scope.logiskaAdresser, {hsaId: logiskAdressHsaId});
              if (laStatus.possible) {
                var ans = KonsumentBestallningState.getAnslutning(kontraktKey);
                if (!ans) {
                  ans = _.clone(kontrakt);
                  KonsumentBestallningState.addAnslutning(ans);
                }
                if (laStatus.checked) {
                  //enable
                  KonsumentBestallningState.addLogiskAdressToAnslutning(logiskAdress, ans, !laStatus.enabled);
                } else {
                  //disable
                  KonsumentBestallningState.removeLogiskAdressFromAnslutning(logiskAdress, ans, laStatus.enabled);
                }
              }
              _setRemoveWarning();
            } else {
              console.error('missing logiskAdressHsaId or kontraktKey');
            }
          }
        };

        var _setRemoveWarning = _.debounce(function() {
          var removeWarning = false;
          if (KonsumentBestallningState.current().konsumentanslutningar.length > 0) {
            removeWarning = !!_.find(KonsumentBestallningState.current().konsumentanslutningar, function(ans) {
              return ans.borttagnaLogiskaAdresser && ans.borttagnaLogiskaAdresser.length > 0;
            });
          }
          $timeout(function() {
            $scope.removeWarning = removeWarning;
          });
        }, 50);

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
            logiskaAdresserIValdTjanstedoman: [],
            removeWarning: false
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

        /**
         * Calculated watch that updates order environment when updated in main
         */
        $scope.$watch(function () {
          return BestallningState.current().driftmiljo;
        }, function (newVal) {
          if (newVal) {
            $scope.konsumentbestallning.driftmiljo = newVal;
          }
        }, true);

        $scope.$watch(function () {
          return $scope.orderValid;
        }, function (newVal) {
          BestallningState.setSpecificOrderValid(newVal);
        });

        $scope.contractKey = contractKey;
        $scope.updateLogiskAdressOnAnslutning = updateLogiskAdressOnAnslutning;

      }
    ]
  );
