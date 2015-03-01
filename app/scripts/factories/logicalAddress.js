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
          $http.get(configuration.apiHost + '/anslutningsplattform/api/logicalAddresses', {
            params: {
              query: lowerCaseQuery
            }
          }).success(function (data) {
            deferred.resolve(data);
          }).error(function (data, status, headers) { //TODO: error handling
            deferred.reject();
          });
        }
        return deferred.promise;
      },
      getLogicalAddressesForEnvironmentAndServiceDomain: function(environmentId, serviceDomainId) {
        var deferred = $q.defer();
        console.log('getLogicalAddressesForEnvironmentAndServiceDomain: environmentId[' + environmentId + '], serviceDomainId[' + serviceDomainId + ']');
        if (environmentId && serviceDomainId) {
          $http.get(configuration.apiHost + '/anslutningsplattform/api/logicalAddresses', {
            params: {
              environmentId: environmentId,
              serviceDomainId: serviceDomainId
            }
          }).success(function (data) {
            deferred.resolve(data);
          }).error(function (data, status, headers) { //TODO: error handling
            deferred.reject();
          });
        }
        return deferred.promise;
      },
      getConnectedLogicalAddresses: function(serviceComponentId, environmentId, serviceContractIds) {
        var deferred = $q.defer();
        console.log('getConnectedLogicalAddresses: serviceComponentId[' + serviceComponentId + '], environmentId[' + environmentId + '], serviceContractIds[' + serviceContractIds + ']');
        deferred.resolve([
          /*
           SE2321000016-14LP [VE: SLL - Liljeholmens barnmor]
           SE2321000016-14JZ [VE: SLL - Tyresö Barnmorskemot]
           SE2321000016-161G [VE: SLL - Bromma Barnmorskemot]
           SE2321000016-15TL [VE: SLL - Gullmarsplans barnmo]
           SE2321000016-3LV7 [VE: SLL - Prima Liv MVC Dander]
           SE2321000016-7DKW [VE: SLL - Ekens Barnmorskor/Sö]
           SE2321000016-1085 [VE: SLL - BB Stockholm Family ]
           SE2321000016-15TN [VE: SLL - Farsta barnmorskemot]
           */
          {
            namn: 'SLL - Liljeholmens barnmorskemottagning',
            hsaId: 'SE2321000016-14LP'
          },
          {
            namn: 'SLL - Tyresö Barnmorskemottagning',
            hsaId: 'SE2321000016-14JZ'
          },
          {
            namn: 'SLL - Bromma Barnmorskemottagning',
            hsaId: 'SE2321000016-161G'
          },
          {
            namn: 'SLL - Gullmarsplans barnmorskemottagning',
            hsaId: 'SE2321000016-15TL'
          },
          {
            namn: 'SLL - Prima Liv MVC Danderyd',
            hsaId: 'SE2321000016-3LV7'
          },
          {
            namn: 'SLL - Ekens Barnmorskor/Sö',
            hsaId: 'SE2321000016-7DKW'
          },
          {
            namn: 'SLL - BB Stockholm Family',
            hsaId: 'SE2321000016-1085'
          },
          {
            namn: 'SLL - Farsta barnmorskemot',
            hsaId: 'SE2321000016-15TN'
          }
        ]);

        return deferred.promise;
      }
    };
  }]);
