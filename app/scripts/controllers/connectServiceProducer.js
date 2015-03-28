'use strict';

/**
 * @ngdoc function
 * @name avApp.controller:AnslutCtrl
 * @description
 * # AnslutCtrl
 * Controller of the avApp
 */

angular.module('avApp')
  .controller('ConnectServiceProducerCtrl', ['$rootScope', '$scope', '$log', 'ServiceDomain', 'ServiceContract', 'ServiceComponent', 'environments', 'rivProfiles', 'currentUser', 'LogicalAddress', 'Order', 'configuration', '$state',
    function ($rootScope, $scope, $log, ServiceDomain, ServiceContract, ServiceComponent, environments, currentUser, rivProfiles, LogicalAddress, Order, configuration, $state) {
      $scope.targetEnvironments = environments;
      $scope.rivProfiles = rivProfiles;
      $scope.currentUser = currentUser;

      $scope.newComponent = false;

      $scope.showDevStuff = configuration.devDebug;

      $scope.connectServiceProducerRequest = {
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
      $scope.serviceContractsInSelectedDomain = [];

      $scope.selectedLogicalAddress = {};
      $scope.filteredLogicalAddresses = [];
      $scope.logicalAddresses = [];
      $scope.existingLogicalAddresses = [];
      $scope.selectedExistingLogicalAddresses = [];
      $scope.selectedServiceContracts = [];
      $scope.logicalAddressesForAllServiceContracts = [];

      $scope.linkLogicalAddressChoice = 'sameForAllContracts';

      $scope.requestForCallPermissionInSeparateOrder = true; //Default

      $scope.orderValid = true;

      $scope.gridOptions = {
        enableRowSelection: true,
        enableSelectAll: true,
        multiSelect: true,
        columnDefs: [
          {name: 'Namn', field: 'getName()'},
          {name: 'version', field: 'getVersion()'}
        ],
        rowTemplate: 'templates/ui-grid/connect-service-producer-grid-row.html'
      };

      $scope.filterServiceComponents = function (query) {
        ServiceComponent.getFilteredServiceComponents(query, $scope.selectedTargetEnvironment.id).then(function (result) {
          $scope.filteredServiceComponents = result;
        });
      };

      $scope.filterServiceConsumers = function (query) {
        ServiceComponent.getFilteredServiceComponents(query, $scope.selectedTargetEnvironment.id).then(function (result) {
          //This line effectively removes, from the search result
          // the previously chosen service component
          if($scope.selectedServiceComponent.selected) {
            _.remove(result, {hsaId: $scope.selectedServiceComponent.selected.hsaId});
          }

          $scope.filteredServiceConsumers = result;
        });
      };

      $scope.$watch('newComponent', function() {
        resetServiceComponent();
      });

      $scope.$watch('selectedServiceComponent.selected', function (newValue) {
          if (newValue) {
            reset();
            console.log('new service component selected:');
            console.log(newValue);
            if (angular.isDefined(newValue.namn)) { //FIXME: fix until backend returns service components also from TAK on this query
              ServiceComponent.getServiceComponent(newValue.hsaId).then(function (result) {
                console.log(result);
                $scope.connectServiceProducerRequest.serviceComponent = result;
              });
            } else {
              console.log('detected producer from TAK');
              $scope.connectServiceProducerRequest.serviceComponent = _.clone(newValue);
            }
          } else {
            reset();
          }
        }
      );

      $scope.onSelectServiceConsumer = function(item, model) {
        ServiceComponent.getServiceComponent(item.hsaId).then(function (result) {
          $scope.connectServiceProducerRequest.serviceConsumer = result;
        });
      };

      $scope.enableNewServiceProducer = function() {

      };

      $scope.requestForCallPermissionClicked = function() {
        //Reset stuff
        $scope.selectedServiceConsumer = {};
        $scope.connectServiceProducerRequest.serviceConsumer = {};
      };

      $scope.$watch('linkLogicalAddressChoice', function(newValue) {
        resetLogicalAddressesForServiceContracts();
        if(newValue === 'sourceSystemBased') {
          var logicalAddress = $scope.connectServiceProducerRequest.serviceComponent;
          $scope.logicalAddresses.push(logicalAddress);
          _addLogicalAddressToAllServiceContracts(logicalAddress);
        }
      });

      $scope.targetEnvironmentSelected = function () {
        if ($scope.selectedTargetEnvironment && $scope.connectServiceProducerRequest.serviceComponent) {
          resetContracts();
          $scope.connectServiceProducerRequest.targetEnvironment = $scope.selectedTargetEnvironment;
          ServiceDomain.listDomains().then(function (domains) {
            $scope.serviceDomains = domains;
          });
        }
      };

      $scope.serviceDomainSelected = function () {
        if ($scope.selectedTargetEnvironment && $scope.connectServiceProducerRequest.serviceComponent && $scope.selectedServiceDomain) {
          resetContracts();
          var serviceComponentId = $scope.connectServiceProducerRequest.serviceComponent.hsaId;
          var environmentId = $scope.selectedTargetEnvironment.id;
          var serviceDomainId = $scope.selectedServiceDomain.tjansteDomanId;
          $scope.connectServiceProducerRequest.serviceDomain = $scope.selectedServiceDomain;
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
                } else if (this.installedForProducerHsaId) {
                  statusText = ' (redan ansluten)';
                }
                return this.namn + statusText;
              };
            });
          });
        }
      };

      $scope.$watchCollection('selectedServiceContracts', function(newSelected, oldSelected) {
        $scope.serviceContractsInSelectedDomain = _.map(_.clone($scope.serviceContractsInSelectedDomain, true), function(serviceContract) {
          serviceContract.onOrder = _isServiceContractSelected(serviceContract);
          return serviceContract;
        });
        //$scope.dataCount = newNames.length;
      });

      $scope.updateSelectedServiceContracts = function() {
        _.chain($scope.serviceContractsInSelectedDomain)
          .filter('selected')
          .forEach(function(serviceContract) {
            _addServiceContractToOrder(serviceContract);
          });
        //_.forEach($scope.serviceContractsInSelectedDomain, function(serviceContract) {
        //  _.chain($scope.serviceContractsInSelectedDomain)
        //    .filter('selected')
        //    .forEach(function() {
        //      _addServiceContractToOrder(serviceContract);
        //    });
        //  //if (serviceContract.selected) {
        //  //  _addServiceContractToOrder(serviceContract);
        //  //} else {
        //  //  _removeServiceContractFromOrder(serviceContract);
        //  //}
        //});
        //_.chain($scope.serviceContractsInSelectedDomain)
        //.filter('selected')
        //  .forEach(function(selectedContract) {
        //    console.log(selectedContract.namn);
        //  });
      };

      $scope.removeServiceContract = function(serviceContract) {
        _removeServiceContractFromOrder(serviceContract);
      }

      $scope.filterLogicalAddresses = function (logicalAddressQuery) {
        LogicalAddress.getFilteredLogicalAddresses(logicalAddressQuery).then(function (logicalAddresses) {
            $scope.filteredLogicalAddresses = logicalAddresses;
            console.log(logicalAddresses);

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
      };

      $scope.removeLogicalAddressFromServiceContract = function(tag, serviceContract) {
        var logicalAddressId = tag.hsaId;
        if (angular.isDefined(serviceContract.logicalAddresses)) {
          _.remove(serviceContract.logicalAddresses, {hsaId: logicalAddressId});
        }
      };

      $scope.sendServiceProducerConnectionOrder = function() {
        if(!validateForms()) {
          $scope.orderValid = false;
        } else {
          $scope.orderValid = true;
          Order.createServiceProducerConnectionOrder($scope.connectServiceProducerRequest).then(function(status) {
            console.log('Status: ' + status);
            if (status === 201) {
              console.log("Going to state");
              $state.go('serviceProducerOrderConfirmed');
            }
          });

        }
      };

      $scope.$watch('newComponent', function(newValue) {
        //Everytime this scope model changes
        //reset all validation in the page
        $scope.$broadcast('show-errors-reset');
      });
      /*
       Grid config
       */

      $scope.gridOptions.onRegisterApi = function (gridApi) {
        //set gridApi on scope
        $scope.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope, function (row) {
          checkInstalledAndUpdate(gridApi, row);
        });

        gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
          _.forEach(rows, function (row) {
            checkInstalledAndUpdate(gridApi, row);
          });
        });
      };

      $scope.copyPersonInChargeToClient = function() {
        $scope.connectServiceProducerRequest.client.name = $scope.connectServiceProducerRequest.serviceComponent.huvudAnsvarigNamn;
        $scope.connectServiceProducerRequest.client.email = $scope.connectServiceProducerRequest.serviceComponent.huvudAnsvarigEpost;
        $scope.connectServiceProducerRequest.client.phone = $scope.connectServiceProducerRequest.serviceComponent.huvudAnsvarigTelefon;
      };

      $scope.copyPersonInChargeToTekniskKontakt = function() {
        $scope.connectServiceProducerRequest.serviceComponent.tekniskKontaktNamn = $scope.connectServiceProducerRequest.serviceComponent.huvudAnsvarigNamn;
        $scope.connectServiceProducerRequest.serviceComponent.tekniskKontaktEpost = $scope.connectServiceProducerRequest.serviceComponent.huvudAnsvarigEpost;
        $scope.connectServiceProducerRequest.serviceComponent.tekniskKontaktTelefon = $scope.connectServiceProducerRequest.serviceComponent.huvudAnsvarigTelefon;
      };

      var checkInstalledAndUpdate = function(gridApi, row) {
        if (!row.entity.installedInEnvironment || row.entity.installedForProducerHsaId) {
          gridApi.selection.unSelectRow(row.entity);
        } else {
          updateSelectedServiceContracts(row);
        }
      };

      var _addLogicalAddressToAllServiceContracts = function(logicalAddress) {
        _.forEach($scope.connectServiceProducerRequest.serviceContracts, function (serviceContract) {
          if (!angular.isDefined(serviceContract.logicalAddresses)) {
            serviceContract.logicalAddresses = [];
          }
          if (!_.find(serviceContract.logicalAddresses, {hsaId: logicalAddress.hsaId})) {
            serviceContract.logicalAddresses.push(logicalAddress);
          } else {
            $log.log('Can\'t add a tag twice');
          }
          if (!_.find($scope.logicalAddressesForAllServiceContracts, {hsaId: logicalAddress.hsaId})) {
            $scope.logicalAddressesForAllServiceContracts.push(logicalAddress);
          }
        });
      };

      var _addLogicalAddressToServiceContract = function(logicalAddress, serviceContract) {
        if (!angular.isDefined(serviceContract.logicalAddresses)) {
          serviceContract.logicalAddresses = [];
        }
        if (!_.find(serviceContract.logicalAddresses, {hsaId: logicalAddress.hsaId})) {
          serviceContract.logicalAddresses.push(logicalAddress);
        } else {
          $log.log('Can\'t add a tag twice');
        }
      };

      var _removeLogicalAddressFromAllServiceContracts = function(logicalAddress) {
        _.each($scope.connectServiceProducerRequest.serviceContracts, function(serviceContract) {
          _removeLogicalAddressFromServiceContract(logicalAddress, serviceContract);
        });
      };

      var _removeLogicalAddressFromServiceContract = function(logicalAddress, serviceContract) {
        var logicalAddressId = logicalAddress.hsaId;
        if (angular.isDefined(serviceContract.logicalAddresses)) {
          _.remove(serviceContract.logicalAddresses, {hsaId: logicalAddressId});
        }
      };

      var updateSelectedServiceContracts = function (row) {
        var serviceContract = row.entity;
        var serviceContractIdentifier = {
          namnrymd: serviceContract.namnrymd,
          majorVersion: serviceContract.majorVersion,
          minorVersion: serviceContract.minorVersion
        };
        if (row.isSelected && !_.find($scope.selectedServiceContracts, serviceContractIdentifier)) {
          $scope.selectedServiceContracts.push(serviceContract);
          var newServiceContract = _getCleanServiceContract(serviceContract);
          if ($scope.linkLogicalAddressChoice !== 'individualForContract' && $scope.logicalAddressesForAllServiceContracts) {
            newServiceContract.logicalAddresses = _.map($scope.logicalAddressesForAllServiceContracts, function(logicalAddress) {
              return _.clone(logicalAddress);
            });
          }
          $scope.connectServiceProducerRequest.serviceContracts.push(newServiceContract);
        } else if (!row.isSelected && _.find($scope.selectedServiceContracts, serviceContractIdentifier)) {
          _.remove($scope.selectedServiceContracts, serviceContractIdentifier);
          _.remove($scope.connectServiceProducerRequest.serviceContracts, serviceContractIdentifier);
        }
        $log.info($scope.selectedServiceContracts);
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
          $scope.connectServiceProducerRequest.serviceContracts.push(newServiceContract);
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
          _.remove($scope.connectServiceProducerRequest.serviceContracts, serviceContractIdentifier);
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
        $scope.selectedServiceDomain = {};
        $scope.selectedLogicalAddress = {};
        $scope.connectServiceProducerRequest = {
          serviceComponent: {},
          serviceDomain: {},
          serviceContracts: [],
          serviceConsumer: {},
          slaFullfilled: false,
          otherInfo: '',
          client: $scope.connectServiceProducerRequest.client //keep client info
        };
        $scope.gridOptions.data = [];
        $scope.selectedExistingLogicalAddresses = [];
        $scope.selectedServiceContracts = [];
        $scope.linkLogicalAddressChoice = 'sameForAllContracts';
        $scope.logicalAddressesForAllServiceContracts = [];
        $scope.selectedServiceConsumer = {};
        $scope.requestForCallPermissionInSeparateOrder = true;
        $scope.logicalAddresses = []; //So we don't get any logical address lingering in the tags input

        //Reset all form validation that we might have done
        $scope.$broadcast('show-errors-reset');
        $scope.orderValid = true;
      };

      var resetServiceComponent = function() {
        delete $scope.selectedServiceComponent.selected;
        $scope.connectServiceProducerRequest.serviceComponent = {};
      };

      var resetContracts = function() {
        $scope.gridOptions.data = [];
        //$scope.selectedServiceContracts = [];
        //$scope.connectServiceProducerRequest.serviceContracts = [];
      };

      var resetLogicalAddressesForServiceContracts = function() {
        $log.info('resetLogicalAddressesForServiceContracts()');
        _.forEach($scope.connectServiceProducerRequest.serviceContracts, function(serviceContract) {
          serviceContract.logicalAddresses = [];
        });
        $scope.logicalAddresses = [];
        $scope.logicalAddressesForAllServiceContracts = [];
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
