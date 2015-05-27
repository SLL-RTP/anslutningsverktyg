'use strict';
angular.module('avApp')
  .factory('ServiceDomain', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      return {
        listDomains: function () {
          console.log('listDomains');
          var deferred = $q.defer();
          $http.get(configuration.basePath + '/api/serviceDomains').success(function(data) {
            console.log(data);
            deferred.resolve(data);
          }).error(function() { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };
    }]);
