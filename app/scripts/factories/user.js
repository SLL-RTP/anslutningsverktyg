'use strict';
angular.module('avApp')
  .factory('User', ['$q', '$http', '$log', 'configuration',
    function ($q, $http, $log, configuration) {
      return {
        getCurrentUser: function () {
          var deferred = $q.defer();
          $log.debug('getCurrentUser()');
          $http.get(configuration.basePath + '/api/currentUser').success(function (data) {
            $log.debug(data);
            deferred.resolve(data);
          }).error(function () { //TODO: error handling
            deferred.reject();
          });
          return deferred.promise;
        }
      };
    }]);
