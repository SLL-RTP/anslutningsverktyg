'use strict';

angular.module('avApp')
  .factory('Nat', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      return {
        getNat: function() {
          var deferred = $q.defer();
          $http.get(configuration.basePath + '/api/nat').success(function(data) {
            deferred.resolve(data);
          }).error(function () { //TODO: error handling
            deferred.reject();
          });
          return deferred.promise;
        }
      };
    }]);
