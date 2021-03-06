'use strict';
angular.module('avApp')
  .factory('ProducentbestallningState', ['$rootScope', '$q', '$log', 'BestallningState',
    function ($rootScope, $q, $log, BestallningState) {
      var _order;

      var init = function () {
        $log.debug('--- Producentbestallning.init() ---');
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
        _order.producentanslutningar = []; //reset when komponent changes
      };

      var setNat = function (natArr) {
        _order.nat = natArr;
      };

      var addAnslutningToOrder = function (anslutning) {
        $log.debug('add: ' + anslutning.tjanstekontraktNamnrymd, anslutning);
        if (!isAnslutningOnOrder(anslutning)) {
          var start = Date.now();
          var nyAnslutning = _.cloneDeep(anslutning);
          $log.debug('cloneDeep took ' + ((Date.now()) - start) + ' ms');
          //TODO: how to handle logiska adresser already added to anslutningar when new anslutning is to be added?
          if (nyAnslutning.logiskAdressStatuses && nyAnslutning.logiskAdressStatuses.length) {
            var serviceComponent = _order.tjanstekomponent;
            var environment = _order.driftmiljo;
            start = Date.now();
            _populateAnslutningWithExistingLogiskaAdresser(nyAnslutning, serviceComponent.hsaId, environment.id);
            $log.debug('_populateAnslutningWithExistingLogiskaAdresser took ' + ((Date.now()) - start) + ' ms');
            start = Date.now();
            _populateAnslutningWithRivtaProfilAndUrl(serviceComponent, nyAnslutning, environment);
            $log.debug('_populateAnslutningWithRivtaProfilAndUrl took ' + ((Date.now()) - start) + ' ms');
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
        if (tjanstekomponent && tjanstekomponent.hsaId && tjanstekomponent.hsaId.length) {
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
            $log.debug('tjanstekomponent (konsument) already added');
          }
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

      var resetLogicalAddresses = function () {
        _.each(_order.producentanslutningar, function(connection) {
          // we do not touch 'befintliga'
          _.assign(connection, {nyaLogiskaAdresser:[], borttagnaLogiskaAdresser: []});
        });
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

      var _populateAnslutningWithExistingLogiskaAdresser = function (anslutning) {
        if (anslutning.logiskAdressStatuses && anslutning.logiskAdressStatuses.length) {
          _.each(anslutning.logiskAdressStatuses, function(logiskAdressStatus) {
            if (!_.find(anslutning.borttagnaLogiskaAdresser, _.pick(logiskAdressStatus, 'hsaId'))) {
              logiskAdressStatus._existing = true;
              addLogiskAdressToAnslutning(logiskAdressStatus, anslutning);
            }
          });
        }
      };

      var _populateAnslutningWithRivtaProfilAndUrl = function (serviceComponent, anslutning) {
        if (anslutning.producentRivtaProfil) {
          anslutning.rivtaProfil = anslutning.producentRivtaProfil;
          anslutning.tidigareRivtaProfil = anslutning.producentRivtaProfil;
        }
        if (anslutning.producentUrl) {
          anslutning.url = anslutning.producentUrl;
          anslutning.tidigareUrl = anslutning.producentUrl;
        }
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
        resetLogicalAddresses: resetLogicalAddresses,
        addTjanstekonsument: addTjanstekonsument,
        removeTjanstekonsument: removeTjanstekonsument

      };
    }]);
