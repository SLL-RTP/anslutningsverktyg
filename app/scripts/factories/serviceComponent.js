'use strict';
angular.module('avApp')
  .factory('ServiceComponent', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {

      return {
        getFilteredServiceComponents: function (query, driftmiljoId) {
          var deferred = $q.defer();
          console.log('getFilteredServiceComponents query[' + query + '], driftmiljoId[' + driftmiljoId + ']');
          if (query) {
            var lowerCaseQuery = query.toLowerCase();
            $http.get(configuration.basePath + '/api/serviceComponents', {
              params: {
                query: lowerCaseQuery,
                takId: driftmiljoId
              }
            }).success(function (data) {
              if (angular.isDefined(data)) {
                data = _.map(data, function(tjanstekomponent) {
                  if (tjanstekomponent.hsaId) {
                    tjanstekomponent.hsaId = tjanstekomponent.hsaId.toUpperCase();
                  }
                  return tjanstekomponent;
                });
              }
              deferred.resolve(data);
            }).error(function () { //TODO: error handling
              deferred.reject();
            });
          } else {
            deferred.resolve([]);
          }
          return deferred.promise;
        },
        getServiceComponent: function (serviceComponentId, driftmiljoId) {
          var deferred = $q.defer();
          console.log('getServiceComponent: ' + serviceComponentId);
          $http.get(configuration.basePath + '/api/serviceComponents/'+serviceComponentId, {
            params: {
              takId: driftmiljoId
            }
          }).success(function (data) {
            if (angular.isDefined(data) && data.hsaId) {
              data.hsaId = data.hsaId.toUpperCase();
            }
            deferred.resolve(data);
          }).error(function () { //TODO: error handling
            deferred.reject();
          });
          return deferred.promise;
        },
        updateServiceComponent: function (serviceComponent) {
          var clonedSc = _.clone(serviceComponent);
          delete clonedSc['class']; //TODO: we should handle this in backend
          var deferred = $q.defer();
          $http.put(configuration.basePath + '/api/serviceComponents/' + clonedSc.hsaId , clonedSc).success(function() {
            deferred.resolve();
          }).error(function() { //TODO: handle errors

          });
          return deferred.promise;
        }
      };
    }]);
