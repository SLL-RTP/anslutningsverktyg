'use strict';
angular.module('avApp')
  .factory('Tjanstekomponent', ['$q', '$http', '$log', 'configuration',
    function ($q, $http, $log, configuration) {

      var tjanstekomponentFactory = {
        getFilteredTjanstekomponenter: function (query, driftmiljoId) {
          var deferred = $q.defer();
          $log.debug('getFilteredTjanstekomponenter query[' + query + '], driftmiljoId[' + driftmiljoId + ']');
          var path = '/api/serviceComponents/withoutTakId';
          var params = {};
          if (query) {
            var lowerCaseQuery = query.toLowerCase();
            params.query = lowerCaseQuery;
            if (driftmiljoId) {
              path = '/api/serviceComponents/withTakId';
              params.takId = driftmiljoId;
            }
            $http.get(configuration.basePath + path, {
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
          var cleanTjanstekomponent = cleanObj(tjanstekomponent);
          $log.debug(JSON.stringify(cleanTjanstekomponent, null, 2));
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
            deferred.resolve({status: status, action: data.action});
          }).error(function() { //TODO: handle errors

          });
          return deferred.promise;
        }
      };

      var cleanObj = function(obj) {
        if (!_.isObject(obj)) {
          return obj;
        }
        var cleaned = _.pick(obj, function (value, propertyName) {
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
        cleaned = _.mapValues(cleaned, function(value, key, obj) {
          if (_.isArray(value)) {
            return _.map(value, function(arrayMember) {
              return cleanObj(arrayMember);
            });
          } else if (_.isObject(value)) {
            return cleanObj(value);
          }
          return value;
        })
        return !_.isEmpty(cleaned) ? cleaned : null;
      };

      return tjanstekomponentFactory;
    }]);
