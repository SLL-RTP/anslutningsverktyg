'use strict';
angular.module('avApp')
  .factory('Bestallning', ['configuration', '$q', '$http', '$log',
    function (configuration, $q, $http, $log) {
      var orderFactory = {
        createProducentbestallning: function (producentBestallning, mainOrder) { //FIXME: duplicated until old flow is removed
          var deferred = $q.defer();
          var bestallningDTO = prepareProducentbestallning(producentBestallning, mainOrder);
          $log.debug(JSON.stringify(bestallningDTO, null, 2));
          $http.post(configuration.basePath + '/api/bestallning', bestallningDTO).success(function (data, status) {
            deferred.resolve(status);
          }).error(function () { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        },
        createKonsumentbestallning: function (konsumentBestallning, mainOrder) {
          var deferred = $q.defer();
          var bestallningDTO = prepareKonsumentbestallning(konsumentBestallning, mainOrder);
          $log.debug(JSON.stringify(bestallningDTO, null, 2));
          $http.post(configuration.basePath + '/api/bestallning', bestallningDTO).success(function (data, status) {
            deferred.resolve(status);
          }).error(function () { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };

      var prepareProducentbestallning = function(order, mainOrder) {
        var driftmiljo = cleanObj(order.driftmiljo);
        var bestallare = cleanObj(order.bestallare);
        var tjanstekomponent = cleanObj(order.tjanstekomponent);
        tjanstekomponent.huvudansvarigKontakt = cleanObj(tjanstekomponent.huvudansvarigKontakt);
        tjanstekomponent.tekniskKontakt = cleanObj(tjanstekomponent.tekniskKontakt);
        tjanstekomponent.tekniskSupportKontakt = cleanObj(tjanstekomponent.huvudansvarigKontakt);
        var bestallningDTO = {
          driftmiljo: driftmiljo,
          bestallare: bestallare,
          bestallareRoll: mainOrder.bestallareRoll,
          producentbestallning: {
            tjanstekomponent: tjanstekomponent
          },
          otherInfo: mainOrder.otherInfo
        };
        var producentanslutningar = [];
        var uppdateradProducentanslutningar = [];
        _.each(order.producentanslutningar, function(anslutning) {
          var cleanAnslutning = cleanObj(anslutning);
          delete cleanAnslutning.installeratIDriftmiljo;
          delete cleanAnslutning.logiskAdressStatuses;
          delete cleanAnslutning.producentRivtaProfil;
          delete cleanAnslutning.producentUrl;
          if (isUppdateraProducentAnslutning(cleanAnslutning)) {
            if (isUppdateraProducentAnslutningChanged(cleanAnslutning)) { //if nothing has changed, do not use it.   TODO: handle this in controller to provide feedback to user?
              cleanAnslutning.befintligaLogiskaAdresser = [];
              if (!_.isEmpty(cleanAnslutning.nyaLogiskaAdresser)) {
                cleanAnslutning.nyaLogiskaAdresser = _.map(cleanAnslutning.nyaLogiskaAdresser, function (logiskAdress) {
                  return cleanObj(logiskAdress);
                });
              }
              if (!_.isEmpty(cleanAnslutning.borttagnaLogiskaAdresser)) {
                cleanAnslutning.borttagnaLogiskaAdresser = _.map(cleanAnslutning.borttagnaLogiskaAdresser, function (logiskAdress) {
                  return cleanObj(logiskAdress);
                });
              }
              uppdateradProducentanslutningar.push(cleanAnslutning);
            }
          } else {
            if (!_.isEmpty(cleanAnslutning.nyaLogiskaAdresser)) {
              cleanAnslutning.nyaLogiskaAdresser = _.map(cleanAnslutning.nyaLogiskaAdresser, function(logiskAdress) {
                return cleanObj(logiskAdress);
              });
            }
            producentanslutningar.push(cleanAnslutning);
          }
        });
        bestallningDTO.producentbestallning.producentanslutningar = producentanslutningar;
        bestallningDTO.producentbestallning.uppdateradProducentanslutningar = uppdateradProducentanslutningar;
        if (order.konsumentbestallningar && !_.isEmpty(order.konsumentbestallningar)) {
          bestallningDTO.konsumentbestallningar = [];
          _.each(order.konsumentbestallningar, function(konsumentbestallning) {
            var fixedKonsumentbestallning = {
              tjanstekomponent: cleanObj(konsumentbestallning.tjanstekomponent)
            };
            fixedKonsumentbestallning.konsumentanslutningar = [];
            var producentToKonsumentanslutningFilter = function(producentanslutning) {
              return producentanslutning.nyaLogiskaAdresser && producentanslutning.nyaLogiskaAdresser.length;
            };
            //only use producentanslutningar/uppdateradProducentanslutningar that contains nyaLogiskaAdresser
            _.each(_.filter(producentanslutningar, producentToKonsumentanslutningFilter), function(producentanslutning) {
              fixedKonsumentbestallning.konsumentanslutningar.push(_.omit(producentanslutning, ['rivtaProfil', 'url']));
            });
            _.each(_.filter(uppdateradProducentanslutningar, producentToKonsumentanslutningFilter), function(producentanslutning) {
              //only use nyaLogiskaAdresser among the *LogiskaAdresser collections
              fixedKonsumentbestallning.konsumentanslutningar.push(_.omit(producentanslutning, ['rivtaProfil', 'url', 'tidigareRivtaProfil', 'tidigareUrl', 'borttagnaLogiskaAdresser', 'befintligaLogiskaAdresser']));
            });
            bestallningDTO.konsumentbestallningar.push(fixedKonsumentbestallning);
          });
        }
        return bestallningDTO;
      };

      var prepareKonsumentbestallning = function(order, mainOrder) {
        var driftmiljo = cleanObj(order.driftmiljo);
        var bestallare = cleanObj(order.bestallare);
        var tjanstekomponent = cleanObj(order.tjanstekomponent);
        tjanstekomponent.huvudansvarigKontakt = cleanObj(tjanstekomponent.huvudansvarigKontakt);
        tjanstekomponent.tekniskKontakt = cleanObj(tjanstekomponent.tekniskKontakt);
        tjanstekomponent.tekniskSupportKontakt = cleanObj(tjanstekomponent.huvudansvarigKontakt);
        var bestallningDTO = {
          driftmiljo: driftmiljo,
          bestallare: bestallare,
          bestallareRoll: mainOrder.bestallareRoll,
          konsumentbestallningar: [{tjanstekomponent: tjanstekomponent}],
          otherInfo: mainOrder.otherInfo
        };
        var konsumentanslutningar = [];
        var uppdateradKonsumentanslutningar = [];
        _.each(order.konsumentanslutningar, function(anslutning) {
          var cleanAnslutning;
          if (isUppdateraKonsumentanslutning(anslutning)) {
            cleanAnslutning = cleanObj(anslutning);
            if (!_.isEmpty(cleanAnslutning.nyaLogiskaAdresser)) {
              cleanAnslutning.nyaLogiskaAdresser = _.map(cleanAnslutning.nyaLogiskaAdresser, function (logiskAdress) {
                return cleanObj(logiskAdress);
              });
            }
            if (!_.isEmpty(cleanAnslutning.borttagnaLogiskaAdresser)) {
              cleanAnslutning.borttagnaLogiskaAdresser = _.map(cleanAnslutning.borttagnaLogiskaAdresser, function (logiskAdress) {
                return cleanObj(logiskAdress);
              });
            }
            uppdateradKonsumentanslutningar.push(cleanAnslutning);
          } else {
            cleanAnslutning = cleanObj(anslutning);
            if (!_.isEmpty(cleanAnslutning.nyaLogiskaAdresser)) {
              cleanAnslutning.nyaLogiskaAdresser = _.map(cleanAnslutning.nyaLogiskaAdresser, function(logiskAdress) {
                return cleanObj(logiskAdress);
              });
            }
            delete cleanAnslutning.borttagnaLogiskaAdresser;
            konsumentanslutningar.push(cleanAnslutning);
          }
        });
        bestallningDTO.konsumentbestallningar[0].konsumentanslutningar = konsumentanslutningar;
        bestallningDTO.konsumentbestallningar[0].uppdateradKonsumentanslutningar = uppdateradKonsumentanslutningar;
        return bestallningDTO;
      };

      var isUppdateraProducentAnslutning = function(anslutning) {
        return ((anslutning.befintligaLogiskaAdresser && anslutning.befintligaLogiskaAdresser.length > 0) || anslutning.tidigareRivtaProfil || anslutning.tidigareUrl);
      };

      var isUppdateraKonsumentanslutning = function(anslutning) {
        return anslutning._existing; //do not cleanObj before running isUppdateraKonsumentanslutning
      };

      var isUppdateraProducentAnslutningChanged = function(uppdateraProducentanslutning) {
        return uppdateraProducentanslutning.rivtaProfil !== uppdateraProducentanslutning.tidigareRivtaProfil ||
          uppdateraProducentanslutning.url !== uppdateraProducentanslutning.tidigareUrl ||
          !_.isEmpty(uppdateraProducentanslutning.nyaLogiskaAdresser) ||
          !_.isEmpty(uppdateraProducentanslutning.borttagnaLogiskaAdresser);
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

      return orderFactory;
    }]);
