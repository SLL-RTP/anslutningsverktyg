'use strict';

angular.module('avApp')
  .filter('intersection', function() {
    return function(collection, nameOfSubCollection) {
      if (collection.length === 0) return [];
      var arrays = _.map(collection, nameOfSubCollection);
      var first = _.first(arrays);
      if (arrays.length === 1) {
        return first;
      }
      var rest = _.rest(arrays);
      return _.filter(first, function(val) {
        var tmp = [];
        _.each(rest, function(arr) {
          var match = _.first(_.filter(arr, function(comparison) {
            return angular.equals(val, comparison); //need the angular version since it handles the angular $$hashKey's
          }));
          if (match) {
            tmp.push(match);
          }
        });
        return tmp.length === rest.length;
      });
    };
  });
