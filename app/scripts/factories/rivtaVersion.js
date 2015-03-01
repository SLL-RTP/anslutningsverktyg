'use strict';

angular.module('avApp')
  .factory('RivtaVersion', ['$q',
    function ($q) {
    return {
      getAvailableVersions: function() {
        var deferred = $q.defer();
        var data = [
          {
            id: 'RIVTABP20',
            name: 'RIVTABP20'
          },
          {
            id: 'RIVTABP21',
            name: 'RIVTABP21'
          }
        ];
        deferred.resolve(data);
        return deferred.promise;
      }
    };
  }]);
