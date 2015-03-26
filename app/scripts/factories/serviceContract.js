'use strict';
angular.module('avApp')
  .factory('ServiceContract', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      var serviceContractFactory = {
        listContracts: function (serviceComponentId, environmentId, serviceDomainId) {
          console.log('serviceComponentId: ' + serviceComponentId + ', environmentId: ' + environmentId + ', serviceDomainId: ' + serviceDomainId);
          var deferred = $q.defer();
          $http.get(configuration.basePath + '/api/serviceContracts', {
            params: {
              hsaId: serviceComponentId,
              environmentId: environmentId,
              serviceDomainId: serviceDomainId
            }
          }).success(function (data) {
            var serviceContracts = _.map(data, function (serviceContract) {
              serviceContract.serviceDomainId = serviceDomainId;
              //return serviceContract;
              return _mockInstalledStatus(serviceContract);
            });
            deferred.resolve(serviceContracts);
          }).error(function (data, status, headers) { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };

      var _mockInstalledStatus = function(serviceContract) {
        if (!!Math.floor(Math.random() * 2)) {
          serviceContract.installedInEnvironment = true;
          serviceContract.installedForProducerHsaId = true;
        } else if (!!Math.floor(Math.random() * 2)) {
          serviceContract.installedInEnvironment = true;
          serviceContract.installedForProducerHsaId = false;
        } else {
          serviceContract.installedInEnvironment = false;
          serviceContract.installedForProducerHsaId = false;
        }
        return serviceContract;
      };

      return serviceContractFactory;
  }]);
