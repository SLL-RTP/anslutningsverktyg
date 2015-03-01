'use strict';

angular.module('avApp')
  .controller('UpdateServiceProducerCtrl', ['$rootScope', '$scope', '$log', 'ServiceDomain', 'ServiceContract', 'ServiceComponent', 'environments', 'rivtaVersions', 'LogicalAddress', 'Order', 'configuration', '$state',
    function ($rootScope, $scope, $log, ServiceDomain, ServiceContract, ServiceComponent, environments, rivtaVersions, LogicalAddress, Order, configuration, $state) {
      $scope.environments = environments;
      $scope.rivtaVersions = rivtaVersions;

      $scope.newComponent = false;

      $scope.showDevStuff = configuration.devDebug;

      $scope.updateServiceProducerRequest = {
        serviceComponent: {},
        environment: {},
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

      $scope.selectedEnvironment = {};
      $scope.selectedServiceDomain = {};

      $scope.selectedLogicalAddress = {};
      $scope.filteredLogicalAddresses = [];
      $scope.logicalAddresses = [];
      $scope.existingLogicalAddresses = [];
      $scope.selectedExistingLogicalAddresses = [];
      $scope.selectedServiceContracts = [];

      $scope.linkLogicalAddressChoice = 'sameForAllContracts';

      $scope.requestForCallPermissionInSeparateOrder = true; //Default
      $scope.gridOptions = {
        enableRowSelection: true,
        enableSelectAll: true,
        multiSelect: true,
        columnDefs: [
          {name: 'Namn', field: 'getName()'},
          {name: 'version', field: 'getVersion()'}
        ],
        rowTemplate: 'templates/ui-grid/update-service-producer-grid-row.html'
      };

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
            ServiceComponent.getServiceComponent(newValue.hsaId).then(function (result) {
              $scope.updateServiceProducerRequest.serviceComponent = result;
            });
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
        resetLogicalAddressesForServiceContracts();
        _updateConnectedLogicalAddresses();
      });

      $scope.$watchCollection('selectedServiceContracts', function () {
        _updateConnectedLogicalAddresses();
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

      var _updateConnectedLogicalAddresses = function() {
        var serviceComponentHsaId = $scope.updateServiceProducerRequest.serviceComponent.hsaId;
        var environmentId = $scope.updateServiceProducerRequest.environment.id;
        if ($scope.linkLogicalAddressChoice === 'sameForAllContracts') {
          var serviceContractIds = _.map($scope.selectedServiceContracts, function (serviceContract) {
            return _getServiceContractIdentifierString(serviceContract);
          });
          LogicalAddress.getConnectedLogicalAddresses(serviceComponentHsaId, environmentId, serviceContractIds).then(function (connectedLogicalAddresses) {
            _.each(connectedLogicalAddresses, function (logicalAddress) {
              logicalAddress.existing = true;
              var where = {hsaId: logicalAddress.hsaId};
              if (!_.find($scope.logicalAddresses, where)) {
                $scope.logicalAddresses.push(logicalAddress); //$scope.logicalAddresses is used to display the logical addresses in the tags-input
              }
              _addLogicalAddressToAllServiceContracts(logicalAddress);
            });
          });
        } else {
          _.each($scope.updateServiceProducerRequest.serviceContracts, function(serviceContract) {
            var serviceContractIdentifierString = _getServiceContractIdentifierString(serviceContract);
            var serviceContractIds = [serviceContractIdentifierString];
            LogicalAddress.getConnectedLogicalAddresses(serviceComponentHsaId, environmentId, serviceContractIds).then(function (connectedLogicalAddresses) {
              _.each(connectedLogicalAddresses, function (logicalAddress) {
                var where = {hsaId: logicalAddress.hsaId};
                if (!_.find(serviceContract.removedLogicalAddresses, where)) {
                  logicalAddress.existing = true;
                  _addLogicalAddressToServiceContract(logicalAddress, serviceContract);
                }
              });
            });
          });
        }
      };

      $scope.environmentSelected = function () {
        if ($scope.selectedEnvironment && $scope.updateServiceProducerRequest.serviceComponent) {
          $scope.updateServiceProducerRequest.environment = $scope.selectedEnvironment;
          ServiceDomain.listDomains().then(function (domains) {
            $scope.serviceDomains = domains;
          });
        }
      };

      $scope.serviceDomainSelected = function () {
        if ($scope.selectedEnvironment && $scope.updateServiceProducerRequest.serviceComponent && $scope.selectedServiceDomain) {
          var serviceComponentId = $scope.updateServiceProducerRequest.serviceComponent.hsaId;
          var environmentId = $scope.selectedEnvironment.id;
          var serviceDomainId = $scope.selectedServiceDomain.tjansteDomanId;
          $scope.updateServiceProducerRequest.serviceDomain = $scope.selectedServiceDomain;
          ServiceContract.listContracts(serviceComponentId, environmentId, serviceDomainId).then(function (contracts) {
            $scope.serviceContractsInSelectedDomain = _.map(contracts, function(serviceContract) {
              serviceContract.onOrder = _isServiceContractSelected(serviceContract);
              return serviceContract;
            });
            $scope.gridOptions.data = contracts;
            _.each($scope.gridOptions.data, function(contractData) { //ui-grid doesn't seem to support composite field values in any other way
              contractData.getVersion = function() {
                return this.majorVersion + '.' + this.minorVersion;
              };
              contractData.getName = function() {
                var statusText = '';
                if (!this.installedInEnvironment) {
                  statusText = ' (ej installerat)';
                } else if (!this.installedForProducerHsaId) {
                  statusText = ' (ej ansluten)';
                }
                return this.namn + statusText;
              };
            });
          });
          LogicalAddress.getLogicalAddressesForEnvironmentAndServiceDomain(environmentId, serviceDomainId).then(function(logicalAddresses) {
            $scope.existingLogicalAddresses = logicalAddresses;
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
        Order.createServiceProducerConnectionUpdateOrder($scope.updateServiceProducerRequest);
        $state.go('serviceProducerUpdateOrderConfirmed');
      };

      /*
       Grid config
       */

      $scope.gridOptions.onRegisterApi = function (gridApi) {
        //set gridApi on scope
        $scope.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope, function (row) {
          checkNotInstalledAndUpdate(gridApi, row);
        });

        gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
          _.forEach(rows, function (row) {
            checkNotInstalledAndUpdate(gridApi, row);
          });
        });
      };

      var checkNotInstalledAndUpdate = function(gridApi, row) {
        var serviceContract = row.entity;
        if (!serviceContract.installedInEnvironment || !serviceContract.installedForProducerHsaId) {
          gridApi.selection.unSelectRow(serviceContract);
        } else {
          row.isSelected ? addSelectedServiceContract(serviceContract) : removeSelectedServiceContract(serviceContract);
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
          if ($scope.linkLogicalAddressChoice !== 'individualForContract' && $scope.logicalAddressesForAllServiceContracts) {
            newServiceContract.logicalAddresses = _.map($scope.logicalAddressesForAllServiceContracts, function(logicalAddress) {
              return _.clone(logicalAddress);
            });
          }
          $scope.updateServiceProducerRequest.serviceContracts.push(newServiceContract);
        }
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
        $scope.selectedEnvironment = {};
        $scope.selectedServiceDomain = {};
        $scope.selectedLogicalAddress = {};
        $scope.updateServiceProducerRequest = {
          serviceComponent: {},
          environment: {},
          serviceDomain: {},
          serviceContracts: [],
          serviceConsumer: {},
          slaFullfilled: false,
          otherInfo: '',
          client: $scope.updateServiceProducerRequest.client //keep client info
        };
        $scope.gridOptions.data = [];
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

      var resetLogicalAddressesForServiceContracts = function() {
        $log.info('resetLogicalAddressesForServiceContracts()');
        _.forEach($scope.updateServiceProducerRequest.serviceContracts, function(serviceContract) {
          serviceContract.logicalAddresses = [];
          serviceContract.newLogicalAddresses = [];
          serviceContract.removedLogicalAddresses = [];
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
    }
  ]
);
