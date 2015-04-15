'use strict';

angular.module('avApp')
  .directive('personkontakt', function() {
    return {
      restrict: 'E',
      templateUrl: 'templates/personkontakt.html',
      scope: {
        kontakt: '='
      }
    };
  });
