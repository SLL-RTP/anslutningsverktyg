'use strict';

angular.module('avApp')
  .controller('OrderMainCtrl', ['$scope', '$rootScope', '$state', '$q', '$timeout', 'Tjanstekomponent', 'ServiceDomain', 'environments', 'nat', 'mainOrder',
      function ($scope, $rootScope, $state, $q, $timeout, Tjanstekomponent, ServiceDomain, environments, nat, mainOrder) {
        $scope.order = mainOrder;
        $scope.selectDriftmiljo = function () {
          _reset();
          ServiceDomain.listDomains().then(function (domains) {
            $scope.serviceDomains = domains;
          });
        };

        $scope.selectMode = function(mode) { //trigger child state
          $scope.state = {
            id: mode.stateId
          };
          $state.go(mode.stateId);
        };

        $scope.getFilteredTjanstekomponenter = function(query, removeFromResult) {
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

        $scope.$watch('mep.selectedTjanstekomponent', function (newValue) {
            if (newValue) {
              if (angular.isDefined(newValue.beskrivning)) { //FIXME: fix until backend returns service components also from TAK on this query
                Tjanstekomponent.getTjanstekomponent(newValue.hsaId, $scope.order.driftmiljo.id).then(function (result) {
                  $scope.order.tjanstekomponent = result;
                });
              } else {
                console.log('detected producer from TAK');
                $scope.order.tjanstekomponent = _.clone(newValue);
              }
            }
          }
        );

        $scope.$watch('nat', function() {
          _.each($scope.nat, function(nat) {
            var newNat = _.cloneDeep(nat);
            var natId = {id: newNat.id};
            if (nat._checked) {
              if (!_.find($scope.order.nat, natId)) {
                $scope.order.nat.push(newNat);
              }
            } else {
              _.remove($scope.order.nat, natId);
            }
          });
        }, true);

        var _reset = function() {
          console.info('--- reset ---');
          _.assign($scope, {
            targetEnvironments: environments,
            nat: nat,
            valdaNat: [],
            serviceDomains: [],
            state: {},
            mep: {},
            modes: [ //child states that define the two order modes
              {
                name: 'Producentbeställning',
                stateId: 'order.producent'
              },
              {
                name: 'Konsumentbeställning',
                stateId: 'order.konsument'
              }
            ]
          });
        };

        _reset();
      }
    ]
  );
