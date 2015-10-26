'use strict';
angular.module('avApp')
  .factory('KonsumentbestallningState', ['$rootScope', '$q', 'User', 'BestallningState', 'LogicalAddress',
    function ($rootScope, $q, User, BestallningState, LogicalAddress) {
      var _order;

      var init = function () {
        console.info('--- KonsumentbestallningState.init ---');
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
        console.info('setTjanstekomponent', tjk);
        _order.tjanstekomponent = tjk;
        _order.konsumentanslutningar = []; //reset on new komponent
      };

      var setNat = function (natArr) {
        console.info('setNat', natArr);
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

      var removeLogiskAdressFromAnslutning = function (logiskAdress, anslutning) {
        var orderAnslutning = _.find(_order.konsumentanslutningar, _.pick(anslutning, ['tjanstekontraktNamnrymd', 'tjanstekontraktMajorVersion', 'tjanstekontraktMinorVersion']))
        if (orderAnslutning) {
          var logiskAdressId = _.pick(logiskAdress, 'hsaId');
          if (angular.isDefined(orderAnslutning.nyaLogiskaAdresser)) {
            _.remove(orderAnslutning.nyaLogiskaAdresser, logiskAdressId);
          }
          if (!orderAnslutning.borttagnaLogiskaAdresser) {
            orderAnslutning.borttagnaLogiskaAdresser = [];
          }
          if (!_.find(orderAnslutning.borttagnaLogiskaAdresser, logiskAdressId)) {
            orderAnslutning.borttagnaLogiskaAdresser.push(_.clone(logiskAdress));
          }
          $rootScope.$broadcast('logisk-adress-removed');
        }
      };

      var addLogiskAdressToAnslutning = function (logiskAdress, anslutning) {
        var orderAnslutning = _.find(_order.konsumentanslutningar, _.pick(anslutning, ['tjanstekontraktNamnrymd', 'tjanstekontraktMajorVersion', 'tjanstekontraktMinorVersion']))
        if (orderAnslutning) {
          var nyLogiskAdress = _.clone(logiskAdress);
          var logiskAdressId = _.pick(nyLogiskAdress, 'hsaId');
          if (_.isUndefined(orderAnslutning.nyaLogiskaAdresser)) {
            orderAnslutning.nyaLogiskaAdresser = [];
          }
          if (!_isLogiskAdressOnAnslutning(nyLogiskAdress, orderAnslutning)) {
            if (_isLogiskAdressInBorttagnaLogiskaAdresser(nyLogiskAdress, orderAnslutning)) {
              _.remove(orderAnslutning.borttagnaLogiskaAdresser, logiskAdressId);
            } else {
              orderAnslutning.nyaLogiskaAdresser.push(nyLogiskAdress);
            }
          }
          $rootScope.$broadcast('logisk-adress-added');
        }
      };

      var _isAnslutningOnOrder = function (anslutning) {
        var anslutningId = {
          tjanstekontraktNamnrymd: anslutning.tjanstekontraktNamnrymd,
          tjanstekontraktMajorVersion: anslutning.tjanstekontraktMajorVersion,
          tjanstekontraktMinorVersion: anslutning.tjanstekontraktMinorVersion
        };
        return !!_.find(_order.konsumentanslutningar, anslutningId);
      };

      var _isLogiskAdressOnAnslutning = function (logiskAdress, anslutning) {
        var logiskAdressId = _.pick(logiskAdress, 'hsaId');
        if (anslutning.nyaLogiskaAdresser && _.find(anslutning.nyaLogiskaAdresser, logiskAdressId)) {
          return true;
        }
        if (anslutning.befintligaLogiskaAdresser && _.find(anslutning.befintligaLogiskaAdresser, logiskAdressId)) {
          return !_isLogiskAdressInBorttagnaLogiskaAdresser(logiskAdress, anslutning);

        }
        return false;
      };

      var _isLogiskAdressInBorttagnaLogiskaAdresser = function (logiskAdress, anslutning) {
        return (anslutning.borttagnaLogiskaAdresser && _.find(anslutning.borttagnaLogiskaAdresser, {hsaId: logiskAdress.hsaId}));
      };

      return {
        init: init,
        current: order,
        setTjanstekomponent: setTjanstekomponent,
        setNat: setNat,
        addAnslutning: addAnslutningToOrder,
        removeAnslutning: removeAnslutningFromOrder,
        addLogiskAdressToAnslutning: addLogiskAdressToAnslutning,
        removeLogiskAdressFromAnslutning: removeLogiskAdressFromAnslutning
      };
    }]);
