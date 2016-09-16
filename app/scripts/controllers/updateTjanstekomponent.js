'use strict';

angular.module('avApp')
  .controller('UpdateTjanstekomponentCtrl', ['$scope', '$q', '$state', 'Tjanstekomponent', 'environments', 'nets',
    function ($scope, $q, $state, Tjanstekomponent, environments, nets) {
      $scope.$watch('createNew', function(newTjanstekomponent) {
        console.log('newTjanstekomponent: ' + newTjanstekomponent);
        $scope.tjanstekomponentForm.$setPristine();
        $scope.tjanstekomponentForm.$setValidity();
        $scope.$broadcast('show-errors-reset');
        $scope.selectedEnvironment = {};
        $scope.selectableEnvironments = _.map(environments, function(env) {
          return {
            driftmiljo: env
          };
        });
        $scope.activeEnvironments = [];
        $scope.natForEnvironment = _.clone(nets);
        $scope.tjanstekomponentValid = true;
        $scope.updateClicked = false;
        $scope.displayNatError = false;
        $scope.environments = _.cloneDeep(environments);
        $scope.selectedNat = {};
        $scope.tjanstekomponent = {};
        $scope.selectedTjanstekomponent = null;
      });

      $scope.getFilteredTjanstekomponenter = function(query) {
        var deferred = $q.defer();
        if (!_.isEmpty(query)) {
          Tjanstekomponent.getFilteredTjanstekomponenter(query).then(function (result) {
            deferred.resolve(result);
          });
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };

      $scope.$watch('selectedTjanstekomponent', function(newTjanstekomponent) {
        if (newTjanstekomponent && newTjanstekomponent.hsaId) {
          $scope.selectedNat = {};
          $scope.activeEnvironments = [];
          $scope.natError = {};
          Tjanstekomponent.getTjanstekomponent(newTjanstekomponent.hsaId).then(function (result) {
            $scope.tjanstekomponentValid = true;
            $scope.updateClicked = false;
            $scope.displayNatError = false;
            $scope.tjanstekomponent = result;
            console.log(result);
            if (_.isArray(result.serviceComponentDriftmiljos)) {
              _.each(result.serviceComponentDriftmiljos, function(env) {
                $scope.addEnvironment(env);
              });
            }
          });
        }
      });

      $scope.activeEnvironmentFilter = function() {
        return function(environment) {
          if (environment.driftmiljo) {
            for (var i = 0; i < $scope.activeEnvironments.length; i += 1) {
              if ($scope.activeEnvironments[i].driftmiljo.id === environment.driftmiljo.id) {
                return false;
              }
            }
          }
          return true;
        };
      };

      $scope.updateTjanstekomponent = function () {
        $scope.updateClicked = true;
        _natValidation();
        if (!_validateForms() || !_checkNatValidation()) {
          $scope.tjanstekomponentValid = false;
        } else {
          $scope.tjanstekomponentValid = true;
          var tjk = _.cloneDeep($scope.tjanstekomponent);
          tjk.serviceComponentDriftmiljos = _.cloneDeep($scope.activeEnvironments);
          var newForDb = $scope.createNew || _.isUndefined(tjk.id) || _.isNull(tjk.id);
          $scope.disableSubmitButton = true;
          Tjanstekomponent.updateTjanstekomponent(tjk, newForDb).then(function(statusObj) {
            if (Math.floor(statusObj.status/100) === 2) { //some 200 status
              reset();
              if (statusObj.action === 'none') { //regular confirm
                $state.go('updateTjanstekomponentConfirmation');
              } else { //'email' confirm
                $state.go('updateTjanstekomponentConfirmationWithEmail');
              }
            }
          });
        }
      };

      $scope.checkHsaIdUnique = function(hsaId) {
        var deferred = $q.defer();
        Tjanstekomponent.getTjanstekomponent(hsaId).then(function(tjanstekomponent) {
          if (_.isUndefined(tjanstekomponent.hsaId) || tjanstekomponent.hsaId === null || tjanstekomponent.hsaId !== hsaId) { //backend might perform freetext search and return non-matching tjanstekomponent
            deferred.resolve();
          } else {
            deferred.reject();
          }
        }, function() {
          deferred.resolve();
        });
        return deferred.promise;
      };

      $scope.addEnvironment = function(env) {
        if (env && env.driftmiljo) {
          $scope.activeEnvironments.push(env);
          $scope.selectedEnvironment = {};
          if (env.nat && env.nat.id) { 
            //set 'same' nat but other object to make ng-model work with an existing nat
            //so that it is checked in UI
            env.nat = _.find($scope.natForEnvironment[env.driftmiljo.id], {id: env.nat.id});
          }
        }
      }

      $scope.removeEnvironment = function(envId) {
        if (envId) {
          _.remove($scope.activeEnvironments, function(env) {
            return envId === env.driftmiljo.id;
          });
        }
      };

      $scope.addSelectedEnvironment = function() {
        console.info('addSelectedEnvironment');
        console.log($scope.selectedEnvironment);
        if ($scope.selectedEnvironment && $scope.selectedEnvironment.id) {
          $scope.activeEnvironments.push({
            driftmiljo: $scope.selectedEnvironment
          });
          _.remove($scope.selectableEnvironments, function(environment) {
            return environment.id === $scope.selectedEnvironment.id;
          });
          $scope.natForEnvironment[$scope.selectedEnvironment.id] = [
            {
              id: 'internet',
              namn: 'Internet'
            },
            {
              id: 'sjunet',
              namn: 'Sjunet'
            },
            {
              id: 'regional',
              namn: 'Regionalt nät'
            }
          ];
          $scope.selectedEnvironment = {};
        }
      };

      $scope.selectNatForEnvironment = function(nat, environmentId) {
        _natValidation();
        _recheckOrderValidity();
      };

      var _triggerNatError = function() {
        _natValidation();
      };

      function _recheckOrderValidity() {
        if ($scope.updateClicked) {
          $scope.tjanstekomponentValid = _checkGlobalValidation() && _checkNatValidation();
        }
      }

      $scope.$on('gv-leaving-element-invalid', _recheckOrderValidity);
      $scope.$on('gv-leaving-element-valid', _recheckOrderValidity);
      $scope.$on('gv-element-invalid', _recheckOrderValidity);
      $scope.$on('gv-element-invalid-in-focus', _recheckOrderValidity);
      $scope.$on('gv-element-valid', _recheckOrderValidity);
      $scope.$on('gv-element-valid-in-focus', _recheckOrderValidity);

      var _validateForms = function () {
        $scope.$broadcast('show-errors-check-validity');
        var formGroupElements = document.querySelectorAll('.form-group.has-error');
        var error = formGroupElements.length === 0;
        console.log('_validateForms error', !error);
        return error;
      };

      var _checkGlobalValidation = function() {
        var formGroupElements = document.querySelectorAll('.form-group.gv-invalid');
        var error = formGroupElements.length === 0;
        console.log('_checkGlobalValidation error', !error);
        return error;
      };

      var _checkNatValidation = function() {
        var error = _.keys($scope.natError).length === 0;
        console.log('_checkNatValidation error', !error);
        return error;
      };

      var _natValidation = function() {
        $scope.natError = {};
        _.each($scope.activeEnvironments, function(environment) {
          if (!environment.nat) {
            $scope.natError[environment.driftmiljo.id] = true;
          }
        });
      };

      var reset = function() {
        $scope.tjanstekomponentValid = true;
        $scope.updateClicked = false;
        $scope.createNew = true;
        $scope.displayNatError = false;
        $scope.selectedNat = {};
        if ($scope.tjanstekomponentForm) {
          $scope.tjanstekomponentForm.$setPristine();
          $scope.tjanstekomponentForm.$setValidity();
        }
        $scope.tjanstekomponent = {
        };
        $scope.$broadcast('show-errors-reset');
        $scope.selectedEnvironment = {};
        $scope.selectableEnvironments = _.map(environments, function(env) {
          return {
            driftmiljo: env
          };
        });
        $scope.activeEnvironments = [];
        // $scope.natForEnvironment = _.clone(nets);
        $scope.natError = {};
        // $scope.nat = _.cloneDeep(nat);
      };

      reset();

    }
  ]
);
