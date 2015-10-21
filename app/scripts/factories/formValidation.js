'use strict';
angular.module('avApp')
  .factory('FormValidation', ['$rootScope',
    function ($rootScope) {

      var validateForms = function () {
        $rootScope.$broadcast('show-errors-check-validity');
        //Get all divs with class form-group, since it is these that show the
        //has-success or has-error classes
        var formGroupElements = document.querySelectorAll('.form-group');
        return !_.any(formGroupElements, function (formGroup) {
            return angular.element(formGroup).hasClass('has-error');
          }
        );
      };

      var checkGlobalValidation = function () {
        var formGroupElements = document.querySelectorAll('.form-group.gv-invalid');
        return formGroupElements.length === 0;
      };

      return {
        validateForms: validateForms,
        checkGlobalValidation: checkGlobalValidation
      };
    }]);
