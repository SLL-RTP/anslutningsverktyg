'use strict';

angular.module('avApp')
  .filter('flatten', function() {
    return function (collection, nameOfSubCollection) {
      return _.chain(collection).pluck(nameOfSubCollection).flatten().filter(function (val) {
        return !_.isUndefined(val);
      }).values().value();
    };
  });
