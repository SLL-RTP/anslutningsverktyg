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
          var bestallningDTO = toBestallningDTO(order);
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
          console.log(order);
          $http.post(configuration.basePath + '/api/updateServiceProducerConnectionOrders', order).success(function (data, status, headers) {
            deferred.resolve(status);
          }).error(function (data, status, headers) { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };

      var toBestallningDTO = function(oldOrder) {

        var serviceComponent = oldOrder.serviceComponent;

        return {
          driftmiljo: oldOrder.targetEnvironment.id,
          bestallare: {
            hsaId: oldOrder.client.hsaId,
            namn: oldOrder.client.name,
            epost: oldOrder.client.email,
            telefon: oldOrder.client.phone
          },
          bestallareRoll: oldOrder.client.role,
          producentbestallning: {
            tjanstekomponent: {
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
            },
            producentanslutningar: _.map(oldOrder.serviceContracts, function (serviceContract) {
              return {
                rivtaProfil: serviceContract.address.rivProfil,
                url: serviceContract.address.url,
                tjanstekontraktNamnrymd: serviceContract.namnrymd,
                nyaLogiskaAdresser: _.map(serviceContract.logicalAddresses, 'hsaId')
              }
            })
          }
        };
      };

      return orderFactory;
    }]);
