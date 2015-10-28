'use strict';
angular.module('avApp')
  .factory('LogicalAddress', ['$q', '$http', '$log', 'configuration',
    function ($q, $http, $log, configuration) {
    return {
      getFilteredLogicalAddresses: function(query, environmentId) {
        var deferred = $q.defer();
        $log.debug('getFilteredLogicalAddresses query[' + query + ']');
        if (query) {
          var lowerCaseQuery = query.toLowerCase();
          $http.get(configuration.basePath + '/api/logicalAddresses', {
            params: {
              query: lowerCaseQuery,
              environmentId: environmentId
            }
          }).success(function (data) {
            deferred.resolve(data);
          }).error(function () { //TODO: error handling
            deferred.reject();
          });
        }
        return deferred.promise;
      },
      getLogicalAddressForHsaId: function(environmentId, hsaId) {
        var deferred = $q.defer();
        $http.get(configuration.basePath + '/api/logicalAddresses/' + hsaId, {
          params: {
            environmentId: environmentId
          }
        }).success(function(data) {
          deferred.resolve(data);
        }).error(function() {
          $log.warn('no logisk adress found for ' + hsaId);
          deferred.reject();
        });
        return deferred.promise;
      }
    };
  }]);
