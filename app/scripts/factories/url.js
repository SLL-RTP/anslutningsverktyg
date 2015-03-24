'use strict';

angular.module('avApp')
  .factory('Url', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      return {
        getUrlAndProfile: function(serviceComponentId, environmentId, serviceContractId, majorVersion, minorVersion) {
          console.log('getUrl: serviceComponentId[' + serviceComponentId + '], environmentId[' + environmentId + '], serviceContractId[' + serviceContractId + '], majorVersion[' + majorVersion + '], minorVersion[' + minorVersion + ']');
          var deferred = $q.defer();
          $http.get(configuration.basePath + '/api/serviceComponents/' + serviceComponentId + '/' + environmentId + '/' + serviceContractId + '/' + majorVersion + '/' + minorVersion + '/address')
            .success(function (data) {
              console.log(data);
              deferred.resolve(data);
            }).error(function (data, status, headers) { //TODO: error handling
              deferred.reject();
            });
          return deferred.promise;
        }
      };
    }]);
