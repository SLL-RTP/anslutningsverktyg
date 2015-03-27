'use strict';
angular.module('avApp')
  .factory('Order', ['configuration', '$q', '$http',
    function (configuration, $q, $http) {
      var orderFactory = {
        createServiceProducerConnectionOrder: function (order) {
          var deferred = $q.defer();
          console.log('old order format:');
          console.log(JSON.stringify(order, null, 2));
          console.log('new order format:');
          var bestallningDTO = toBestallningDTO(order, false);
          console.log(JSON.stringify(bestallningDTO, null, 2));

          $http.post(configuration.basePath + '/api/bestallning', bestallningDTO).success(function (data, status, headers) {
            deferred.resolve(status);
          }).error(function (data, status, headers) { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        },
        createServiceProducerConnectionUpdateOrder: function (order) {
          var deferred = $q.defer();
          console.log('old order format:');
          console.log(JSON.stringify(order, null, 2));
          console.log('new order format:');
          var bestallningDTO = toBestallningDTO(order, true);
          console.log(JSON.stringify(bestallningDTO, null, 2));
          $http.post(configuration.basePath + '/api/bestallning', bestallningDTO).success(function (data, status, headers) {
            deferred.resolve(status);
          }).error(function (data, status, headers) { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };

      var toBestallningDTO = function(oldOrder, isUpdateOrder) {

        var serviceComponent = oldOrder.serviceComponent;

        var bestallningDTO = {
          driftmiljo: _.clone(oldOrder.targetEnvironment),
          bestallare: {
            hsaId: oldOrder.client.hsaId,
            namn: oldOrder.client.name,
            epost: oldOrder.client.email,
            telefon: oldOrder.client.phone
          },
          bestallareRoll: oldOrder.client.role
        };

        var producentbestallning = {
          tjanstekomponent: toTjanstekomponentDTO(serviceComponent)
        };

        if (!isUpdateOrder) {
          producentbestallning.producentanslutningar = _.map(oldOrder.serviceContracts, function (serviceContract) {
            return toAnslutningDTO(serviceContract, false);
          });
        } else {
          producentbestallning.uppdateradProducentanslutningar = _.map(oldOrder.serviceContracts, function (serviceContract) {
            return toAnslutningDTO(serviceContract, true);
          });
        }
        bestallningDTO.producentbestallning = producentbestallning;

        if (!_.isEmpty(oldOrder.serviceConsumer)) {
          var konsumentbestallning = {
            tjanstekomponent: toTjanstekomponentDTO(oldOrder.serviceConsumer)
          };
          if (!isUpdateOrder) {
            konsumentbestallning.konsumentanslutningar = _.map(oldOrder.serviceContracts, function(serviceContract) {
              return toAnslutningDTO(serviceContract, false)
            });
          } else {
            konsumentbestallning.uppdateradKonsumentanslutningar = _.map(oldOrder.serviceContracts, function(serviceContract) {
              return toAnslutningDTO(serviceContract, true)
            });
          }
          bestallningDTO.konsumentbestallningar = [konsumentbestallning]
        }
        return bestallningDTO;
      };

      var toTjanstekomponentDTO = function(serviceComponent) {
        return {
          hsaId: serviceComponent.hsaId,
          beskrivning: serviceComponent.namn,
          organisation: serviceComponent.organisation,
          ipadress: serviceComponent.ipadress,
          pingForConfigurationURL: serviceComponent.pingForConfiguration,
          huvudansvarigKontakt: {
            hsaId: 'hsa-' + _.random(999),
            namn: serviceComponent.huvudAnsvarigNamn,
            epost: serviceComponent.huvudAnsvarigEpost,
            telefon: serviceComponent.huvudAnsvarigTelefon
          },
          tekniskKontakt: {
            hsaId: 'hsa-' + _.random(999),
            namn: serviceComponent.tekniskKontaktNamn,
            epost: serviceComponent.tekniskKontaktEpost,
            telefon: serviceComponent.tekniskKontaktTelefon
          },
          tekniskSupportKontakt: {
            epost: serviceComponent.funktionsBrevladaEpost,
            telefon: serviceComponent.funktionsBrevladaTelefon
          }
        }
      };

      var toAnslutningDTO = function(serviceContract, isUpdateOrder) {
        var anslutning = {
          rivtaProfil: serviceContract.address.rivProfil,
          url: serviceContract.address.url,
          tjanstekontraktNamnrymd: serviceContract.namnrymd,
          tjanstekontraktMajorVersion: serviceContract.majorVersion,
          tjanstekontraktMinorVersion: serviceContract.minorVersion
        };
        if (!isUpdateOrder) {
          anslutning.nyaLogiskaAdresser = _.map(serviceContract.logicalAddresses, 'hsaId');
        } else {
          anslutning.nyaLogiskaAdresser = _.map(serviceContract.newLogicalAddresses, 'hsaId');
          anslutning.befintligaLogiskaAdresser = _.map(serviceContract.logicalAddresses, 'hsaId');
          anslutning.borttagnaLogiskaAdresser =_.map(serviceContract.removedLogicalAddresses, 'hsaId');
        }
        return anslutning;
      };

      return orderFactory;
    }]);
