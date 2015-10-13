'use strict';
angular.module('avApp')
  .factory('BestallningState', ['$rootScope', '$q', '$timeout', '$interval', 'User',
    function ($rootScope, $q, $timeout, $interval, User) {
      var _order, _producerOrder;

      var init = function () {
        console.info('--- init ---');
        var deferred = $q.defer();
        if (_order === undefined) {
          User.getCurrentUser().then(function(currentUser) {
            _order = {
              nat: [],
              tjanstekomponent: {},
              bestallare: currentUser
            };
            deferred.resolve(_order);
          });
        } else {
          console.warn('--- order already initialized ---');
          deferred.resolve();
        }
        return deferred.promise;
      };

      var initProducentBestallning = function() {
        console.info('--- initProducentBestallning ---');
        var deferred = $q.defer();
          _producerOrder = {};
          _.assign(_producerOrder, _order, {
            producentanslutningar: []
          });
          deferred.resolve();
        $interval(function() {
          console.log('producer order is now', _.cloneDeep(_producerOrder));
        }, 10000);
        return deferred.promise;
      };

      var order = function() {
        return _order;
      };

      var producentbestallning = function() {
        return _producerOrder;
      };

      return {
        init: init,
        initProducentBestallning: initProducentBestallning,
        current: order,
        producentbestallning: producentbestallning
      };
    }]);
