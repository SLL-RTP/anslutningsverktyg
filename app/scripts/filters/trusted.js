'use strict';

angular.module('avApp')
  .filter('trusted', ['$sce', function($sce){
    return function(text) {
      return $sce.trustAsHtml(text);
    };
  }]);
