'use strict';
angular.module('avApp')
  .factory('LogicalAddress', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
    return {
      getFilteredLogicalAddresses: function(query) {
        var deferred = $q.defer();
        console.log('getFilteredLogicalAddresses query[' + query + ']');
        if (query) {
          var lowerCaseQuery = query.toLowerCase();
          $http.get(configuration.basePath + '/api/logicalAddresses', {
            params: {
              query: lowerCaseQuery
            }
          }).success(function (data) {
            if (angular.isDefined(data)) {
              data = _.map(data, function(logiskAdress) {
                if (logiskAdress.hsaId) {
                  logiskAdress.hsaId = logiskAdress.hsaId.toUpperCase();
                }
                return logiskAdress;
              });
            }
            deferred.resolve(data);
          }).error(function () { //TODO: error handling
            deferred.reject();
          });
        }
        return deferred.promise;
      },
      getLogicalAddressesForEnvironmentAndServiceDomain: function(environmentId, serviceDomainId) {
        var deferred = $q.defer();
        console.log('getLogicalAddressesForEnvironmentAndServiceDomain: environmentId[' + environmentId + '], serviceDomainId[' + serviceDomainId + ']');
        if (environmentId && serviceDomainId) {
          $http.get(configuration.basePath + '/api/serviceComponents/', {
            params: {
              environmentId: environmentId,
              serviceDomainId: serviceDomainId
            }
          }).success(function (data) {
            if (angular.isDefined(data)) {
              data = _.map(data, function(logiskAdress) {
                if (logiskAdress.hsaId) {
                  logiskAdress.hsaId = logiskAdress.hsaId.toUpperCase();
                }
                return logiskAdress;
              });
            }
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
            if (angular.isDefined(data)) {
              data = _.map(data, function(logiskAdress) {
                if (logiskAdress.hsaId) {
                  logiskAdress.hsaId = logiskAdress.hsaId.toUpperCase();
                }
                return logiskAdress;
              });
            }
          deferred.resolve(data);
        }).error(function () { //TODO: error handling
          deferred.reject();
        });
        return deferred.promise;
      }
    };
  }]);