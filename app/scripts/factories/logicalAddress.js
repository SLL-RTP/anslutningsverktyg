'use strict';
angular.module('avApp')
  .factory('LogicalAddress', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
    return {
      getFilteredLogicalAddresses: function(query, environmentId) {
        var deferred = $q.defer();
        console.log('getFilteredLogicalAddresses query[' + query + ']');
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
      getConnectedLogicalAddressesForContract: function(serviceComponentId, environmentId, serviceContractId, majorVersion, minorVersion) {
        console.log('getConnectedLogicalAddressesForContract: serviceComponentId[' + serviceComponentId + '], environmentId[' + environmentId + '], serviceContractId[' + serviceContractId + '], majorVersion[' + majorVersion + '], minorVersion[' + minorVersion + ']');
        var deferred = $q.defer();
        $http.get(configuration.basePath + '/api/serviceComponents/' + serviceComponentId + '/' + environmentId + '/' + serviceContractId + '/' + majorVersion + '/' + minorVersion + '/logicalAddresses')
          .success(function (data) {
            console.log(data);
          deferred.resolve(data);
        }).error(function () { //TODO: error handling
          deferred.reject();
        });
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
          console.warn('no logisk adress found for ' + hsaId);
          deferred.reject();
        });
        return deferred.promise;
      }
    };
  }]);
