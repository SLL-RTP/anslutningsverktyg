'use strict';

/**
 * @ngdoc function
 * @name avApp.controller:AnslutCtrl
 * @description
 * # AnslutCtrl
 * Controller of the avApp
 */

angular.module('avApp')
  .controller('ConnectServiceProducerCtrl', ['$rootScope', '$scope', '$q', '$log', '$timeout', 'ServiceDomain', 'ServiceContract', 'ServiceComponent', 'Url', 'environments', 'rivProfiles', 'currentUser', 'LogicalAddress', 'Order', 'configuration', '$state', 'intersectionFilter',
    function ($rootScope, $scope, $q, $log, $timeout, ServiceDomain, ServiceContract, ServiceComponent, Url, environments, rivProfiles, currentUser, LogicalAddress, Order, configuration, $state, intersectionFilter) {
      $scope.targetEnvironments = environments;
      $scope.rivProfiles = rivProfiles;
      $scope.showDevStuff = configuration.devDebug;

      $scope.order = {
        driftmiljo: {},
        producentbestallning: {
          tjanstekomponent: {},
          producentanslutningar: []
        },
        bestallare: currentUser
      };

      $scope.selectedTjanstekonsument = {};

      $scope.serviceDomains = [];

      $scope.selectedTargetEnvironment = {};
      $scope.selectedServiceDomain = {};
      $scope.serviceContractsInSelectedDomain = [];

      $scope.selectedLogicalAddress = {};
      $scope.existingLogicalAddresses = [];
      $scope.selectedExistingLogicalAddresses = [];

      $scope.linkLogicalAddressChoice = 'sameForAllAnslutningar';

      $scope.orderValid = true;


      $scope.canHandleLogiskaAdresserInUnity = true;

      $scope.getFilteredTjanstekomponenter = function(query) {
        var deferred = $q.defer();
        if (!_.isEmpty(query)) {
          ServiceComponent.getFilteredServiceComponents(query, $scope.order.driftmiljo.id).then(function (result) {
            if ($scope.order.producentbestallning.tjanstekomponent && $scope.order.producentbestallning.tjanstekomponent.hsaId) {
              _.remove(result, {hsaId: $scope.order.producentbestallning.tjanstekomponent.hsaId});
            }
            deferred.resolve(result);
          });
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };

      $scope.$watch('selectedTjansteproducent', function (newValue) {
          if (newValue) {
            reset();
            if (angular.isDefined(newValue.beskrivning)) { //FIXME: fix until backend returns service components also from TAK on this query
              ServiceComponent.getServiceComponent(newValue.hsaId, $scope.order.driftmiljo.id).then(function (result) {
                console.log(result);
                $scope.order.producentbestallning.tjanstekomponent = result;
              });
            } else {
              console.log('detected producer from TAK');
              $scope.order.producentbestallning.tjanstekomponent = _.clone(newValue);
            }
          } else {
            reset();
          }
        }
      );

      $scope.$watch('callPermissionInSeparateOrder', function () {
        $scope.order.konsumentbestallningar = [];
      });

      $scope.$watch('linkLogicalAddressChoice', function () {
        _resetLogiskaAdresserForAllAnslutningar();
      });

      $scope.driftmiljoSelected = function () {
        resetServiceComponent();
        ServiceDomain.listDomains().then(function (domains) {
          $scope.serviceDomains = domains;
        });
      };

      $scope.tjanstedomanSelected = function () {
        if ($scope.order.driftmiljo && $scope.order.producentbestallning.tjanstekomponent && $scope.selectedTjanstedoman) {
          var serviceComponentId = $scope.order.producentbestallning.tjanstekomponent.hsaId;
          var environmentId = $scope.order.driftmiljo.id;
          var serviceDomainId = $scope.selectedTjanstedoman.tjansteDomanId;
          ServiceContract.listAnslutningar(serviceComponentId, environmentId, serviceDomainId).then(function (anslutningar) {
            $scope.anslutningarIValdTjanstedoman = _.map(anslutningar, function (anslutning) {
              anslutning._paBestallning = _isAnslutningOnOrder(anslutning);
              return anslutning;
            });
          });
        }
      };

      $scope.$watchCollection('order.producentbestallning.producentanslutningar', function () {
        $scope.anslutningarIValdTjanstedoman = _.map($scope.anslutningarIValdTjanstedoman, function (anslutning) {
          anslutning._paBestallning = _isAnslutningOnOrder(anslutning);
          return anslutning;
        });
      });

      $scope.$watch('canHandleLogiskaAdresserInUnity', function () {
        if (!$scope.canHandleLogiskaAdresserInUnity) {
          $scope.linkLogicalAddressChoice = 'individualPerAnslutning';
        }
      });

      $scope.$on('logisk-adress-added', _.debounce(function () {
        _recalculateLogiskaAdresserUnity();
      }, 100));

      $scope.$on('logisk-adress-removed', _.debounce(function () {
        _recalculateLogiskaAdresserUnity();
      }, 100));

      $scope.$on('anslutning-added', _.debounce(function () {
        _recalculateLogiskaAdresserUnity();
      }, 100));

      $scope.$on('anslutning-removed', _.debounce(function () {
        _recalculateLogiskaAdresserUnity();
      }, 100));

      /**
       * calculate whether the user should be allowed to handle 'anslutningar' in a unified fashion or
       * if she must configure them separately
       * @private
       */
      var _recalculateLogiskaAdresserUnity = function () {
        var nyaLogiskaAdresserIntersection = intersectionFilter($scope.order.producentbestallning.producentanslutningar, 'nyaLogiskaAdresser');
        var befintligaLogiskaAdresserIntersection = intersectionFilter($scope.order.producentbestallning.producentanslutningar, 'befintligaLogiskaAdresser');

        var nyaLogiskaAdresserUnity = _.isUndefined(nyaLogiskaAdresserIntersection);
        if (!nyaLogiskaAdresserUnity) {
          nyaLogiskaAdresserUnity = _.every(_.map($scope.order.producentbestallning.producentanslutningar, 'nyaLogiskaAdresser'), function (laArr) {
            var diff = _.difference(_.map(laArr, 'hsaId'), _.map(nyaLogiskaAdresserIntersection, 'hsaId'));
            return diff.length === 0;
          });
        }
        var befintligaLogiskaAdresserUnity = _.isUndefined(befintligaLogiskaAdresserIntersection);
        if (!befintligaLogiskaAdresserUnity) {
          befintligaLogiskaAdresserUnity = _.every(_.map($scope.order.producentbestallning.producentanslutningar, 'befintligaLogiskaAdresser'), function (laArr) {
            var diff = _.difference(_.map(laArr, 'hsaId'), _.map(befintligaLogiskaAdresserIntersection, 'hsaId'));
            return diff.length === 0;
          });
        }
        var uniq = _.uniq($scope.order.producentbestallning.producentanslutningar, 'installedForProducerHsaId');
        var mid = (nyaLogiskaAdresserUnity && befintligaLogiskaAdresserUnity && uniq.length === 1);
        $timeout(function () {
          $scope.canHandleLogiskaAdresserInUnity = mid;
        });
      };

      $scope.updateValdaAnslutningar = function () {
        _.each(_.filter($scope.anslutningarIValdTjanstedoman, '_selected'), function (anslutning) {
          _addAnslutningToOrder(anslutning);
          delete anslutning._selected; //deselect in UI
        });
      };

      $scope.removeAnslutningFromOrder = function (anslutning) {
        _removeAnslutningFromOrder(anslutning);
      };

      $scope.getFilteredLogiskaAdresser = function(queryString) {
        var deferred = $q.defer();
        deferred.resolve(LogicalAddress.getFilteredLogicalAddresses(queryString));
        return deferred.promise;
      };

      $scope.addLogiskAdressToAllAnslutningar = function (logiskAdress) {
        _addLogiskAdressToAllAnslutningar(logiskAdress);
      };

      $scope.addLogiskAdressToAnslutning = function (logicalAddress, anslutning) {
        _addLogiskAdressToAnslutning(logicalAddress, anslutning);
      };

      $scope.removeLogiskAdressFromAllAnslutningar = function (logiskAdress) {
        _removeLogiskAdressFromAllAnslutningar(logiskAdress);
      };

      $scope.removeLogiskAdressFromAnslutning = function (logiskAdress, anslutning) {
        _removeLogiskAdressFromAnslutning(logiskAdress, anslutning);
      };

      $scope.sendServiceProducerConnectionOrder = function () {
        if (!validateForms()) {
          console.log('order is not valid');
          $scope.orderValid = false;
        } else {
          console.log('order is valid');
          $scope.orderValid = true;
          Order.createServiceProducerConnectionOrder($scope.order).then(function (status) {
            console.log('Status: ' + status);
            if (status === 201) {
              console.log('Going to state');
              $state.go('serviceProducerOrderConfirmed');
            }
          });

        }
      };

      $scope.copyPersonInChargeToClient = function () {
        $scope.order.bestallare = _.omit($scope.order.producentbestallning.tjanstekomponent.huvudansvarigKontakt, ['hsaId']);
      };

      $scope.addTjanstekonsumentToOrder = function(tjanstekomponent) {
        if (!$scope.order.konsumentbestallningar) {
          $scope.order.konsumentbestallningar = [];
        }
        var konsumentbestallningId = {
          tjanstekomponent: {
            hsaId: tjanstekomponent.hsaId
          }
        };

        if (!_.find($scope.order.konsumentbestallningar, konsumentbestallningId)) {
          $scope.order.konsumentbestallningar.push({
            tjanstekomponent: _.cloneDeep(tjanstekomponent)
          });
        } else {
          console.log('tjanstekomponent (konsument) already added');
        }
      };

      $scope.removeTjanstekonsumentFromOrder = function(tjanstekomponent) {
        var konsumentbestallningId = {
          tjanstekomponent: {
            hsaId: tjanstekomponent.hsaId
          }
        };
        _.remove($scope.order.konsumentbestallningar, konsumentbestallningId);
      };

      var _addLogiskAdressToAllAnslutningar = function (logiskAdress) {
        _.forEach($scope.order.producentbestallning.producentanslutningar, function (anslutning) {
          _addLogiskAdressToAnslutning(logiskAdress, anslutning);
        });
      };

      var _addLogiskAdressToAnslutning = function (logiskAdress, anslutning) {
        var logiskAdressId = {hsaId: logiskAdress.hsaId};
        if (logiskAdress._existing) {
          if (_.isUndefined(anslutning.befintligaLogiskaAdresser)) {
            anslutning.befintligaLogiskaAdresser = [];
          }
          if (!_isLogiskAdressOnAnslutning(logiskAdress, anslutning)) {
            anslutning.befintligaLogiskaAdresser.push(_.omit(logiskAdress, '_existing'));
          } else {
            $log.warn('Can\'t add logisk adress twice');
          }
        } else {
          if (_.isUndefined(anslutning.nyaLogiskaAdresser)) {
            anslutning.nyaLogiskaAdresser = [];
          }
          if (!_isLogiskAdressOnAnslutning(logiskAdress, anslutning)) {
            if (_isLogiskAdressInBorttagnaLogiskaAdresser(logiskAdress, anslutning)) {
              _.remove(anslutning.borttagnaLogiskaAdresser, logiskAdressId);
            } else {
              anslutning.nyaLogiskaAdresser.push(logiskAdress);
            }
          } else {
            $log.warn('Can\'t add logisk adress twice');

          }
        }
        $scope.$broadcast('logisk-adress-added');
      };

      var _isLogiskAdressOnAnslutning = function (logiskAdress, anslutning) {
        var logiskAdressId = {hsaId: logiskAdress.hsaId};
        if (anslutning.nyaLogiskaAdresser && _.find(anslutning.nyaLogiskaAdresser, logiskAdressId)) {
          return true;
        }
        if (anslutning.befintligaLogiskaAdresser && _.find(anslutning.befintligaLogiskaAdresser, logiskAdressId)) {
          if (_isLogiskAdressInBorttagnaLogiskaAdresser(logiskAdress, anslutning)) {
            return false;
          }
          return true;
        }
        return false;
      };

      var _isLogiskAdressInBorttagnaLogiskaAdresser = function (logiskAdress, anslutning) {
        return (anslutning.borttagnaLogiskaAdresser && _.find(anslutning.borttagnaLogiskaAdresser, {hsaId: logiskAdress.hsaId}));
      };

      var _removeLogiskAdressFromAllAnslutningar = function (logiskAdress) {
        _.each($scope.order.producentbestallning.producentanslutningar, function (anslutning) {
          _removeLogiskAdressFromAnslutning(logiskAdress, anslutning);
        });
      };

      var _removeLogiskAdressFromAnslutning = function (logiskAdress, anslutning) {
        var logiskAdressId = logiskAdress.hsaId;
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
        $scope.$broadcast('logisk-adress-removed');
      };

      var _addAnslutningToOrder = function (anslutning) {
        console.log('add: ' + anslutning.tjanstekontraktNamnrymd + ', _anslutetForProducent: ' + anslutning._anslutetForProducent);
        if (!_isAnslutningOnOrder(anslutning)) {
          var nyAnslutning = _.cloneDeep(anslutning);
          //TODO: how to handle logiska adresser already added to anslutningar when new anslutning is to be added?
          if (nyAnslutning._anslutetForProducent) {
            var serviceComponent = $scope.order.producentbestallning.tjanstekomponent;
            var environment = $scope.order.driftmiljo;
            _populateAnslutningWithExistingLogiskaAdresser(nyAnslutning, serviceComponent.hsaId, environment.id);
            _populateAnslutningWithRivtaProfilAndUrl(serviceComponent, nyAnslutning, environment);
          }
          $scope.order.producentbestallning.producentanslutningar.push(nyAnslutning);
          $scope.$broadcast('anslutning-added');
        }
      };

      var _populateAnslutningWithExistingLogiskaAdresser = function (anslutning, tjanstekomponentHsaId, driftmiljoId) {
        LogicalAddress.getConnectedLogicalAddressesForContract(tjanstekomponentHsaId, driftmiljoId, anslutning.tjanstekontraktNamnrymd, anslutning.tjanstekontraktMajorVersion, anslutning.tjanstekontraktMinorVersion).then(function (anslutnaLogiskaAdresser) {
          _.each(anslutnaLogiskaAdresser, function (logiskAdress) {
            var where = {hsaId: logiskAdress.hsaId};
            if (!_.find(anslutning.borttagnaLogiskaAdresser, where)) {
              logiskAdress._existing = true;
              _addLogiskAdressToAnslutning(logiskAdress, anslutning);
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

      var _removeAnslutningFromOrder = function (anslutning) {
        var anslutningId = {
          tjanstekontraktNamnrymd: anslutning.tjanstekontraktNamnrymd,
          tjanstekontraktMajorVersion: anslutning.tjanstekontraktMajorVersion,
          tjanstekontraktMinorVersion: anslutning.tjanstekontraktMinorVersion
        };
        if (_isAnslutningOnOrder(anslutning)) {
          _.remove($scope.order.producentbestallning.producentanslutningar, anslutningId);
          $scope.$broadcast('anslutning-removed');
        }
      };

      var _isAnslutningOnOrder = function (anslutning) {
        var anslutningId = {
          tjanstekontraktNamnrymd: anslutning.tjanstekontraktNamnrymd,
          tjanstekontraktMajorVersion: anslutning.tjanstekontraktMajorVersion,
          tjanstekontraktMinorVersion: anslutning.tjanstekontraktMinorVersion
        };
        return _.find($scope.order.producentbestallning.producentanslutningar, anslutningId);
      };

      var reset = function () {
        $scope.selectedServiceDomain = {};
        $scope.selectedLogicalAddress = {};
        $scope.order = {
          driftmiljo: $scope.order.driftmiljo, //keep driftmiljo
          bestallare: $scope.order.bestallare, //keep client info
          producentbestallning: {
            tjanstekomponent: {},
            producentanslutningar: []
          }
        };
        $scope.selectedExistingLogicalAddresses = [];
        $scope.linkLogicalAddressChoice = 'sameForAllAnslutningar';
        $scope.requestForCallPermissionInSeparateOrder = true;

        //Reset all form validation that we might have done
        $scope.$broadcast('show-errors-reset');
        $scope.orderValid = true;
      };

      var resetServiceComponent = function () {
        $scope.order.producentbestallning.tjanstekomponent = {};
      };

      var _resetLogiskaAdresserForAllAnslutningar = function () {
        _.forEach($scope.order.producentbestallning.producentanslutningar, function (anslutning) {
          anslutning.nyaLogiskaAdresser = [];
          if (!_.isEmpty(anslutning.borttagnaLogiskaAdresser)) {
            anslutning.borttagnaLogiskaAdresser = [];
          }
        });
      };

      var validateForms = function () {
        $scope.$broadcast('show-errors-check-validity');
        //Get all divs with class form-group, since it is these that show the
        //has-success or has-error classes
        var formGroupElements = document.querySelectorAll('.form-group');
        return !_.any(formGroupElements, function (formGroup) {
            return angular.element(formGroup).hasClass('has-error');
          }
        );
      };
    }
  ]
);
