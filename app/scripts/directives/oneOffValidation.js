'use strict';

angular.module('avApp')
  .directive('oneOffValidation', function () {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {
        validationMethod: '&oneOffValidation',
        validationProperty: '@oneOffValidationProperty'
      },
      link: function($scope, $element, $attr, ngModelController) {
        var handler = $scope.validationMethod();
        var validationProp = $scope.validationProperty;
        $scope.$watch(function () {
          return ngModelController.$modelValue;
        }, _.throttle(function(value) {
          if (!_.isUndefined(value)) {
            handler(value).then(function() {
              ngModelController.$setValidity(validationProp, true);
            }, function() {
              ngModelController.$setValidity(validationProp, false);
            });
          } else {
            ngModelController.$setValidity(validationProp, true);
          }
        }, 500));

        $element.bind('blur', function() {
          var value = ngModelController.$modelValue;
          if (!_.isUndefined(value)) {
            handler(value).then(function() {
              ngModelController.$setValidity(validationProp, true);
            }, function() {
              ngModelController.$setValidity(validationProp, false);
            });
          }
        });
      }
    };
  });
