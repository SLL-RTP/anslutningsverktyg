'use strict';
angular.module('avApp')
  .factory('ServiceContract', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      var serviceContractFactory = {
        listAnslutningar: function (serviceComponentId, environmentId, serviceDomainId) {
          console.log('listAnslutningar serviceComponentId: ' + serviceComponentId + ', environmentId: ' + environmentId + ', serviceDomainId: ' + serviceDomainId);
          var deferred = $q.defer();
          $http.get(configuration.basePath + '/api/serviceContracts', {
            params: {
              hsaId: serviceComponentId,
              environmentId: environmentId,
              serviceDomainId: serviceDomainId
            }
          }).success(function (data) {
            var anslutningar = _.map(data, function (serviceContract) {
              serviceContract.serviceDomainId = serviceDomainId;
              return _serviceContractToAnslutningDTO(configuration.devMode ? _mockInstalledStatus(serviceContract) : serviceContract);
            });
            deferred.resolve(anslutningar);
          }).error(function () { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };

      var _serviceContractToAnslutningDTO = function (serviceContract) {
        var anslutning = {
          rivtaProfil: '',
          url: '',
          tjanstekontraktNamnrymd: serviceContract.namnrymd,
          tjanstekontraktMajorVersion: serviceContract.majorVersion,
          tjanstekontraktMinorVersion: serviceContract.minorVersion,
          nyaLogiskaAdresser: [],
          _namn: serviceContract.namn,
          _finnsIDriftmiljo: serviceContract.installedInEnvironment,
          _anslutetForProducent: serviceContract.installedForProducerHsaId,
          _tjanstedoman: serviceContract.namnrymd.substr(0, serviceContract.namnrymd.lastIndexOf(':'))
        };

        return anslutning;
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
