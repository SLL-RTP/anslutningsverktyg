'use strict';
angular.module('avApp')
  .factory('Order', ['configuration', '$q', '$http',
    function (configuration, $q, $http) {
      var orderFactory = {
        createServiceProducerConnectionOrder: function (order) {
          var deferred = $q.defer();
          var bestallningDTO = fixOrder(order);
          console.log(JSON.stringify(bestallningDTO, null, 2));
          $http.post(configuration.basePath + '/api/bestallning', bestallningDTO).success(function (data, status) {
            deferred.resolve(status);
          }).error(function () { //TODO: handle errors
            deferred.reject();
          });
          return deferred.promise;
        }
      };

      var fixOrder = function(order) {
        var driftmiljo = cleanObj(order.driftmiljo);
        var bestallare = cleanObj(order.bestallare);
        var tjanstekomponent = cleanObj(order.producentbestallning.tjanstekomponent);
        tjanstekomponent.huvudansvarigKontakt = cleanObj(tjanstekomponent.huvudansvarigKontakt);
        tjanstekomponent.tekniskKontakt = cleanObj(tjanstekomponent.tekniskKontakt);
        tjanstekomponent.tekniskSupportKontakt = cleanObj(tjanstekomponent.huvudansvarigKontakt);
        var bestallningDTO = {
          driftmiljo: driftmiljo,
          bestallare: bestallare,
          bestallareRoll: order.bestallareRoll,
          producentbestallning: {
            tjanstekomponent: tjanstekomponent
          },
          otherInfo: order.otherInfo
        };
        var producentanslutningar = [];
        var uppdateradProducentanslutningar = [];
        _.each(order.producentbestallning.producentanslutningar, function(anslutning) {
          var cleanAnslutning = cleanObj(anslutning);
          if (isUppdateraProducentAnslutning(cleanAnslutning)) { //if nothing has changed, do not use it.   TODO: handle this in controller to provide feedback to user?
            if (isUppdateraProducentAnslutningChanged) {

              if (!_.isEmpty(cleanAnslutning.befintligaLogiskaAdresser)) {
                cleanAnslutning.befintligaLogiskaAdresser = _.map(cleanAnslutning.befintligaLogiskaAdresser, function (logiskAdress) {
                  return cleanObj(logiskAdress);
                });
              }
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
            _.each(producentanslutningar, function(producentanslutning) {
              fixedKonsumentbestallning.konsumentanslutningar.push(_.omit(producentanslutning, ['rivtaProfil', 'url']));
            });
            _.each(uppdateradProducentanslutningar, function(producentanslutning) {
              fixedKonsumentbestallning.konsumentanslutningar.push(_.omit(producentanslutning, ['rivtaProfil', 'url', 'tidigareRivtaProfil', 'tidigareUrl']));
            });
            bestallningDTO.konsumentbestallningar.push(fixedKonsumentbestallning);
          });
        }
        return bestallningDTO;
      };

      var isUppdateraProducentAnslutning = function(anslutning) {
        return ((anslutning.befintligaLogiskaAdresser && anslutning.befintligaLogiskaAdresser.length > 0) || anslutning.tidigareRivtaProfil || anslutning.tidigareUrl);
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
