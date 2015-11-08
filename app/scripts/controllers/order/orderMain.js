'use strict';

angular.module('avApp')
  .controller('OrderMainCtrl', ['$scope', '$state', '$q', '$translate', '$log', 'Tjanstekomponent', 'BestallningState', 'ServiceDomain', 'environments', 'mainOrder',
      function ($scope, $state, $q, $translate, $log, Tjanstekomponent, BestallningState, ServiceDomain, environments, mainOrder) {
        $scope.modes = [ //child states that define the two order modes
          {
            name: $translate.instant('order.main.komponent_panel.mode.order.producent'),
            stateId: 'order.producent'
          },
          {
            name: $translate.instant('order.main.komponent_panel.mode.order.konsument'),
            stateId: 'order.konsument'
          }
        ];
        $scope.order = mainOrder;
        $scope.selectDriftmiljo = function () {
          _reset();
          ServiceDomain.listDomains().then(function (domains) {
            $scope.serviceDomains = domains;
          });
        };

        $scope.$watch('selectedMode.stateId', function(newValue) { //trigger child state
          if (!newValue) return;
          $scope.state = {
            id: newValue
          };
          _.assign($scope, {
            mep: {}
          });
          $scope.order.tjanstekomponent = {};
          $state.go(newValue);
        });

        $scope.getFilteredTjanstekomponenter = function (query, removeFromResult) {
          var deferred = $q.defer();
          if (!_.isEmpty(query)) {
            Tjanstekomponent.getFilteredTjanstekomponenter(query, $scope.order.driftmiljo.id).then(function (result) {
              if (!removeFromResult) {
                deferred.resolve(result);
              } else {
                deferred.resolve(_.filter(result, function (tjanstekomponent) {
                  return removeFromResult.hsaId !== tjanstekomponent.hsaId;
                }));
              }
            });
          } else {
            deferred.resolve();
          }
          return deferred.promise;
        };

        $scope.triggerSendOrder = function () {
          $scope.$broadcast('send-order');
        };

        $scope.$watch('mep.selectedTjanstekomponent', function (newValue) {
            if (newValue) {
              if (angular.isDefined(newValue.beskrivning)) { //FIXME: fix until backend returns service components also from TAK on this query
                Tjanstekomponent.getTjanstekomponent(newValue.hsaId, $scope.order.driftmiljo.id).then(function (result) {
                  $scope.order.tjanstekomponent = result;
                });
              } else {
                $log.debug('detected producer from TAK');
                $scope.order.tjanstekomponent = _.clone(newValue);
              }
              delete $scope.order.namnPaEtjanst;
            }
          }
        );

        $scope.$watch(function () {
          return BestallningState.specificOrderSatisfied();
        }, function (newVal) {
          $scope.displayCommonEnding = newVal;
        });

        $scope.$watch(function () {
          return BestallningState.specificOrderValid();
        }, function (newVal) {
          $scope.orderValid = newVal;
        });

        var _reset = function () {
          $log.debug('--- reset (main) ---');
          if ($scope.modeForm) {
            $scope.modeForm.$setPristine();
          }
          _.assign($scope, {
            targetEnvironments: environments,
            serviceDomains: [],
            state: {},
            mep: {},
            displayCommonEnding: false,
            orderValid: false,
            selectedMode: {}
          });
          $scope.order.tjanstekomponent = {};
        };
        _reset();
      }
    ]
  );
