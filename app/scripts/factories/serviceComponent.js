'use strict';
angular.module('avApp')
  .factory('ServiceComponent', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {

      return {
        getFilteredServiceComponents: function (query) {
          var deferred = $q.defer();
          console.log('getFilteredServiceComponents: ' + query);
          if (query) {
            var lowerCaseQuery = query.toLowerCase();
            $http.get(configuration.apiHost + '/anslutningsplattform/api/serviceComponents', {
              params: {
                query: lowerCaseQuery
              }
            }).success(function (data) {
              deferred.resolve(data);
            }).error(function (data, status, headers) { //TODO: error handling
              deferred.reject();
            });
          } else {
            deferred.resolve([]);
          }
          return deferred.promise;
        },
        getServiceComponent: function (serviceComponentId) {
          var deferred = $q.defer();
          console.log('getServiceComponent: ' + serviceComponentId);
          $http.get(configuration.apiHost + '/anslutningsplattform/api/serviceComponents/'+serviceComponentId).success(function (data) {
            deferred.resolve(data);
          }).error(function (data, status, headers) { //TODO: error handling
            deferred.reject();
          });
          return deferred.promise;
        },
        updateServiceComponent: function (serviceComponent) {
          var clonedSc = _.clone(serviceComponent);
          delete clonedSc.class; //TODO: we should handle this in backend
          var deferred = $q.defer();
          $http.put(configuration.apiHost + '/anslutningsplattform/api/serviceComponents/' + clonedSc.hsaId , clonedSc).success(function() {
            deferred.resolve();
          }).error(function(data, status, headers) { //TODO: handle errors

          });
          return deferred.promise;
        }
      };
    }]);
