'use strict';
angular.module('avApp')
  .factory('Tjanstekomponent', ['$q', '$http', 'configuration',
    function ($q, $http, configuration) {

      var tjanstekomponentFactory = {
        getFilteredTjanstekomponenter: function (query, driftmiljoId) {
          var deferred = $q.defer();
          console.log('getFilteredTjanstekomponenter query[' + query + '], driftmiljoId[' + driftmiljoId + ']');
          if (query) {
            var lowerCaseQuery = query.toLowerCase();
            var params = {
              query: lowerCaseQuery
            };
            if (driftmiljoId) {
              params.takId = driftmiljoId;
            }
            $http.get(configuration.basePath + '/api/serviceComponents', {
              params: params
            }).success(function (data) {
              deferred.resolve(data);
            }).error(function () { //TODO: error handling
              deferred.reject();
            });
          } else {
            deferred.resolve([]);
          }
          return deferred.promise;
        },
        getTjanstekomponent: function (serviceComponentId, driftmiljoId) {
          var deferred = $q.defer();
          console.log('getTjanstekomponent: ' + serviceComponentId);
          var params = {};
          if (driftmiljoId) {
            params.takId = driftmiljoId;
          }
          $http.get(configuration.basePath + '/api/serviceComponents/' + serviceComponentId, {
            params: params
          }).success(function (data) {
            deferred.resolve(data);
          }).error(function () { //TODO: error handling
            deferred.reject();
          });
          return deferred.promise;
        },
        updateTjanstekomponent: function (tjanstekomponent, isNew) {
          console.log('isNew: ' + isNew);
          var cleanTjanstekomponent = cleanObj(tjanstekomponent);
          cleanTjanstekomponent.huvudansvarigKontakt = cleanObj(cleanTjanstekomponent.huvudansvarigKontakt);
          cleanTjanstekomponent.tekniskKontakt = cleanObj(cleanTjanstekomponent.tekniskKontakt);
          cleanTjanstekomponent.tekniskSupportKontakt = cleanObj(cleanTjanstekomponent.tekniskSupportKontakt);
          cleanTjanstekomponent.nat = _.map(cleanTjanstekomponent.nat, cleanObj);
          console.log(JSON.stringify(cleanTjanstekomponent, null, 2));
          var deferred = $q.defer();

          var requestObj = {
            data: cleanTjanstekomponent
          };
          if (isNew) {
            requestObj.method = 'POST';
            requestObj.url = configuration.basePath + '/api/serviceComponents';
          } else {
            requestObj.method = 'PUT';
            requestObj.url = configuration.basePath + '/api/serviceComponents/' + cleanTjanstekomponent.hsaId;
          }
          $http(requestObj).success(function(data, status) {
            console.log(data);
            console.log(status);
            deferred.resolve(status);
          }).error(function() { //TODO: handle errors

          });
          //$http.put(configuration.basePath + '/api/serviceComponents/' + cleanTjanstekomponent.hsaId, cleanTjanstekomponent).success(function () {
          //  deferred.resolve();
          //}).error(function () { //TODO: handle errors
          //
          //});
          return deferred.promise;
        }
      };

      var cleanObj = function(dtoObj) {
        var cleaned = _.pick(dtoObj, function (value, propertyName) {
          if (propertyName === 'errors') {
            return false;
          } else if (propertyName.indexOf('_') === 0) {
            return false;
          } else if (propertyName.indexOf('$') === 0) {
            return false;
          } else if (propertyName === 'class') {
            return false;
          } else if (!value) { //remove null properties
            return false;
          }
          return true;
        });
        return !_.isEmpty(cleaned) ? cleaned : null;
      };

      return tjanstekomponentFactory;
    }]);
