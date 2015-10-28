'use strict';
angular.module('avApp')
  .factory('ServiceDomain', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      return {
        listDomains: function () {
          var deferred = $q.defer();
          $http.get(configuration.basePath + '/api/serviceDomains').success(function(data) {
            deferred.resolve(data);
          }).error(function() { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };
    }]);
