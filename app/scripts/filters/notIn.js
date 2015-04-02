'use strict';

angular.module('avApp')
  .filter('notIn', function() {
    return function(collection, otherCollection, id) {
      return _.filter(collection, function(collectionValue) {
        return !_.find(otherCollection, function(otherCollectionValue) {
          return collectionValue[id] === otherCollectionValue[id];
        });
      });
    };
  });
