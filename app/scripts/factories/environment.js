'use strict';

angular.module('avApp')
  .factory('Environment', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      var _environments = null;

      var getEnvironments = function() {
          var deferred = $q.defer();
          if (!_environments) {
            $http.get(configuration.basePath + '/api/driftmiljos').success(function(data) {
              _environments = data;
              deferred.resolve(_environments);
            }).error(function () {
              deferred.reject();
            });
          } else {
            deferred.resolve(_environments);
          }
          return deferred.promise;
        }; 

      return {
        getAvailableEnvironments: _.once(getEnvironments)
      };
  }]);
