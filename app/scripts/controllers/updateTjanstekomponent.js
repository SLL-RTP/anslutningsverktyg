'use strict';

angular.module('avApp')
  .controller('UpdateTjanstekomponentCtrl', ['$scope', '$q', '$state', 'Tjanstekomponent', 'nat',
    function ($scope, $q, $state, Tjanstekomponent, nat) {
      $scope.$watch('createNew', function(newTjanstekomponent) {
        console.log('newTjanstekomponent: ' + newTjanstekomponent);
        $scope.tjanstekomponentForm.$setPristine();
        $scope.tjanstekomponentForm.$setValidity();
        $scope.$broadcast('show-errors-reset');
        $scope.tjanstekomponentValid = true;
        $scope.updateClicked = false;
        $scope.displayNatError = false;
        $scope.nat = _.cloneDeep(nat);
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
          Tjanstekomponent.getTjanstekomponent(newTjanstekomponent.hsaId).then(function (result) {
            $scope.tjanstekomponentValid = true;
            $scope.updateClicked = false;
            $scope.displayNatError = false;
            if (_.isUndefined(result.nat) || _.isNull(result.nat)) {
              result.nat = [];
            }
            $scope.tjanstekomponent = result;
          });
        }
      });

      $scope.selectNat = function(nat) {
        if (nat && nat.id) {
          $scope.tjanstekomponent.nat = nat;
        }
        _triggerNatError();
        _recheckOrderValidity();
      };

      $scope.updateTjanstekomponent = function () {
        $scope.updateClicked = true;
        _triggerNatError();
        if (!_validateForms() || !_checkNatValidation()) {
          $scope.tjanstekomponentValid = false;
        } else {
          $scope.tjanstekomponentValid = true;
          console.log($scope.tjanstekomponent);
          var newForDb = $scope.createNew || _.isUndefined($scope.tjanstekomponent.id) || _.isNull($scope.tjanstekomponent.id);
          Tjanstekomponent.updateTjanstekomponent($scope.tjanstekomponent, newForDb).then(function(status) {
            if (Math.floor(status/100) === 2) { //some 200 status
              reset();
              $state.go('updateTjanstekomponentConfirmation');
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

      var _triggerNatError = function() {
        $scope.displayNatError = !_checkNatValidation() && $scope.updateClicked;
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
        return formGroupElements.length === 0;
      };

      var _checkGlobalValidation = function() {
        var formGroupElements = document.querySelectorAll('.form-group.gv-invalid');
        return formGroupElements.length === 0;
      };

      var _checkNatValidation = function() {
        return !!($scope.tjanstekomponent.nat && $scope.tjanstekomponent.nat.id);
      };

      var reset = function() {
        $scope.tjanstekomponentValid = true;
        $scope.updateClicked = false;
        $scope.createNew = true;
        $scope.displayNatError = false;
        if ($scope.tjanstekomponentForm) {
          $scope.tjanstekomponentForm.$setPristine();
          $scope.tjanstekomponentForm.$setValidity();
        }
        $scope.tjanstekomponent = {
          nat: []
        };
        $scope.$broadcast('show-errors-reset');
        $scope.nat = _.cloneDeep(nat);
      };

      reset();

    }
  ]
);
