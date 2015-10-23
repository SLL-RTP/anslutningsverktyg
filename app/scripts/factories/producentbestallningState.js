'use strict';
angular.module('avApp')
  .factory('ProducentbestallningState', ['$rootScope', '$q', 'User', 'BestallningState', 'LogicalAddress', 'Url',
    function ($rootScope, $q, User, BestallningState, LogicalAddress, Url) {
      var _order;

      var init = function () {
        console.info('--- Producentbestallning.init() ---');
        var deferred = $q.defer();
        _order = {
          producentanslutningar: []
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
      };

      var setNamnPaEtjanst = function(namnPaEtjanst) {
        _order.namnPaEtjanst = namnPaEtjanst;
      };

      var setNat = function (natArr) {
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
            _populateAnslutningWithRivtaProfilAndUrl(serviceComponent, nyAnslutning, environment);
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
        var logiskAdressId = _.pick(logiskAdress, 'hsaId');
        if (angular.isDefined(anslutning.nyaLogiskaAdresser)) {
          _.remove(anslutning.nyaLogiskaAdresser, logiskAdressId);
        }
        if (angular.isDefined(anslutning.befintligaLogiskaAdresser) && _.find(anslutning.befintligaLogiskaAdresser, logiskAdressId)) {
          if (!anslutning.borttagnaLogiskaAdresser) {
            anslutning.borttagnaLogiskaAdresser = [];
          }
          if (!_.find(anslutning.borttagnaLogiskaAdresser, logiskAdressId)) {
            anslutning.borttagnaLogiskaAdresser.push(logiskAdress);
          }
        }
        $rootScope.$broadcast('logisk-adress-removed');
      };

      var addLogiskAdressToAnslutning = function (logiskAdress, anslutning) {
        var nyLogiskAdress = _.clone(logiskAdress);
        var logiskAdressId = _.pick(nyLogiskAdress, 'hsaId');
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

      var addTjanstekonsument = function (tjanstekomponent) {
        if (!_order.konsumentbestallningar) {
          _order.konsumentbestallningar = [];
        }
        var konsumentbestallningId = {
          tjanstekomponent: {
            hsaId: tjanstekomponent.hsaId
          }
        };

        if (!_.find(_order.konsumentbestallningar, konsumentbestallningId)) {
          _order.konsumentbestallningar.push({
            tjanstekomponent: _.cloneDeep(tjanstekomponent)
          });
        } else {
          console.log('tjanstekomponent (konsument) already added');
        }
      };

      var removeTjanstekonsument = function (tjanstekomponent) {
        var konsumentbestallningId = {
          tjanstekomponent: {
            hsaId: tjanstekomponent.hsaId
          }
        };
        _.remove(_order.konsumentbestallningar, konsumentbestallningId);
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

      var _populateAnslutningWithExistingLogiskaAdresser = function (anslutning, tjanstekomponentHsaId, driftmiljoId) {
        LogicalAddress.getConnectedLogicalAddressesForContract(tjanstekomponentHsaId, driftmiljoId, anslutning.tjanstekontraktNamnrymd, anslutning.tjanstekontraktMajorVersion, anslutning.tjanstekontraktMinorVersion).then(function (anslutnaLogiskaAdresser) {
          _.each(anslutnaLogiskaAdresser, function (logiskAdress) {
            var where = {hsaId: logiskAdress.hsaId};
            if (!_.find(anslutning.borttagnaLogiskaAdresser, where)) {
              logiskAdress._existing = true;
              addLogiskAdressToAnslutning(logiskAdress, anslutning);
            }
          });
        });
      };

      var _populateAnslutningWithRivtaProfilAndUrl = function (serviceComponent, anslutning, environment) {
        Url.getUrlAndProfile(serviceComponent.hsaId, environment.id, anslutning.tjanstekontraktNamnrymd, anslutning.tjanstekontraktMajorVersion, anslutning.tjanstekontraktMinorVersion).then(function (urlAndProfile) {
          if (urlAndProfile.rivProfil) {
            anslutning.rivtaProfil = urlAndProfile.rivProfil;
            anslutning.tidigareRivtaProfil = urlAndProfile.rivProfil;
          }
          if (urlAndProfile.url) {
            anslutning.url = urlAndProfile.url;
            anslutning.tidigareUrl = urlAndProfile.url;
          }
        });
      };

      return {
        init: init,
        current: order,
        setTjanstekomponent: setTjanstekomponent,
        setNamnPaEtjanst: setNamnPaEtjanst,
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
        addTjanstekonsument: addTjanstekonsument,
        removeTjanstekonsument: removeTjanstekonsument

      };
    }]);
