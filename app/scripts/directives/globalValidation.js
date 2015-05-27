'use strict';

angular.module('avApp')
  .directive('globalValidation', ['$interpolate',function ($interpolate) {
    return {
      require: '^form',
      priority: 9999,
      restrict: 'A',
      compile: function() {
        return function ($scope, $element, $attrs, formController) {
          var inputElement = $element[0].querySelector('.form-control[name]');
          var angularInputElement = angular.element(inputElement);
          var inputName = $interpolate(angularInputElement.attr('name') || '')($scope);
          var blurred = false;
          angularInputElement.bind('blur', function() {
            blurred = true;
            if (formController[inputName].$invalid) {
              toggleClasses(true);
              $scope.$emit('gv-leaving-element-invalid');
            } else {
              toggleClasses(false);
              $scope.$emit('gv-leaving-element-valid');
            }
          });
          angularInputElement.bind('focus', function() {
            blurred = false;
          });
          $scope.$watch(function() {
            return formController[inputName] && formController[inputName].$invalid;
          }, function(invalid) {
            if (invalid) {
              toggleClasses(true);
              if (blurred) {
                $scope.$emit('gv-element-invalid');
              } else if (formController[inputName].$dirty) {
                $scope.$emit('gv-element-invalid-in-focus');
              }
            } else {
              toggleClasses(false);
              if (blurred) {
                $scope.$emit('gv-element-valid');
              } else if (formController[inputName].$dirty) {
                $scope.$emit('gv-element-valid-in-focus');
              }
            }
          });
          var toggleClasses = function(invalid) {
            $element.toggleClass('gv-invalid', invalid);
          };
        };
      }
    };
  }]);
