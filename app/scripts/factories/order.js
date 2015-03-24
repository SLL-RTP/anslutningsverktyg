'use strict';
angular.module('avApp')
  .factory('Order', ['configuration', '$q', '$http',
    function (configuration, $q, $http) {
      return {
        createServiceProducerConnectionOrder: function (order) {
          var deferred = $q.defer();
          console.log(order);
          $http.post(configuration.basePath + '/api/serviceProducerConnectionOrders', order).success(function (data, status, headers) {
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
    }]);
