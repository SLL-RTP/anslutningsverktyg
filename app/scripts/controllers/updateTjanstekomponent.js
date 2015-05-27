'use strict';

angular.module('avApp')
  .controller('UpdateTjanstekomponentCtrl', ['$scope', '$q', '$state', 'Tjanstekomponent',
    function ($scope, $q, $state, Tjanstekomponent) {

      $scope.$watch('createNew', function(newTjanstekomponent) {
        console.log('newTjanstekomponent: ' + newTjanstekomponent);
        $scope.tjanstekomponentForm.$setPristine();
        $scope.tjanstekomponentForm.$setValidity();
        $scope.$broadcast('show-errors-reset');
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
          Tjanstekomponent.getTjanstekomponent(newTjanstekomponent.hsaId).then(function (result) {
            $scope.tjanstekomponent = result;
          });
        }
      });

      $scope.updateTjanstekomponent = function () {
        $scope.updateClicked = true;
        if (!_validateForms()) {
          $scope.tjanstekomponentValid = false;
        } else {
          $scope.tjanstekomponentValid = true;
          console.log($scope.tjanstekomponent);
          var newForDb = $scope.createNew || _.isUndefined($scope.tjanstekomponent.id) || _.isNull($scope.tjanstekomponent.id);
          Tjanstekomponent.updateTjanstekomponent($scope.tjanstekomponent, newForDb).then(function(status) {
            console.log('status: ' + status);
            if (Math.floor(status/100) === 2) { //some 200 status
              reset();
              $state.go('updateTjanstekomponentConfirmation');
            }
          });
        }
      };

      $scope.checkHsaIdUnique = function(hsaId) {
        hsaId = hsaId.toUpperCase();
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

      function _recheckOrderValidity() {
        if ($scope.updateClicked) {
          $scope.tjanstekomponentValid = _checkGlobalValidation();
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

      var reset = function() {
        $scope.tjanstekomponentValid = true;
        $scope.updateClicked = false;
        $scope.createNew = true;
      };

      reset();

    }
  ]
);
