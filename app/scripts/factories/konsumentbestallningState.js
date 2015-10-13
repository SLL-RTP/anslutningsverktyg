'use strict';
angular.module('avApp')
  .factory('KonsumentbestallningState', ['$rootScope', '$q', 'User', 'BestallningState', 'LogicalAddress', 'Url',
    function ($rootScope, $q, User, BestallningState, LogicalAddress, Url) {
      var _order;

      var init = function () {
        console.info('--- KonsumentbestallningState.init ---');
        var deferred = $q.defer();
        BestallningState.init().then(function () {
          _order = {
            konsumentanslutningar: []
          };
          _.assign(_order, BestallningState.current());
          deferred.resolve();
        });
        return deferred.promise;
      };

      var order = function () {
        return _order;
      };

      var setTjanstekomponent = function (tjk) {
        console.info('setTjanstekomponent', tjk);
        _order.tjanstekomponent = tjk;
      };

      var setNat = function (natArr) {
        console.info('setNat', natArr);
        _order.nat = natArr;
      };

      var addAnslutningToOrder = function (anslutning) {
        console.log('add: ' + anslutning.tjanstekontraktNamnrymd + ', _anslutetForProducent: ' + anslutning._anslutetForProducent);
        if (!isAnslutningOnOrder(anslutning)) {
          var nyAnslutning = _.cloneDeep(anslutning);
          //TODO: how to handle logiska adresser already added to anslutningar when new anslutning is to be added?
          if (nyAnslutning._anslutetForProducent) {
            var serviceComponent = _order.tjanstekomponent;
            var environment = _order.driftmiljo;
            _populateAnslutningWithExistingLogiskaAdresser(nyAnslutning, serviceComponent.hsaId, environment.id);
          }
          _order.producentanslutningar.push(nyAnslutning);
          $rootScope.$broadcast('anslutning-added');
        }
      };

      var removeAnslutningFromOrder = function (anslutning) {
        var anslutningId = {
          tjanstekontraktNamnrymd: anslutning.tjanstekontraktNamnrymd,
          tjanstekontraktMajorVersion: anslutning.tjanstekontraktMajorVersion,
          tjanstekontraktMinorVersion: anslutning.tjanstekontraktMinorVersion
        };
        if (isAnslutningOnOrder(anslutning)) {
          _.remove(_order.producentanslutningar, anslutningId);
          $rootScope.$broadcast('anslutning-removed');
        }
      };

      var isAnslutningOnOrder = function (anslutning) {
        var anslutningId = {
          tjanstekontraktNamnrymd: anslutning.tjanstekontraktNamnrymd,
          tjanstekontraktMajorVersion: anslutning.tjanstekontraktMajorVersion,
          tjanstekontraktMinorVersion: anslutning.tjanstekontraktMinorVersion
        };
        return _.find(_order.producentanslutningar, anslutningId);
      };

      var addLogiskAdressToAllAnslutningar = function (logiskAdress) {
        _.forEach(_order.producentanslutningar, function (anslutning) {
          addLogiskAdressToAnslutning(logiskAdress, anslutning);
        });
      };

      var canAddLogiskAdressToAllAnslutningar = function (logiskAdress) {
        return _.every(_order.producentanslutningar, function (anslutning) {
          return canAddLogiskAdressToAnslutning(logiskAdress, anslutning);
        });
      };

      var canAddLogiskAdressToAnslutning = function (logiskAdress, anslutning) {
        return !_isLogiskAdressOnAnslutning(logiskAdress, anslutning);
      };

      var removeLogiskAdressFromAllAnslutningar = function (logiskAdress) {
        _.each(_order.producentanslutningar, function (anslutning) {
          removeLogiskAdressFromAnslutning(logiskAdress, anslutning);
        });
      };

      var removeLogiskAdressFromAnslutning = function (logiskAdress, anslutning) {
        var logiskAdressId = logiskAdress.hsaId.toUpperCase();
        if (angular.isDefined(anslutning.nyaLogiskaAdresser)) {
          _.remove(anslutning.nyaLogiskaAdresser, {hsaId: logiskAdressId});
        }
        if (angular.isDefined(anslutning.befintligaLogiskaAdresser) && _.find(anslutning.befintligaLogiskaAdresser, {hsaId: logiskAdressId})) {
          if (!anslutning.borttagnaLogiskaAdresser) {
            anslutning.borttagnaLogiskaAdresser = [];
          }
          if (!_.find(anslutning.borttagnaLogiskaAdresser, {hsaId: logiskAdressId})) {
            anslutning.borttagnaLogiskaAdresser.push(logiskAdress);
          }
        }
        $rootScope.$broadcast('logisk-adress-removed');
      };

      var addLogiskAdressToAnslutning = function (logiskAdress, anslutning) {
        var nyLogiskAdress = _.clone(logiskAdress);
        nyLogiskAdress.hsaId = nyLogiskAdress.hsaId.toUpperCase();
        var logiskAdressId = {hsaId: nyLogiskAdress.hsaId};
        if (nyLogiskAdress._existing) {
          if (_.isUndefined(anslutning.befintligaLogiskaAdresser)) {
            anslutning.befintligaLogiskaAdresser = [];
          }
          if (!_isLogiskAdressOnAnslutning(nyLogiskAdress, anslutning)) {
            anslutning.befintligaLogiskaAdresser.push(_.omit(nyLogiskAdress, '_existing'));
          }
        } else {
          if (_.isUndefined(anslutning.nyaLogiskaAdresser)) {
            anslutning.nyaLogiskaAdresser = [];
          }
          if (!_isLogiskAdressOnAnslutning(nyLogiskAdress, anslutning)) {
            if (_isLogiskAdressInBorttagnaLogiskaAdresser(nyLogiskAdress, anslutning)) {
              _.remove(anslutning.borttagnaLogiskaAdresser, logiskAdressId);
            } else {
              anslutning.nyaLogiskaAdresser.push(nyLogiskAdress);
            }
          }
        }
        $rootScope.$broadcast('logisk-adress-added');
      };

      var _isLogiskAdressOnAnslutning = function (logiskAdress, anslutning) {
        var logiskAdressId = {hsaId: logiskAdress.hsaId.toUpperCase()};
        if (anslutning.nyaLogiskaAdresser && _.find(anslutning.nyaLogiskaAdresser, logiskAdressId)) {
          return true;
        }
        if (anslutning.befintligaLogiskaAdresser && _.find(anslutning.befintligaLogiskaAdresser, logiskAdressId)) {
          return !_isLogiskAdressInBorttagnaLogiskaAdresser(logiskAdress, anslutning);

        }
        return false;
      };

      var _isLogiskAdressInBorttagnaLogiskaAdresser = function (logiskAdress, anslutning) {
        return (anslutning.borttagnaLogiskaAdresser && _.find(anslutning.borttagnaLogiskaAdresser, {hsaId: logiskAdress.hsaId.toUpperCase()}));
      };

      var _populateAnslutningWithExistingLogiskaAdresser = function (anslutning, tjanstekomponentHsaId, driftmiljoId) {
        LogicalAddress.getConnectedLogicalAddressesForContract(tjanstekomponentHsaId, driftmiljoId, anslutning.tjanstekontraktNamnrymd, anslutning.tjanstekontraktMajorVersion, anslutning.tjanstekontraktMinorVersion).then(function (anslutnaLogiskaAdresser) {
          _.each(anslutnaLogiskaAdresser, function (logiskAdress) {
            var where = {hsaId: logiskAdress.hsaId}; //already upper case from backend
            if (!_.find(anslutning.borttagnaLogiskaAdresser, where)) {
              logiskAdress._existing = true;
              addLogiskAdressToAnslutning(logiskAdress, anslutning);
            }
          });
        });
      };

      return {
        init: init,
        current: order,
        setTjanstekomponent: setTjanstekomponent,
        setNat: setNat,
        addAnslutning: addAnslutningToOrder,
        removeAnslutning: removeAnslutningFromOrder,
        isAnslutningOnOrder: isAnslutningOnOrder,
        addLogiskAdressToAllAnslutningar: addLogiskAdressToAllAnslutningar,
        addLogiskAdressToAnslutning: addLogiskAdressToAnslutning,
        canAddLogiskAdressToAllAnslutningar: canAddLogiskAdressToAllAnslutningar,
        canAddLogiskAdressToAnslutning: canAddLogiskAdressToAnslutning,
        removeLogiskAdressFromAllAnslutningar: removeLogiskAdressFromAllAnslutningar,
        removeLogiskAdressFromAnslutning: removeLogiskAdressFromAnslutning,
      };
    }]);
