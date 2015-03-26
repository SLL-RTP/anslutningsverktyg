'use strict';

angular.module('avApp')
  .controller('UpdateServiceProducerCtrl', ['$rootScope', '$scope', '$log', 'ServiceDomain', 'ServiceContract', 'ServiceComponent', 'Url', 'environments', 'rivProfiles', 'LogicalAddress', 'Order', 'configuration', '$state',
    function ($rootScope, $scope, $log, ServiceDomain, ServiceContract, ServiceComponent, Url, environments, rivProfiles, LogicalAddress, Order, configuration, $state) {
      $scope.environments = environments;
      $scope.rivProfiles = rivProfiles;

      $scope.newComponent = false;

      $scope.showDevStuff = configuration.devDebug;

      $scope.updateServiceProducerRequest = {
        serviceComponent: {},
        targetEnvironment: {},
        serviceDomain: {},
        serviceContracts: [],
        serviceConsumer: {},
        slaFullfilled: false,
        otherInfo: '',
        client: {
          name: '',
          email: '',
          phone: ''
        }
      };

      $scope.selectedServiceComponent = {};
      $scope.filteredServiceComponents = [];

      $scope.selectedServiceConsumer = {};
      $scope.filteredServiceConsumers = [];

      $scope.serviceDomains = [];

      $scope.selectedTargetEnvironment = {};
      $scope.selectedServiceDomain = {};

      $scope.selectedLogicalAddress = {};
      $scope.filteredLogicalAddresses = [];
      $scope.logicalAddresses = [];
      $scope.existingLogicalAddresses = [];
      $scope.selectedExistingLogicalAddresses = [];
      $scope.selectedServiceContracts = [];

      $scope.linkLogicalAddressChoice = 'sameForAllContracts';

      $scope.requestForCallPermissionInSeparateOrder = true; //Default

      $scope.orderValid = true;

      $scope.removedLogicalAddressesForAllContracts = [];
      $scope.removedLogicalAddressesPerContract = {};

      $scope.filterServiceComponents = function (query) {
        ServiceComponent.getFilteredServiceComponents(query).then(function (result) {
          $scope.filteredServiceComponents = result;
        });
      };

      $scope.filterServiceConsumers = function (query) {
        ServiceComponent.getFilteredServiceComponents(query).then(function (result) {
          //This line effectively removes, from the search result
          // the previously chosen service component
          if($scope.selectedServiceComponent.selected) {
            _.remove(result, {hsaId: $scope.selectedServiceComponent.selected.hsaId});
          }

          $scope.filteredServiceConsumers = result;
        });
      };

      $scope.getRemovedLogicalAddressesForContract = function(serviceContract) {
        if (!$scope.removedLogicalAddressesPerContract[_getServiceContractIdentifierString(serviceContract)]) {
          return [];
        } else {
          return $scope.removedLogicalAddressesPerContract[_getServiceContractIdentifierString(serviceContract)];
        }
      };

      $scope.$watch('newComponent', function() {
        resetServiceComponent();
      });

      $scope.$watch('selectedServiceComponent.selected', function (newValue) {
          if (newValue) {
            reset();
            if (angular.isDefined(newValue.namn)) { //FIXME: fix until backend returns service components also from TAK on this query
              ServiceComponent.getServiceComponent(newValue.hsaId).then(function (result) {
                $scope.updateServiceProducerRequest.serviceComponent = result;
              });
            } else {
              console.log('detected producer from TAK');
              $scope.updateServiceProducerRequest.serviceComponent = newValue;
            }
          } else {
            reset();
          }
        }
      );

      $scope.onSelectServiceConsumer = function(item, model) {
        ServiceComponent.getServiceComponent(item.hsaId).then(function (result) {
          $scope.updateServiceProducerRequest.serviceConsumer = result;
        });
      };

      $scope.$watch('linkLogicalAddressChoice', function() {
        _resetLogicalAddressesForServiceContracts();
        //_updateConnectedLogicalAddresses();
      });

      $scope.$watchCollection('selectedServiceContracts', function () {
        //_updateConnectedLogicalAddresses();
      });

      $scope.copyPersonInChargeToClient = function() {
        $scope.updateServiceProducerRequest.client.name = $scope.updateServiceProducerRequest.serviceComponent.huvudAnsvarigNamn;
        $scope.updateServiceProducerRequest.client.email = $scope.updateServiceProducerRequest.serviceComponent.huvudAnsvarigEpost;
        $scope.updateServiceProducerRequest.client.phone = $scope.updateServiceProducerRequest.serviceComponent.huvudAnsvarigTelefon;
      };

      $scope.copyPersonInChargeToTekniskKontakt = function() {
        $scope.updateServiceProducerRequest.serviceComponent.tekniskKontaktNamn = $scope.updateServiceProducerRequest.serviceComponent.huvudAnsvarigNamn;
        $scope.updateServiceProducerRequest.serviceComponent.tekniskKontaktEpost = $scope.updateServiceProducerRequest.serviceComponent.huvudAnsvarigEpost;
        $scope.updateServiceProducerRequest.serviceComponent.tekniskKontaktTelefon = $scope.updateServiceProducerRequest.serviceComponent.huvudAnsvarigTelefon;
      };

      $scope.targetEnvironmentSelected = function () {
        if ($scope.selectedTargetEnvironment && $scope.updateServiceProducerRequest.serviceComponent) {
          $scope.updateServiceProducerRequest.targetEnvironment = $scope.selectedTargetEnvironment;
          ServiceDomain.listDomains().then(function (domains) {
            $scope.serviceDomains = domains;
          });
        }
      };

      $scope.serviceDomainSelected = function () {
        if ($scope.selectedTargetEnvironment && $scope.updateServiceProducerRequest.serviceComponent && $scope.selectedServiceDomain) {
          var serviceComponentId = $scope.updateServiceProducerRequest.serviceComponent.hsaId;
          var environmentId = $scope.selectedTargetEnvironment.id;
          var serviceDomainId = $scope.selectedServiceDomain.tjansteDomanId;
          $scope.updateServiceProducerRequest.serviceDomain = $scope.selectedServiceDomain;
          ServiceContract.listContracts(serviceComponentId, environmentId, serviceDomainId).then(function (contracts) {
            $scope.serviceContractsInSelectedDomain = _.map(contracts, function(serviceContract) {
              serviceContract.onOrder = _isServiceContractSelected(serviceContract);
              return serviceContract;
            });
          });
        }
      };

      $scope.$watchCollection('selectedServiceContracts', function(newSelected, oldSelected) {
        $scope.serviceContractsInSelectedDomain = _.map(_.clone($scope.serviceContractsInSelectedDomain, true), function(serviceContract) {
          serviceContract.onOrder = _isServiceContractSelected(serviceContract);
          return serviceContract;
        });
      });

      $scope.updateSelectedServiceContracts = function() {
        _.chain($scope.serviceContractsInSelectedDomain)
          .filter('selected')
          .forEach(function(serviceContract) {
            _addServiceContractToOrder(serviceContract);
          });
      };

      $scope.removeServiceContract = function(serviceContract) {
        _removeServiceContractFromOrder(serviceContract);
      }

      $scope.filterLogicalAddresses = function (logicalAddressQuery) {
        LogicalAddress.getFilteredLogicalAddresses(logicalAddressQuery).then(function (logicalAddresses) {
            $scope.filteredLogicalAddresses = logicalAddresses;
          }
        );
      };

      /**
       *  use this one!
       * @param logicalAddress
       */
      $scope.addLogicalAddressToAllServiceContracts = function(logicalAddress) {
        var where = {hsaId: logicalAddress.hsaId};
        if (!_.find($scope.logicalAddresses, where)) {
          $scope.logicalAddresses.push(logicalAddress);
        }
        _addLogicalAddressToAllServiceContracts(logicalAddress);
      };

      /**
       * use this one!
       * @param logicalAddresses
       */
      $scope.addLogicalAddressesToAllServiceContracts = function(logicalAddresses) {
        _.each(logicalAddresses, function(logicalAddress) {
          var where = {hsaId: logicalAddress.hsaId};
          if (!_.find($scope.logicalAddresses, where)) {
            $scope.logicalAddresses.push(logicalAddress);
          }
          _addLogicalAddressToAllServiceContracts(logicalAddress);
        });
      };

      /**
       * use this one!
       * @param logicalAddress
       * @param serviceContract
       */
      $scope.addLogicalAddressToServiceContract = function(logicalAddress, serviceContract) {
        _addLogicalAddressToServiceContract(logicalAddress, serviceContract);
      };

      /**
       * use this one!
       * @param logicalAddresses
       * @param serviceContract
       */
      $scope.addLogicalAddressesToServiceContract = function(logicalAddresses, serviceContract) {
        _.each(logicalAddresses, function(logicalAddress) {
          _addLogicalAddressToServiceContract(logicalAddress, serviceContract);
        });
      };

      $scope.removeLogicalAddressFromAllServiceContracts = function(logicalAddress) {
        _removeLogicalAddressFromAllServiceContracts(logicalAddress);
        _.remove($scope.logicalAddresses, {hsaId: logicalAddress.hsaId});
        if (logicalAddress.existing) {
          _addLogicalAddressToGlobalRemovedList(logicalAddress);
        }
      };

      $scope.removeLogicalAddressFromServiceContract = function(logicalAddress, serviceContract) {
        _removeLogicalAddressFromServiceContract(logicalAddress, serviceContract);
      };

      $scope.sendServiceProducerConnectionUpdateOrder = function() {
        if (!validateForms()) {
          $scope.orderValid = false;
        } else {
          $scope.orderValid = true;
          Order.createServiceProducerConnectionUpdateOrder($scope.updateServiceProducerRequest).then(function(status) {
            console.log('Status: ' + status);
            if (status === 201) {
              $state.go('serviceProducerUpdateOrderConfirmed');
            }
          });
        }
      };

      var _addLogicalAddressToAllServiceContracts = function(logicalAddress) {
        _.forEach($scope.updateServiceProducerRequest.serviceContracts, function (serviceContract) {
          _addLogicalAddressToServiceContract(logicalAddress, serviceContract);
        });
      };

      var _addLogicalAddressToServiceContract = function(logicalAddress, serviceContract) {
        var clonedLogicalAddress = _.clone(logicalAddress);
        if (clonedLogicalAddress.existing) { //add to logicalAddresses
          if (!angular.isDefined(serviceContract.logicalAddresses)) {
            serviceContract.logicalAddresses = [];
          }
          if (!_.find(serviceContract.logicalAddresses, {hsaId: clonedLogicalAddress.hsaId})) {
            serviceContract.logicalAddresses.push(clonedLogicalAddress);
          } else {
            $log.log('Can\'t add logicalAddress twice');
          }
        } else { //add to newLogicalAddresses
          if (!angular.isDefined(serviceContract.newLogicalAddresses)) {
            serviceContract.newLogicalAddresses = [];
          }
          if (!_.find(serviceContract.newLogicalAddresses, {hsaId: clonedLogicalAddress.hsaId})) {
            serviceContract.newLogicalAddresses.push(clonedLogicalAddress);
          } else {
            $log.log('Can\'t add logicalAddress twice');
          }
        }
      };

      var _removeLogicalAddressFromAllServiceContracts = function(logicalAddress) {
        _.each($scope.updateServiceProducerRequest.serviceContracts, function(serviceContract) {
          _removeLogicalAddressFromServiceContract(logicalAddress, serviceContract);
        });
      };

      var _removeLogicalAddressFromServiceContract = function(logicalAddress, serviceContract) {
        var logicalAddressId = logicalAddress.hsaId;
        if (angular.isDefined(serviceContract.newLogicalAddresses)) {
          _.remove(serviceContract.newLogicalAddresses, {hsaId: logicalAddressId});
        }
        if (logicalAddress.existing) {
          if (!angular.isDefined(serviceContract.removedLogicalAddresses)) {
            serviceContract.removedLogicalAddresses = [];
          }
          if (!_.find(serviceContract.removedLogicalAddresses, {hsaId: logicalAddressId})) {
            serviceContract.removedLogicalAddresses.push(logicalAddress);
          }
        }
      };

      var _addLogicalAddressToGlobalRemovedList = function (logicalAddress) {
        if (!_.find($scope.removedLogicalAddressesForAllContracts, {hsaId: logicalAddress.hsaId})) {
          $scope.removedLogicalAddressesForAllContracts.push(logicalAddress);
        }
      };

      var addSelectedServiceContract = function (serviceContract) {
        var serviceContractIdentifier = _getServiceContractIdentifier(serviceContract);
        if (!_.find($scope.selectedServiceContracts, serviceContractIdentifier)) {
          $scope.selectedServiceContracts.push(serviceContract);
          var newServiceContract = _getCleanServiceContract(serviceContract);
          if ($scope.linkLogicalAddressChoice !== 'individualForContract' && $scope.logicalAddresses) {
            newServiceContract.logicalAddresses = _.filter($scope.logicalAddresses, function(logicalAddress) {
              return logicalAddress.existing ? _.clone(logicalAddress) : false;
            });
            newServiceContract.newLogicalAddresses = _.filter($scope.logicalAddresses, function(logicalAddress) {
              return !logicalAddress.existing ? _.clone(logicalAddress) : false;
            });
          }
          $scope.updateServiceProducerRequest.serviceContracts.push(newServiceContract);
        }
      };

      var removeSelectedServiceContract = function (serviceContract) {
        var serviceContractIdentifier = _getServiceContractIdentifier(serviceContract);
        if (_.find($scope.selectedServiceContracts, serviceContractIdentifier)) {
          _.remove($scope.selectedServiceContracts, serviceContractIdentifier);
          _.remove($scope.updateServiceProducerRequest.serviceContracts, serviceContractIdentifier);
        }
      };

      var _getServiceContractIdentifier = function(serviceContract) {
        return {
          namnrymd: serviceContract.namnrymd,
          majorVersion: serviceContract.majorVersion,
          minorVersion: serviceContract.minorVersion
        };
      };

      var _getServiceContractIdentifierString = function(serviceContract) {
        return serviceContract.namnrymd + '_' +
            serviceContract.majorVersion + '_' +
            serviceContract.minorVersion;
      };

      var _addServiceContractToOrder = function(serviceContract) {
        console.log('add: ' + serviceContract.namnrymd);
        if (!_isServiceContractSelected(serviceContract)) {
          $scope.selectedServiceContracts.push(serviceContract);
          var newServiceContract = _getCleanServiceContract(serviceContract);
          _populateServiceContractWithExistingLogicalAddresses(newServiceContract);
          var serviceComponent = $scope.updateServiceProducerRequest.serviceComponent;
          var environment = $scope.updateServiceProducerRequest.targetEnvironment;
          _populateServiceContractWithUrlAndProfile(serviceComponent, newServiceContract, environment);
          var serviceContracts = $scope.updateServiceProducerRequest.serviceContracts;
          var index = _.indexOf(serviceContracts, _.find(serviceContracts, _getServiceContractIdentifier(newServiceContract)));
          if (index === -1) {
            serviceContracts.push(newServiceContract);
          } else {
            serviceContracts.splice(index, 1, newServiceContract); //replace
          }
        }
      };

      var _populateServiceContractWithExistingLogicalAddresses = function(serviceContract) {
        console.log('serviceContract');
        console.log(serviceContract);
        LogicalAddress.getConnectedLogicalAddressesForContract('hello', 'hey', 'whats', 1, 0).then(function(connectedLogicalAddresses) {
          _.each(connectedLogicalAddresses, function (logicalAddress) {
            console.log(logicalAddress);
            var where = {hsaId: logicalAddress.hsaId};
            if (!_.find(serviceContract.removedLogicalAddresses, where)) {
              logicalAddress.existing = true;
              _addLogicalAddressToServiceContract(logicalAddress, serviceContract);
            }
          });
        });
      };

      var _populateServiceContractWithUrlAndProfile = function(serviceComponent, serviceContract, environment) {
        Url.getUrlAndProfile(serviceComponent.hsaId, environment.id, serviceContract.namnrymd, serviceContract.majorVersion, serviceContract.minorVersion).then(function(urlAndProfile) {
          serviceContract.address = urlAndProfile;
        });
      };

      var _removeServiceContractFromOrder = function(serviceContract) {
        console.log('remove: ' + serviceContract.namnrymd);
        var serviceContractIdentifier = {
          namnrymd: serviceContract.namnrymd,
          majorVersion: serviceContract.majorVersion,
          minorVersion: serviceContract.minorVersion
        };
        if (_isServiceContractSelected(serviceContract)) {
          _.remove($scope.selectedServiceContracts, serviceContractIdentifier);
          _.remove($scope.updateServiceProducerRequest.serviceContracts, serviceContractIdentifier);
        }
      };

      var _isServiceContractSelected = function(serviceContract) {
        var serviceContractIdentifier = {
          namnrymd: serviceContract.namnrymd,
          majorVersion: serviceContract.majorVersion,
          minorVersion: serviceContract.minorVersion
        };
        return _.find($scope.selectedServiceContracts, serviceContractIdentifier);
      };

      var _getCleanServiceContract = function(serviceContract) {
        return _.cloneDeep(serviceContract);
      };

      var reset = function () {
        $scope.selectedTargetEnvironment = {};
        $scope.selectedServiceDomain = {};
        $scope.selectedLogicalAddress = {};
        $scope.updateServiceProducerRequest = {
          serviceComponent: {},
          targetEnvironment: {},
          serviceDomain: {},
          serviceContracts: [],
          serviceConsumer: {},
          slaFullfilled: false,
          otherInfo: '',
          client: $scope.updateServiceProducerRequest.client //keep client info
        };
        $scope.selectedExistingLogicalAddresses = [];
        $scope.selectedServiceContracts = [];
        $scope.linkLogicalAddressChoice = 'sameForAllContracts';
        $scope.selectedServiceConsumer = {};
        $scope.requestForCallPermissionInSeparateOrder = true;
        $scope.logicalAddresses = []; //So we don't get any logical address lingering in the tags input

      };

      var resetServiceComponent = function() {
        delete $scope.selectedServiceComponent.selected;
        $scope.updateServiceProducerRequest.serviceComponent = {};
      };

      var _resetLogicalAddressesForServiceContracts = function() {
        _.forEach($scope.updateServiceProducerRequest.serviceContracts, function(serviceContract) {
          serviceContract.logicalAddresses = [];
          serviceContract.newLogicalAddresses = [];
          serviceContract.removedLogicalAddresses = [];
          _populateServiceContractWithExistingLogicalAddresses(serviceContract);
        });
        $scope.logicalAddresses = [];
        $scope.removedLogicalAddressesForAllContracts = [];
        $scope.removedLogicalAddressesPerContract = {};
      };

      //used as filter function
      $scope.logicalAddressNotIn = function(logicalAddresses) {
        return function(logicalAddress) {
          return !_.find(logicalAddresses, {hsaId: logicalAddress.hsaId});
        }
      };

      $scope.logicalAddressesIntersection = function(collName) {
        var arrays = _.map($scope.updateServiceProducerRequest.serviceContracts, collName);
        var first = _.first(arrays);
        if (arrays.length === 1) {
          return first;
        }
        var rest = _.rest(arrays);
        return _.filter(first, function(val) {
          var tmp = [];
          _.each(rest, function(arr) {
            var match = _.first(_.filter(arr, function(comparison) {
              return angular.equals(val, comparison); //need the angular version since it handles the angular $$hashKey's
            }));
            if (match) {
              tmp.push(match);
            }
          });
          return tmp.length === rest.length;
        });
      };

      $scope.logicalAddressInAllContracts = function(serviceContracts) {
        return function(logicalAddress) {
          _.every(serviceContracts, function(serviceContract) {
            return _.find(logicalAddresses, {hsaId: logicalAddress.hsaId});
          })
        }
      };

      var validateForms = function() {
        $scope.$broadcast('show-errors-check-validity');

        //Get all divs with class form-group, since it is these that show the
        //has-success or has-error classes
        var formGroupElements = document.getElementsByClassName("form-group");

        return !_.any(formGroupElements, function(formGroup) {
            return angular.element(formGroup).hasClass('has-error');
          }
        );
      };
    }
  ]
);
