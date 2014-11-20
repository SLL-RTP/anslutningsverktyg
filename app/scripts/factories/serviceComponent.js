'use strict';
angular.module('avApp')
  .factory('ServiceComponent', ['$q', '$http',
    function ($q, $http) {

      var serviceComponents = [
        {
          name: 'Tjänsteproducent 1',
          hsaid: '1',
          personInCharge: {
            name: 'A Bsson',
            mail: 'email@email.se',
            phone: '192912912'
          },
          contact: {
            name: 'En kontakt',
            mail: 'email@email.se',
            phone: '192912912'
          },
          mailbox: {
            mail: 'funktion@email.se',
            phone: '192912912'
          },
          other: {
            ip: '127.0.0.1'
          }
        },
        {
          name: 'Tjänsteproducent 2',
          hsaid: '2',
          personInCharge: {
            name: 'C Dsson',
            mail: 'email@email.se',
            phone: '192912912'
          },
          contact: {
            name: 'En till kontakt',
            mail: 'email@email.se',
            phone: '192912912'
          },
          mailbox: {
            mail: 'funktion@email.se',
            phone: '192912912'
          },
          other: {
            ip: '1.3.3.7'
          }
        },
        {name: 'Tjänsteproducent 3', hsaid: '3'},
        {name: 'asnsteproducent 2', hsaid: '4'},
        {name: 'sdteproducent 2', hsaid: '5'},
        {name: 'edefroducent 2', hsaid: '5'},
        {name: 'fsdsdsteproducent 2', hsaid: '6'},
        {name: 'dsdseproducent 2', hsaid: '7'},
        {name: 'dsdsnsteproducent 2', hsaid: '8'}];

      return {
        getFilteredServiceComponents: function (query) {
          var deferred = $q.defer();
          console.log('getFilteredServiceComponents: ' + query);
          if (query) {
            var lowerCaseQuery = query.toLowerCase();
            $http.get("http://localhost:8080/anslutningsverktyg/api/serviceComponents", {
              params: {
                query: lowerCaseQuery
              }
            }).success(function (data) {
              var serviceComponents = _.transform(data, function (result, serverServiceComponent) {
                var serviceComponent = {
                  name: serverServiceComponent.hsaId,
                  hsaid: serverServiceComponent.hsaId,
                  personInCharge: {
                    name: 'unknown',
                    mail: 'unknown',
                    phone: '0'
                  },
                  contact: {
                    name: serverServiceComponent.tekniskKontaktNamn,
                    mail: serverServiceComponent.tekniskKontaktEpost,
                    phone: serverServiceComponent.tekniskKontaktTelefon
                  },
                  mailbox: {
                    mail: serverServiceComponent.funktionsBrevladaEpost,
                    phone: serverServiceComponent.funktionsBrevladaTelefon
                  },
                  other: {
                    ip: serverServiceComponent.ipadress
                  }
                };
                result.push(serviceComponent);
              });
              deferred.resolve(serviceComponents);
            }).error(function (data, status, headers) { //TODO: error handling
              deferred.reject();
            });
          } else {
            deferred.resolve([]);
          }
          return deferred.promise;
        }
      };
    }]);
