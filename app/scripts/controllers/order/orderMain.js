'use strict';

angular.module('avApp')
  .controller('OrderMainCtrl', ['$scope', '$state', '$q', '$timeout', '$translate', '$log', 'Tjanstekomponent', 'BestallningState', 'ServiceDomain', 'environments', 'mainOrder',
      function ($scope, $state, $q, $timeout, $translate, $log, Tjanstekomponent, BestallningState, ServiceDomain, environments, mainOrder) {

        $scope.order = mainOrder;
        $scope.selectDriftmiljo = function () {
          _reset();
          ServiceDomain.listDomains().then(function (domains) {
            $scope.serviceDomains = domains;
          });
        };

        /**
         * isEmptyIndicator must be null or an object. If the search result is empty,
         * the empty property of the isEmptyIndicator object will be set to true, otherwise false
         */
        $scope.getFilteredTjanstekomponenter = function (query, isEmptyIndicator, removeFromResult) {
          var deferred = $q.defer();
          if (!_.isEmpty(query)) {
            Tjanstekomponent.getFilteredTjanstekomponenter(query, $scope.order.driftmiljo.id).then(function (result) {
              if (!removeFromResult) {
                if (isEmptyIndicator !== null) {
                  isEmptyIndicator.empty = !result.length;
                }
                deferred.resolve(result);
              } else {
                var filteredResult = _.filter(result, function (tjanstekomponent) {
                  return removeFromResult.hsaId !== tjanstekomponent.hsaId;
                });
                if (isEmptyIndicator !== null) {
                  isEmptyIndicator.empty = !filteredResult.length;
                }
                deferred.resolve(filteredResult);
              }
            });
          } else {
            if (isEmptyIndicator !== null) {
              isEmptyIndicator.empty = false; //when search string is empty, do not say result is empty
            }
            deferred.resolve();
          }
          return deferred.promise;
        };

        $scope.triggerSendOrder = function () {
          $scope.$broadcast('send-order');
        };

        $scope.$watch('mep.selectedTjanstekomponent', function (newValue) {
            if (newValue) {
              Tjanstekomponent.getTjanstekomponent(newValue.hsaId, $scope.order.driftmiljo.id).then(function (result) {
                $scope.order.tjanstekomponent = result;
                $scope.currentServiceComponentDriftmiljo = {};
                if (result.serviceComponentDriftmiljos && result.serviceComponentDriftmiljos.length) {
                  var env = _.find(result.serviceComponentDriftmiljos, function(env) {
                    return env.driftmiljo.id === $scope.order.driftmiljo.id;
                  });
                  $scope.currentServiceComponentDriftmiljo = env;
                }
              });
            } else {
              $scope.order.tjanstekomponent = {};
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

        $scope.resetMain = function() {
          _reset();
        };

        var _reset = function () {
          $log.debug('--- reset (main) ---');
          if ($scope.modeForm) {
            $scope.modeForm.$setPristine();
          }
          _.assign($scope, {
            targetEnvironments: environments,
            serviceDomains: [],
            state: {},
            mep: {
              selectedTjanstekomponent: ''
            },
            displayCommonEnding: false,
            orderValid: true,
            selectedMode: {},
            currentServiceComponentDriftmiljo: {}
          });
          $scope.order.tjanstekomponent = {};
          $scope.mainComponentSearchEmpty = {empty: false}; //_.assign does not work with this one ;()
        };
        _reset();
      }
    ]
  );
