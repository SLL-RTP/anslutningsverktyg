'use strict';
angular.module('avApp')
  .factory('BestallningState', ['$rootScope', '$q', '$log', 'User',
    function ($rootScope, $q, $log, User) {
      var _order;
      var _specificOrderSatisfied = false, _specificOrderValid = false;

      var init = function () {
        $log.debug('--- BestallningState.init() ---');
        var deferred = $q.defer();
        User.getCurrentUser().then(function(currentUser) {
          _order = {
            nat: [],
            tjanstekomponent: {},
            bestallare: currentUser
          };
          deferred.resolve(_order);
        });
        _specificOrderSatisfied = false;
        _specificOrderValid = false;
        return deferred.promise;
      };

      var order = function() {
        return _order;
      };

      var specificOrderSatisfied = function() {
        return _specificOrderSatisfied;
      };

      var setSpecificOrderSatisfied = function(satisfied) {
        _specificOrderSatisfied = satisfied;
      };

      var specificOrderValid = function() {
        return _specificOrderValid;
      };

      var setSpecificOrderValid = function(valid) {
        _specificOrderValid = valid;
      };

      return {
        init: init,
        current: order,
        specificOrderSatisfied: specificOrderSatisfied,
        setSpecificOrderSatisfied: setSpecificOrderSatisfied,
        specificOrderValid: specificOrderValid,
        setSpecificOrderValid: setSpecificOrderValid
      };
    }]);
