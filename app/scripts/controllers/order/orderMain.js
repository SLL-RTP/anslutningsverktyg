'use strict';

angular.module('avApp')
  .controller('OrderMainCtrl', ['$scope', '$state', '$q', '$translate', '$log', 'Tjanstekomponent', 'BestallningState', 'ServiceDomain', 'environments', 'mainOrder',
      function ($scope, $state, $q, $translate, $log, Tjanstekomponent, BestallningState, ServiceDomain, environments, mainOrder) {
        $scope.order = mainOrder;
        $scope.selectDriftmiljo = function () {
          _reset();
          ServiceDomain.listDomains().then(function (domains) {
            $scope.serviceDomains = domains;
          });
        };

        $scope.selectMode = function (mode) { //trigger child state
          $scope.state = {
            id: mode.stateId
          };
          _.assign($scope, {
            mep: {}
          });
          $scope.order.tjanstekomponent = {};
          $state.go(mode.stateId);
        };

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
          $log.debug('--- reset ---');
          _.assign($scope, {
            targetEnvironments: environments,
            serviceDomains: [],
            state: {},
            mep: {},
            modes: [ //child states that define the two order modes
              {
                name: $translate.instant('order.main.order_type_panel.mode.order.producent'),
                stateId: 'order.producent'
              },
              {
                name: $translate.instant('order.main.order_type_panel.mode.order.konsument'),
                stateId: 'order.konsument'
              }
            ],
            displayCommonEnding: false,
            orderValid: false
          });
          $scope.order.tjanstekomponent = {};
        };

        _reset();
      }
    ]
  );
