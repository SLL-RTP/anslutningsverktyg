'use strict';
angular.module('avApp')
  .factory('KonsumentbestallningState', ['$rootScope', '$q', '$log', 'BestallningState',
    function ($rootScope, $q, $log, BestallningState) {
      var _order;

      var init = function () {
        $log.debug('--- KonsumentbestallningState.init ---');
        var deferred = $q.defer();
        _order = {
          konsumentanslutningar: []
        };
        _.assign(_order, BestallningState.current());
        deferred.resolve();
        return deferred.promise;
      };

      var order = function () {
        return _order;
      };

      var setTjanstekomponent = function (tjk) {
        _order.tjanstekomponent = tjk;
        _order.konsumentanslutningar = []; //reset on new komponent
      };

      var setNat = function (natArr) {
        $log.debug('setNat', natArr);
        _order.nat = natArr;
      };

      var addAnslutningToOrder = function (anslutning) {
        var nyAnslutning = _.cloneDeep(anslutning);
        var anslutningId = _.pick(nyAnslutning, ['tjanstekontraktNamnrymd', 'tjanstekontraktMajorVersion', 'tjanstekontraktMinorVersion']);
        var index = _.findIndex(_order.konsumentanslutningar, anslutningId);
        if (index === -1) {
          _order.konsumentanslutningar.push(nyAnslutning);
        } else { //replace anslutning if already among anslutningar
          _order.konsumentanslutningar[index] = nyAnslutning;
        }
        $rootScope.$broadcast('anslutning-added');
      };

      var removeAnslutningFromOrder = function (anslutning) {
        var anslutningId = {
          tjanstekontraktNamnrymd: anslutning.tjanstekontraktNamnrymd,
          tjanstekontraktMajorVersion: anslutning.tjanstekontraktMajorVersion,
          tjanstekontraktMinorVersion: anslutning.tjanstekontraktMinorVersion
        };
        if (_isAnslutningOnOrder(anslutning)) {
          _.remove(_order.konsumentanslutningar, anslutningId);
          $rootScope.$broadcast('anslutning-removed');
        }
      };

      var removeLogiskAdressFromAnslutning = function (logiskAdress, anslutning, orderRemoval) {
        var orderAnslutning = _findAnslutning(anslutning);
        if (orderAnslutning) {
          var logiskAdressId = _.pick(logiskAdress, 'hsaId');
          if (angular.isDefined(orderAnslutning.nyaLogiskaAdresser)) {
            _.remove(orderAnslutning.nyaLogiskaAdresser, logiskAdressId);
          }
          if (orderRemoval) {
            if (!orderAnslutning.borttagnaLogiskaAdresser) {
              orderAnslutning.borttagnaLogiskaAdresser = [];
            }
            if (!_.find(orderAnslutning.borttagnaLogiskaAdresser, logiskAdressId)) {
              orderAnslutning.borttagnaLogiskaAdresser.push(_.clone(logiskAdress));
            }
          }
          $rootScope.$broadcast('logisk-adress-removed');
          _removeAnslutningIfEmpty(orderAnslutning);
        }
      };

      var addLogiskAdressToAnslutning = function (logiskAdress, anslutning, orderAdd) {
        var orderAnslutning = _findAnslutning(anslutning);
        if (orderAnslutning) {
          var logiskAdressId = _.pick(logiskAdress, 'hsaId');
          _.remove(orderAnslutning.borttagnaLogiskaAdresser, logiskAdressId);
          if (orderAdd) {
            if (_.isUndefined(orderAnslutning.nyaLogiskaAdresser)) {
              orderAnslutning.nyaLogiskaAdresser = [];
            }
            //TODO: do we need to check if it already exists?
            orderAnslutning.nyaLogiskaAdresser.push(_.clone(logiskAdress));
          }
          $rootScope.$broadcast('logisk-adress-added');
          _removeAnslutningIfEmpty(orderAnslutning);
        }
      };

      var _findAnslutning = function(ans) {
        return _.find(_order.konsumentanslutningar,
          _.pick(ans,
            ['tjanstekontraktNamnrymd',
              'tjanstekontraktMajorVersion',
              'tjanstekontraktMinorVersion']
          )
        );
      };

      var _removeAnslutningIfEmpty = function(anslutning) {
        var empty = true;
        if (anslutning.nyaLogiskaAdresser && anslutning.nyaLogiskaAdresser.length > 0) {
          empty = false;
        } else if (anslutning.borttagnaLogiskaAdresser && anslutning.borttagnaLogiskaAdresser.length > 0) {
          empty = false;
        }
        if (empty) {
          console.log('anslutning is now empty, removing from order');
          removeAnslutningFromOrder(anslutning);

        }
        return empty;
      };

      var getAnslutning = function(key) {
        return _.find(_order.konsumentanslutningar, {_key: key});
      };

      var _isAnslutningOnOrder = function (anslutning) {
        var anslutningId = {
          tjanstekontraktNamnrymd: anslutning.tjanstekontraktNamnrymd,
          tjanstekontraktMajorVersion: anslutning.tjanstekontraktMajorVersion,
          tjanstekontraktMinorVersion: anslutning.tjanstekontraktMinorVersion
        };
        return !!_.find(_order.konsumentanslutningar, anslutningId);
      };

      return {
        init: init,
        current: order,
        setTjanstekomponent: setTjanstekomponent,
        setNat: setNat,
        addAnslutning: addAnslutningToOrder,
        removeAnslutning: removeAnslutningFromOrder,
        getAnslutning: getAnslutning,
        addLogiskAdressToAnslutning: addLogiskAdressToAnslutning,
        removeLogiskAdressFromAnslutning: removeLogiskAdressFromAnslutning
      };
    }]);
