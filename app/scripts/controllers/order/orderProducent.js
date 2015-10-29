'use strict';

angular.module('avApp')
  .controller('OrderProducentCtrl', ['$scope', '$state', '$timeout', '$log', 'AnslutningStatus', 'LogicalAddress', 'Bestallning', 'BestallningState', 'ProducentbestallningState', 'FormValidation', 'intersectionFilter', 'flattenFilter', 'rivProfiles',
      function ($scope, $state, $timeout, $log, AnslutningStatus, LogicalAddress, Bestallning, BestallningState, ProducentbestallningState, FormValidation, intersectionFilter, flattenFilter, rivProfiles) {

        if (!BestallningState.current().driftmiljo || !BestallningState.current().driftmiljo.id) {
          $log.warn('going to parent state');
          $state.go('order');
          return;
        }

        $scope.updateAnslutningarIValdTjanstedoman = function () {
          if ($scope.producentbestallning.driftmiljo && $scope.producentbestallning.tjanstekomponent && $scope.selectedTjanstedoman) {
            var tjanstekomponentId = $scope.producentbestallning.tjanstekomponent.hsaId;
            var driftmiljoId = $scope.producentbestallning.driftmiljo.id;
            var tjanstedomanId = $scope.selectedTjanstedoman.tjansteDomanId;
            AnslutningStatus.getProducentanslutningar(tjanstekomponentId, driftmiljoId, tjanstedomanId).then(function(anslutningar) {
              $scope.anslutningarIValdTjanstedoman = _.map(anslutningar, function (anslutning) {
                anslutning._tjanstedoman = tjanstedomanId; //TODO: handle in factory?
                anslutning._paBestallning = ProducentbestallningState.isAnslutningOnOrder(anslutning);
                return anslutning;
              });
            });
          }
        };

        var _recalculateAnslutningarIValdTjanstedoman = function () {
          var tjanstedomanId = $scope.selectedTjanstedoman.tjansteDomanId;
          $scope.anslutningarIValdTjanstedoman = _.map($scope.anslutningarIValdTjanstedoman, function (anslutning) {
            anslutning._tjanstedoman = tjanstedomanId; //TODO: handle in factory?
            anslutning._paBestallning = ProducentbestallningState.isAnslutningOnOrder(anslutning);
            return anslutning;
          });
        };

        $scope.updateLogiskAdressWithBackendData = function (logiskAdress) {
          if (logiskAdress.hsaId && logiskAdress.hsaId.length) {
            LogicalAddress.getLogicalAddressForHsaId($scope.producentbestallning.driftmiljo.id, logiskAdress.hsaId)
              .then(function (backendLogiskAdress) {
                logiskAdress._backend = true;
                _.assign(logiskAdress, backendLogiskAdress);
              }, function () {
                $log.warn('no logisk adress found for ' + logiskAdress.hsaId);
              });
          }
        };

        $scope.addNewLogiskAdressToAllAnslutningar = function (logiskAdress) {
          if (logiskAdress.hsaId && logiskAdress.hsaId.length) {
            var nyLogiskAdress = _.clone(logiskAdress);
            $scope.updateLogiskAdressWithBackendData(nyLogiskAdress);
            ProducentbestallningState.addLogiskAdressToAllAnslutningar(nyLogiskAdress);
          }
        };

        $scope.addNewLogiskAdressToAnslutning = function (logiskAdress, anslutning) {
          if (logiskAdress.hsaId && logiskAdress.hsaId.length) {
            var nyLogiskAdress = _.clone(logiskAdress);
            $scope.updateLogiskAdressWithBackendData(nyLogiskAdress);
            ProducentbestallningState.addLogiskAdressToAnslutning(nyLogiskAdress, anslutning);
          }
        };

        /**
         * calculate whether the user should be allowed to handle 'anslutningar' in a unified fashion or
         * if she must configure them separately
         * @private
         */
        var _recalculateLogiskaAdresserUnity = function () {
          var nyaLogiskaAdresserIntersection = intersectionFilter(ProducentbestallningState.current().producentanslutningar, 'nyaLogiskaAdresser');
          var befintligaLogiskaAdresserIntersection = intersectionFilter(ProducentbestallningState.current().producentanslutningar, 'befintligaLogiskaAdresser');

          var nyaLogiskaAdresserUnity = _.isUndefined(nyaLogiskaAdresserIntersection);
          if (!nyaLogiskaAdresserUnity) {
            nyaLogiskaAdresserUnity = _.every(_.map(ProducentbestallningState.current().producentanslutningar, 'nyaLogiskaAdresser'), function (laArr) {
              var diff = _.difference(_.map(laArr, 'hsaId'), _.map(nyaLogiskaAdresserIntersection, 'hsaId'));
              return diff.length === 0;
            });
          }
          var befintligaLogiskaAdresserUnity = _.isUndefined(befintligaLogiskaAdresserIntersection);
          if (!befintligaLogiskaAdresserUnity) {
            befintligaLogiskaAdresserUnity = _.every(_.map(ProducentbestallningState.current().producentanslutningar, 'befintligaLogiskaAdresser'), function (laArr) {
              var diff = _.difference(_.map(laArr, 'hsaId'), _.map(befintligaLogiskaAdresserIntersection, 'hsaId'));
              return diff.length === 0;
            });
          }
          var uniq = _.uniq(ProducentbestallningState.current().producentanslutningar, function(anslutning) {
            if (!anslutning.logiskAdressStatuses) {
              return 0;
            } else {
              return anslutning.logiskAdressStatuses.length;
            }
          });
          var mid = (nyaLogiskaAdresserUnity && befintligaLogiskaAdresserUnity && uniq.length === 1);
          $timeout(function () {
            $scope.canHandleLogiskaAdresserInUnity = mid;
          });
        };

        $scope.$on('logisk-adress-added', _.debounce(function () {
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.$on('logisk-adress-removed', _.debounce(function () {
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.$on('anslutning-added', _.debounce(function () {
          _recalculateAnslutningarIValdTjanstedoman();
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.$on('anslutning-removed', _.debounce(function () {
          _recalculateAnslutningarIValdTjanstedoman();
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.updateValdaAnslutningar = function () {
          _.each(_.filter($scope.anslutningarIValdTjanstedoman, '_selected'), function (anslutning) {
            ProducentbestallningState.addAnslutning(anslutning);
            delete anslutning._selected; //deselect in UI
          });
        };

        $scope.$watch('canHandleLogiskaAdresserInUnity', function () {
          if (!$scope.canHandleLogiskaAdresserInUnity) {
            $scope.linkLogicalAddressChoice = 'individualPerAnslutning';
          }
        });

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

            //remove all tjanstekonsumenter/konsumentbestallningar if no nyaLogiskaAdresser are on the order
            if (_.isEmpty(flattenFilter(ProducentbestallningState.current().producentanslutningar, 'nyaLogiskaAdresser'))) {
              if (!_.isEmpty(ProducentbestallningState.current().konsumentbestallningar)) {
                _.each(ProducentbestallningState.current().konsumentbestallningar, function(konsumentbestallning) {
                  ProducentbestallningState.current().removeTjanstekonsument(konsumentbestallning.tjanstekomponent);
                });
              }
            }

            Bestallning.createProducentbestallning(ProducentbestallningState.current(), BestallningState.current()).then(function (status) {
              $log.debug('Status: ' + status);
              if (status === 201) {
                $log.debug('Going to state');
                $state.go('order-confirmation');
              }
            });
          }
        });

        _.assign($scope, {
          addLogiskAdressToAllAnslutningar: ProducentbestallningState.addLogiskAdressToAllAnslutningar,
          addLogiskAdressToAnslutning: ProducentbestallningState.addLogiskAdressToAnslutning,
          canAddLogiskAdressToAllAnslutningar: ProducentbestallningState.canAddLogiskAdressToAllAnslutningar,
          canAddLogiskAdressToAnslutning: ProducentbestallningState.canAddLogiskAdressToAnslutning,
          removeLogiskAdressFromAllAnslutningar: ProducentbestallningState.removeLogiskAdressFromAllAnslutningar,
          removeLogiskAdressFromAnslutning: ProducentbestallningState.removeLogiskAdressFromAnslutning,
          addTjanstekonsumentToOrder: ProducentbestallningState.addTjanstekonsument,
          removeTjanstekonsumentFromOrder: ProducentbestallningState.removeTjanstekonsument,
          removeAnslutningFromOrder: ProducentbestallningState.removeAnslutning,
          getFilteredLogiskaAdresser: LogicalAddress.getFilteredLogicalAddresses
        });

        var _reset = function () {
          $log.debug('--- reset ---');
          _.assign($scope, {
            rivProfiles: rivProfiles,
            canHandleLogiskaAdresserInUnity: true,
            linkLogicalAddressChoice: 'sameForAllAnslutningar',
            orderValid: true,
            sendOrderClicked: false,
            selectedTjanstedoman: undefined,
            anslutningarIValdTjanstedoman: [],
            selectedLogicalAddress: {},
            requestForCallPermissionInSeparateOrder: true
          });
          $scope.$broadcast('show-errors-reset');
        };

        _reset();

        ProducentbestallningState.init().then(function () {
          $scope.producentbestallning = ProducentbestallningState.current();
        });

        $scope.$watch(function () { //watching for changed tjanstekomponent in 'main' Bestallning
          return BestallningState.current().tjanstekomponent;
        }, function (newVal) {
          if (newVal) {
            _reset();
            ProducentbestallningState.setTjanstekomponent(newVal);
            $scope.updateAnslutningarIValdTjanstedoman();
          }
        }, true);

        $scope.$watch(function() {
          return BestallningState.current().namnPaEtjanst;
        }, function(newVal) {
          ProducentbestallningState.setNamnPaEtjanst(newVal);
        });

        $scope.$watch(function () {
          return !!$scope.producentbestallning.tjanstekomponent && !!$scope.producentbestallning.producentanslutningar.length;
        }, function (newVal) {
          BestallningState.setSpecificOrderSatisfied(newVal);
        });

        $scope.$watch(function () {
          return $scope.orderValid;
        }, function (newVal) {
          BestallningState.setSpecificOrderValid(newVal);
        });
      }
    ]
  );
