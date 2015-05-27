'use strict';

angular.module('avApp')
  .directive('funktionkontakt', function() {
    return {
      restrict: 'E',
      templateUrl: 'templates/funktionkontakt.html',
      scope: {
        kontakt: '='
      }
    };
  });
