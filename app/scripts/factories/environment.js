'use strict';

angular.module('avApp')
  .factory('Environment', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
    return {
      getAvailableEnvironments: function() {
        var deferred = $q.defer(); //forcing the use of a promise to set the interface for later
        $http.get(configuration.basePath + '/api/driftmiljos').success(function(data) {
          deferred.resolve(data);
        }).error(function () { //TODO: error handling
          deferred.reject();
        });
        return deferred.promise;
      }
    };
  }]);
