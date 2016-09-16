'use strict';

angular.module('avApp')
  .factory('Nat', ['$q', '$http', 'configuration', 'Environment',
    function ($q, $http, configuration, Environment) {
      return {
        getNat: function() {
          var deferred = $q.defer();
          $http.get(configuration.basePath + '/api/nat').success(function(data) {
            deferred.resolve(data);
          }).error(function () { //TODO: error handling
            deferred.reject();
          });
          return deferred.promise;
        },

        /*
        {
          ntjp-prod: [
            {
              id: "internet",
              namn: "Internet"
            },
            {
              id: "sjunet",
              namn: "Sjunet"
            },
            ...
          ],
          ...
        }
        */
        getNetsForAllEnvironments: function() {
          var deferred = $q.defer();
          Environment.getAvailableEnvironments().then(function(environments) {
            console.debug('environments', environments);
            var retVal = {};
            var promises = _.map(environments, function(env) {
              var subDef = $q.defer();
              $http.get(configuration.basePath + '/api/nat', {
                params: {
                  environmentId: env.id
                }
              }).success(function(data) {
                console.debug('net data for ' + env.id, data);
                retVal[env.id] = data;
                subDef.resolve();
              }).error(function () { //TODO: error handling
                console.error('could not get net data for ' + env.id);
                subDef.resolve();
              });
              return subDef.promise;
            });
            $q.all(promises).then(function() {
              deferred.resolve(retVal);
            });
          });
          return deferred.promise;
        }
      };
    }]);
