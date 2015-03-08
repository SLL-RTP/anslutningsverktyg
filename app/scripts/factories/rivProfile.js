'use strict';

angular.module('avApp')
  .factory('RivProfile', ['$q',
    function ($q) {
    return {
      getAvailableProfiles: function() {
        var deferred = $q.defer();
        deferred.resolve([
          'RIVTABP20',
          'RIVTABP21'
        ]);
        return deferred.promise;
      }
    };
  }]);
