'use strict';

angular.module('avApp')
  .controller('OrderProducentCtrl', ['$scope', '$state', '$q', '$timeout', '$log', '$uibModal', 'AnslutningStatus', 'LogicalAddress', 'Bestallning', 'BestallningState', 'ProducentbestallningState', 'FormValidation', 'intersectionFilter', 'flattenFilter', 'rivProfiles',
      function ($scope, $state, $q, $timeout, $log, $uibModal, AnslutningStatus, LogicalAddress, Bestallning, BestallningState, ProducentbestallningState, FormValidation, intersectionFilter, flattenFilter, rivProfiles) {

        var ORDER_MODE = {
          ADD: 'ORDER_MODE_ADD',
          REMOVE: 'ORDER_MODE_REMOVE'
        };

        $scope.ORDER_MODE = ORDER_MODE;

        /**
         * Called from UI when user selects a new service domain to create the list
         * of connections in the current service domain
         *
         * Gets connections with statuses from backend and delegates to _recreateConnectionsInCurrentServiceDomain
         */
        $scope.updateConnectionsInCurrentServiceDomain = function () {
          if ($scope.producentbestallning.driftmiljo && $scope.producentbestallning.tjanstekomponent && $scope.selectedTjanstedoman) {
            var tjanstekomponentId = $scope.producentbestallning.tjanstekomponent.hsaId;
            var driftmiljoId = $scope.producentbestallning.driftmiljo.id;
            var tjanstedomanId = $scope.selectedTjanstedoman.tjansteDomanId;
            AnslutningStatus.getProducentanslutningar(tjanstekomponentId, driftmiljoId, tjanstedomanId).then(function(anslutningar) {
              _recreateConnectionsInCurrentServiceDomain(anslutningar);
            });
          }
        };

        /**
         * Called when a new connection has been added to/removed from the order to re-create the list of connections
         *
         * Delegates to _recreateConnectionsInCurrentServiceDomain with current list of connections
         * @private
         */
        var _recalculateConnectionsInCurrentServiceDomain = function () {
          _recreateConnectionsInCurrentServiceDomain($scope.connectionsInCurrentServiceDomain);
        };

        /**
         * Common functionality for
         * $scope.updateConnectionsInCurrentServiceDomain and _recalculateConnectionsInCurrentServiceDomain
         *
         * Will set the _tjanstedoman and _paBestallning properties on each connection
         *
         * @param baseConnections
         * @private
         */
        var _recreateConnectionsInCurrentServiceDomain = function (baseConnections) {
          var tjanstedomanId = $scope.selectedTjanstedoman.tjansteDomanId;
          $timeout(function() {
            $scope.connectionsInCurrentServiceDomain = _.map(baseConnections, function (connection) {
              connection._tjanstedoman = tjanstedomanId; //TODO: handle in factory?
              connection._paBestallning = ProducentbestallningState.isAnslutningOnOrder(connection);
              return connection;
            });
          });
        };

        /**
         * Called from UI when user clicks button in contract selection panel
         *
         * Adds all _selected connections from $scope.connectionsInCurrentServiceDomain
         * to order
         */
        $scope.updateValdaAnslutningar = function () {
          _.each(_.filter($scope.connectionsInCurrentServiceDomain, '_selected'), function (connection) {
            ProducentbestallningState.addAnslutning(connection);
            delete connection._selected; //deselect in UI
          });
        };

        /**
         * Called from UI when user has entered a new logical address hsaId and moves
         * to the name field. Will try to lookup the logical address and if found, set
         * name and the _backend property.
         *
         * Will also determine the connection status of the la to the current connections on order
         * and update $scope.secondLogicalAddressStatuses
         * @param logiskAdress
         */
        $scope.updateLogiskAdressWithBackendData = function (logiskAdress) {
          if (logiskAdress.hsaId && logiskAdress.hsaId.length) {
            LogicalAddress.getLogicalAddressForHsaId($scope.producentbestallning.driftmiljo.id, logiskAdress.hsaId)
              .then(function (backendLogiskAdress) {
                $log.debug('found logisk adress', backendLogiskAdress);
                logiskAdress._backend = true;
                _.assign(logiskAdress, backendLogiskAdress);
                $timeout(function() {
                  $scope.secondLogicalAddressStatuses = _calculateConnectionStatusForLogicalAddress(logiskAdress);
                  console.log('$scope.secondLogicalAddressStatuses', $scope.secondLogicalAddressStatuses);
                });
              }, function () {
                $log.warn('no logisk adress found for ' + logiskAdress.hsaId);
                $timeout(function() {
                  $scope.secondLogicalAddressStatuses = _calculateConnectionStatusForLogicalAddress(logiskAdress);
                  console.log('$scope.secondLogicalAddressStatuses', $scope.secondLogicalAddressStatuses);
                });
              });
          } else {
            $log.warn('logisk adress does not contain hsa id', logiskAdress);
          }
        };

        /**
         * Called when selected connections change to (re)calculate our
         * list of logical addresses that are common to all the selected connections
         * Also determines non common logical addresses per each selected connection
         *
         * sets/updates:
         * $scope.commonLogicalAddresses
         * $scope.commonRemovedLogicalAddresses
         * $scope.nonCommons
         *
         * Currently only useful if we are in 'remove' mode
         * @private
         */
        var _calculateCommonLogicalAddresses = function() {
          var producentanslutningar = ProducentbestallningState.current().producentanslutningar;
          $scope.nonCommons = [];
          for (var i = 0; i < producentanslutningar.length; i += 1) {
            var nonCommonForIndex = _getNonCommonLogicalAddressesForIndex(producentanslutningar, i);
            if (nonCommonForIndex.length) {
              var connection = producentanslutningar[i];
              $scope.nonCommons.push({
                serviceContractName: connection.tjanstekontraktNamn,
                nonCommon: nonCommonForIndex
              });
            }
          }
          var common = [];
          common = _calcCommon(producentanslutningar);
          $timeout(function() {
            $scope.commonLogicalAddresses = common;
            $scope.commonRemovedLogicalAddresses = [];
          });
        };

        /**
         * From an array of connections, determine the non-common logical addresses
         * for a given index
         *
         * @param connections
         * @param idx
         * @returns {Array}
         * @private
         */
        var _getNonCommonLogicalAddressesForIndex = function (connections, idx) {
          if (connections[idx] && connections[idx].befintligaLogiskaAdresser) {
            var currentLogicalAddresses = connections[idx].befintligaLogiskaAdresser;
            var before = [];
            var after = [];
            if (idx > 0) {
              before = connections.slice(0, idx);
            }
            if (idx < (connections.length-1)) {
              after = connections.slice(idx + 1, connections.length);
            }
            var otherConnections = before.concat(after);
            if (otherConnections.length) {
              var commonBetweenOthers = _calcCommon(otherConnections);
              return _.filter(currentLogicalAddresses, function(la) {
                return !_.find(commonBetweenOthers, {hsaId: la.hsaId});
              });
            }
          } else {
            console.warn(connections[idx].tjanstekontraktNamn + ' does not contain any existing logical addresses');
          }
          return [];
        };

        /**
         * Common functionality for the two functions above
         * @param connections
         * @returns {Array}
         * @private
         */
        var _calcCommon = function(connections) {
          var common = [];
          if (connections[0]) {
            if (connections[0].befintligaLogiskaAdresser) {
              common = common.concat(connections[0].befintligaLogiskaAdresser);
            }
            if (connections.length > 0) {
              var restOfConnections = connections.slice(1, connections.length);
              common = _.filter(common, function (befLa) {
                return _.every(restOfConnections, function (conn) {
                  return _isLogicalAddressOnConnection(befLa, conn);
                });
              });
            }
          }
          return common;
        };

        /**
         * utility to determine if a given logical address is among the current logical addresses
         * for a connection
         *
         * @param la
         * @param conn
         * @returns {boolean}
         * @private
         */
        var _isLogicalAddressOnConnection = function(la, conn) {
          if (conn.befintligaLogiskaAdresser) {
            return _.find(conn.befintligaLogiskaAdresser, _.pick(la, 'hsaId'));
          }
          return false;
        };

        /**
         * Called from UI to 'remove' a common logical address (when user clicks la in the left column)
         *
         * Used in 'remove' mode
         *
         * Under the hood the the logical address is moved from
         * $scope.commonLogicalAddresses to $scope.commonRemovedLogicalAddresses
         *
         * @param la
         */
        $scope.removeCurrentLogicalAddress = function(la) {
          _moveCurrentLogicalAddress(la, $scope.commonLogicalAddresses, $scope.commonRemovedLogicalAddresses);
        };

        /**
         * Called from UI to 're-add' a common logical address (when user clicks la in the right column)
         *
         * Used in 'remove' mode
         *
         * Under the hood the the logical address is moved from
         * $scope.commonRemovedLogicalAddresses to $scope.commonLogicalAddresses
         * @param la
         */
        $scope.reAddCurrentLogicalAddress = function(la) {
          _moveCurrentLogicalAddress(la, $scope.commonRemovedLogicalAddresses, $scope.commonLogicalAddresses);
        };

        /**
         * Common functionality for the two functions above
         * @param la
         * @param from
         * @param to
         * @private
         */
        var _moveCurrentLogicalAddress = function(la, from, to) {
          var idx = _.findIndex(from, {hsaId: la.hsaId});
          if (idx > -1) {
            from.splice(idx, 1);
            to.push(la);
          } else {
            console.error('could not find index of existing la, this should not happen');
          }
        };

        /**
         * Called from UI to add a new logical address to $scope.newLogicalAddresses
         *
         * Used in 'add' mode
         *
         * @param la
         */
        $scope.addNewLogicalAddress = function(la) {
          if (la && la.hsaId && la.hsaId.length) {
            if (!_.find($scope.newLogicalAddresses, _.pick(la, 'hsaId'))) {
              $timeout(function () {
                $scope.newLogicalAddresses.push(la);
              });
            }
          } else {
            console.warn('hsaId of logical address not provided, doing nothing');
          }
        };

        /**
         * Common function to filter out the connections that has the la among befintligaLogiskaAdresser
         *
         * @param la
         * @returns {Array}
         * @private
         */
        var _calculateConnectionStatusForLogicalAddress = function(la) {
          var alreadyConnectedConnections = [];
          if (la && la.hsaId && la.hsaId.length) {
            var producentanslutningar = ProducentbestallningState.current().producentanslutningar;
            _.forEach(producentanslutningar, function(conn) {
              if (_.find(conn.befintligaLogiskaAdresser, _.pick(la, 'hsaId'))) {
                alreadyConnectedConnections.push(conn);
              }
            });
          }
          return alreadyConnectedConnections;
        };

        /**
         * Called from UI to remove a new logical address from $scope.newLogicalAddresses
         *
         * Used in 'add' mode
         *
         * @param la
         */
        $scope.removeNewLogicalAddress = function(la) {
          if (la && la.hsaId && la.hsaId.length) {
            var idx = _.findIndex($scope.newLogicalAddresses, _.pick(la, 'hsaId'));
            if (idx > -1) {
              $timeout(function () {
                $scope.newLogicalAddresses.splice(idx, 1);
              });
            }
          } else {
            console.warn('hsaId of logical address not provided, doing nothing');
          }
        };

        /**
         * Called from UI to determine if a logical address has already been added
         *
         * Used in 'add' mode to determine button status
         *
         * @param la logical address
         * @returns {boolean}
         */
        $scope.isLogicalAddressAmongNew = function(la) {
          if (la && la.hsaId && la.hsaId.length) {
            return _.findIndex($scope.newLogicalAddresses, _.pick(la, 'hsaId')) !== -1;
          }
          return false;
        };

        /**
         * Called after forms are determined to be valid when user clicks the
         * 'order' button.
         *
         * Syncs the controller state for logical addresses to ProducentBestallningState.
         *
         * @private
         */
        var _syncOrderState = function () {
          if ($scope.orderMode === ORDER_MODE.ADD) {
            if ($scope.newLogicalAddresses.length) {
              _.each($scope.newLogicalAddresses, function(logicalAddress) {
                ProducentbestallningState.addLogiskAdressToAllAnslutningar(_.clone(logicalAddress));
              });
            }
          } else if ($scope.orderMode === ORDER_MODE.REMOVE) {
            if ($scope.commonRemovedLogicalAddresses.length) {
              _.each($scope.commonRemovedLogicalAddresses, function(logicalAddress) {
                ProducentbestallningState.removeLogiskAdressFromAllAnslutningar(_.clone(logicalAddress));
              });
            }

          }
        };

        /**
         * Watcher for 'anslutning-added' events
         *
         * Calls _recalculateConnectionsInCurrentServiceDomain to set the
         * 'on order' status
         *
         * If we are in 'remove' mode, also call _calculateCommonLogicalAddresses to recalculate
         * the common logical addresses we can work with
         */
        $scope.$on('anslutning-added', _.debounce(function () {
          _recalculateConnectionsInCurrentServiceDomain();
          if ($scope.orderMode === ORDER_MODE.REMOVE) {
            _calculateCommonLogicalAddresses();
          }
        }, 50));

        /**
         * Watcher for 'anslutning-removed' events
         *
         * Calls _recalculateConnectionsInCurrentServiceDomain to remove the
         * 'on order' status
         *
         * If we are in 'remove' mode, also call _calculateCommonLogicalAddresses to recalculate
         * the common logical addresses we can work with
         */
        $scope.$on('anslutning-removed', _.debounce(function () {
          _recalculateConnectionsInCurrentServiceDomain();
          if ($scope.orderMode === ORDER_MODE.REMOVE) {
            _calculateCommonLogicalAddresses();
          }
        }, 50));

        /**
         * Called from a number of form action related watchers to re-check order related form elemens
         * and set $scope.orderValid property
         * @private
         */
        var _recheckOrderValidity = function () {
          if ($scope.sendOrderClicked) {
            $scope.orderValid = FormValidation.checkGlobalValidation();
          }
        };

        /**
         * A number of form validation related watchers
         * all delegate to _recheckOrderValidity
         */
        $scope.$on('gv-leaving-element-invalid', _recheckOrderValidity);
        $scope.$on('gv-leaving-element-valid', _recheckOrderValidity);
        $scope.$on('gv-element-invalid', _recheckOrderValidity);
        $scope.$on('gv-element-invalid-in-focus', _recheckOrderValidity);
        $scope.$on('gv-element-valid', _recheckOrderValidity);
        $scope.$on('gv-element-valid-in-focus', _recheckOrderValidity);


        /**
         * Watcher for 'send-order' event broadcasted from OrderMainCtrl
         * (user clicks send order button)
         *
         * Validates order related forms, syncs order state and triggers confirmation modal
         */
        $scope.$on('send-order', function() {
          $scope.sendOrderClicked = true;
          if (!FormValidation.validateForms()) {
            $log.warn('--- order forms are not valid ---');
            $scope.orderValid = false;
          } else {
            $log.debug('--- order forms are valid ---');
            $scope.orderValid = true;
            _syncOrderState();
            //remove all tjanstekonsumenter/konsumentbestallningar if no nyaLogiskaAdresser are on the order
            if (_.isEmpty(flattenFilter(ProducentbestallningState.current().producentanslutningar, 'nyaLogiskaAdresser'))) {
              if (!_.isEmpty(ProducentbestallningState.current().konsumentbestallningar)) {
                _.each(ProducentbestallningState.current().konsumentbestallningar, function(konsumentbestallning) {
                  ProducentbestallningState.removeTjanstekonsument(konsumentbestallning.tjanstekomponent);
                });
              }
            }

            var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: 'views/order/producent-modal.html',
              controller: 'OrderProducentModalCtrl',
              size: 'lg'
            });

            modalInstance.result.then(function () {
              $log.debug('user clicked OK');
              Bestallning.createProducentbestallning(ProducentbestallningState.current(), BestallningState.current()).then(function (status) {
                $log.debug('Status: ' + status);
                if (status === 201) {
                  $log.debug('Going to \'order-confirmation\' state');
                  $state.go('order-confirmation');
                }
              });
            }, function () {
              $log.debug('modal dismissed');
            });
          }
        });

        /**
         * Reset state
         * @private
         */
        var _reset = function () {
          $log.debug('--- reset ---');
          _.assign($scope, {
            rivProfiles: rivProfiles,
            commonLogicalAddresses: [],
            commonRemovedLogicalAddresses: [],
            newLogicalAddresses: [],
            orderMode: '',
            orderValid: true,
            sendOrderClicked: false,
            selectedTjanstedoman: undefined,
            connectionsInCurrentServiceDomain: [],
            selectedLogicalAddress: {},
            requestForCallPermissionInSeparateOrder: true
          });
          $scope.$broadcast('show-errors-reset');
        };

        /**
         * Add required functionality to scope so they can be called from UI
         *
         * run on init
         */
        _.assign($scope, {
          addTjanstekonsumentToOrder: ProducentbestallningState.addTjanstekonsument,
          removeTjanstekonsumentFromOrder: ProducentbestallningState.removeTjanstekonsument,
          removeAnslutningFromOrder: ProducentbestallningState.removeAnslutning,
          getFilteredLogiskaAdresser: LogicalAddress.getFilteredLogicalAddresses
        });

        /**
         * run on init
         */
        $scope.resetMain();
        BestallningState.current().driftmiljo = {};
        _reset();

        /**
         * run on init
         */
        ProducentbestallningState.init().then(function () {
          $scope.producentbestallning = ProducentbestallningState.current();
          $scope.bestallning = BestallningState.current();
        });

        /**
         * Watcher for changes to orderMode.
         * If it changes to remove:
         * - reset logicalAddresses on the order
         * - recalculate common logical addresses
         * - empty list of newly selected logical addresses in scope
         *
         * If it changes to add:
         * - reset logicalAddresses on the order
         * - rest all logical addresses in scope
         */
        $scope.$watch('orderMode', function(newOrderMode) {
          if (newOrderMode === ORDER_MODE.REMOVE) {
            ProducentbestallningState.resetLogicalAddresses();
            _calculateCommonLogicalAddresses();
            $scope.newLogicalAddresses = [];
          } else if (newOrderMode === ORDER_MODE.ADD) {
            $scope.commonLogicalAddresses = [];
            $scope.commonRemovedLogicalAddresses = [];
            $scope.newLogicalAddresses = [];
            ProducentbestallningState.resetLogicalAddresses();
          }
        });

        /**
         * Calculated watch that resets the order when a new tjanstekomponent is selected
         * in orderMain (via BestallningState)
         *
         */
        $scope.$watch(function () { //watching for changed tjanstekomponent in 'main' Bestallning
          return BestallningState.current().tjanstekomponent;
        }, function (newVal) {
          if (newVal) {
            _reset();
            ProducentbestallningState.setTjanstekomponent(newVal);
          }
        }, true);

        /**
         * Calculated watch that updates order environment when updated in main
         */
        $scope.$watch(function () {
          return BestallningState.current().driftmiljo;
        }, function (newVal) {
          if (newVal) {
            $scope.producentbestallning.driftmiljo = newVal;
          }
        }, true);

        /**
         * Calculated watch that determines when specificOrderSatisfied
         * changes value. This triggers the display of common order ending (otherInfo/orderer)
         * in orderMain
         */
        $scope.$watch(function () {
          return $scope.orderMode !== ''
            && !!$scope.producentbestallning.tjanstekomponent.hsaId
            && !!$scope.producentbestallning.producentanslutningar.length;
        }, function (newVal) {
          BestallningState.setSpecificOrderSatisfied(newVal);
        });

        /**
         * Calculated watch that determines when to call BestallningState.setSpecificOrderValid
         * This determines if the error txt above the submit button is displayed or not
         */
        $scope.$watch(function () {
          return $scope.orderValid;
        }, function (newVal) {
          BestallningState.setSpecificOrderValid(newVal);
        });

        /**
         * Watch that triggers when the currently selected logical address (from typeahead in add panel) changes
         * and triggers recalculation of connection status for the current connections and set result in
         * $scope.firstLogicalAddressStatuses
         */
        $scope.$watch('selectedLogicalAddress.selected', function (la) {
          $scope.firstLogicalAddressStatuses = _calculateConnectionStatusForLogicalAddress(la);
        })
      }
    ]
  );
