'use strict';
angular.module('avApp')
  .factory('User', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {
      return {
        getCurrentUser: function () {
          var deferred = $q.defer();
          console.log('getCurrentUser()');
          $http.get(configuration.basePath + '/api/currentUser').success(function (data) {
            console.log(data);
            deferred.resolve(data);
          }).error(function (data, status, headers) { //TODO: error handling
            deferred.reject();
          });
          return deferred.promise;
        }
      };
    }]);
