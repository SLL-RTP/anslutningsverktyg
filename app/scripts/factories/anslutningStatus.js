'use strict';
angular.module('avApp')
  .factory('AnslutningStatus', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      return {
        //new style producentanslutningar, not used yet
        getProducentanslutningar: function (tjansteproducentHsaId, takId, tjanstedomanId) {
          var deferred = $q.defer();
          if (takId && tjanstedomanId && tjansteproducentHsaId) {
            $http.get(configuration.basePath + '/api/anslutningar/producent', {
              params: {
                environmentId: takId,
                serviceDomainId: tjanstedomanId,
                serviceProducerHsaId: tjansteproducentHsaId
              }
            }).success(function (data) {
              deferred.resolve(data);
            }).error(function () { //TODO: error handling
              deferred.reject();
            });
          }
          return deferred.promise;
        },
        getKonsumentanslutningar: function (tjanstekonsumentHsaId, takId, tjanstedomanId) {
          var deferred = $q.defer();
          if (takId && tjanstedomanId && tjanstekonsumentHsaId) {
            $http.get(configuration.basePath + '/api/anslutningar/konsument', {
              params: {
                environmentId: takId,
                serviceDomainId: tjanstedomanId,
                serviceConsumerHsaId: tjanstekonsumentHsaId
              }
            }).success(function (data) {
              deferred.resolve(data);
            }).error(function () { //TODO: error handling
              deferred.reject();
            });
          }
          return deferred.promise;
        }
      };
    }]);
