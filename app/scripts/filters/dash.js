'use strict';

angular.module('avApp')
  .filter('dash', function() {
    return function (input) {
      if(input !== undefined && input !== null) {
        if ((typeof input === 'string' || input instanceof String) && input === '') {
          return '-';
        }
        return input;
      } else {
        return '-';
      }
    };
  });
