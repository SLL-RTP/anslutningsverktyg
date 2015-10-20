'use strict';

angular.module('avApp')
  .controller('OrderProducentCtrl', ['$scope', '$state', '$timeout', 'ServiceContract', 'LogicalAddress', 'Bestallning', 'BestallningState', 'ProducentbestallningState', 'intersectionFilter', 'rivProfiles',
      function ($scope, $state, $timeout, ServiceContract, LogicalAddress, Bestallning, BestallningState, ProducentbestallningState, intersectionFilter, rivProfiles) {

        if (!BestallningState.current().driftmiljo || !BestallningState.current().driftmiljo.id) {
          console.warn('going to parent state');
          $state.go('order');
          return;
        }

        $scope.updateAnslutningarIValdTjanstedoman = function () {
          if ($scope.producentbestallning.driftmiljo && $scope.producentbestallning.tjanstekomponent && $scope.selectedTjanstedoman) {
            var tjanstekomponentId = $scope.producentbestallning.tjanstekomponent.hsaId;
            var driftmiljoId = $scope.producentbestallning.driftmiljo.id;
            var tjanstedomanId = $scope.selectedTjanstedoman.tjansteDomanId;
            ServiceContract.listAnslutningar(tjanstekomponentId, driftmiljoId, tjanstedomanId).then(function (anslutningar) {
              $scope.anslutningarIValdTjanstedoman = _.map(anslutningar, function (anslutning) {
                anslutning._paBestallning = ProducentbestallningState.isAnslutningOnOrder(anslutning);
                return anslutning;
              });
            });
          }
        };

        /**
         * calculate whether the user should be allowed to handle 'anslutningar' in a unified fashion or
         * if she must configure them separately
         * @private
         */
        var _recalculateLogiskaAdresserUnity = function () {
          var nyaLogiskaAdresserIntersection = intersectionFilter(ProducentbestallningState.current().producentanslutningar, 'nyaLogiskaAdresser');
          var befintligaLogiskaAdresserIntersection = intersectionFilter(ProducentbestallningState.current(), 'befintligaLogiskaAdresser');

          var nyaLogiskaAdresserUnity = _.isUndefined(nyaLogiskaAdresserIntersection);
          if (!nyaLogiskaAdresserUnity) {
            nyaLogiskaAdresserUnity = _.every(_.map(ProducentbestallningState.current().producentanslutningar, 'nyaLogiskaAdresser'), function (laArr) {
              var diff = _.difference(_.map(laArr, 'hsaId'), _.map(nyaLogiskaAdresserIntersection, 'hsaId'));
              return diff.length === 0;
            });
          }
          var befintligaLogiskaAdresserUnity = _.isUndefined(befintligaLogiskaAdresserIntersection);
          if (!befintligaLogiskaAdresserUnity) {
            befintligaLogiskaAdresserUnity = _.every(_.map(ProducentbestallningState.current().producentanslutningar, 'befintligaLogiskaAdresser'), function (laArr) {
              var diff = _.difference(_.map(laArr, 'hsaId'), _.map(befintligaLogiskaAdresserIntersection, 'hsaId'));
              return diff.length === 0;
            });
          }
          var uniq = _.uniq(ProducentbestallningState.current().producentanslutningar, 'installedForProducerHsaId');
          var mid = (nyaLogiskaAdresserUnity && befintligaLogiskaAdresserUnity && uniq.length === 1);
          $timeout(function () {
            $scope.canHandleLogiskaAdresserInUnity = mid;
          });
        };

        $scope.$on('logisk-adress-added', _.debounce(function () {
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.$on('logisk-adress-removed', _.debounce(function () {
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.$on('anslutning-added', _.debounce(function () {
          $scope.updateAnslutningarIValdTjanstedoman();
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.$on('anslutning-removed', _.debounce(function () {
          $scope.updateAnslutningarIValdTjanstedoman();
          _recalculateLogiskaAdresserUnity();
        }, 100));

        $scope.updateValdaAnslutningar = function () {
          _.each(_.filter($scope.anslutningarIValdTjanstedoman, '_selected'), function (anslutning) {
            ProducentbestallningState.addAnslutning(anslutning);
            delete anslutning._selected; //deselect in UI
          });
        };

        $scope.$watch('canHandleLogiskaAdresserInUnity', function () {
          if (!$scope.canHandleLogiskaAdresserInUnity) {
            $scope.linkLogicalAddressChoice = 'individualPerAnslutning';
          }
        });

        var _recheckOrderValidity = function() {
          if ($scope.sendOrderClicked) {
            $scope.orderValid = _checkGlobalValidation();
          }
        };

        $scope.$on('gv-leaving-element-invalid', _recheckOrderValidity);
        $scope.$on('gv-leaving-element-valid', _recheckOrderValidity);
        $scope.$on('gv-element-invalid', _recheckOrderValidity);
        $scope.$on('gv-element-invalid-in-focus', _recheckOrderValidity);
        $scope.$on('gv-element-valid', _recheckOrderValidity);
        $scope.$on('gv-element-valid-in-focus', _recheckOrderValidity);

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

        var _checkGlobalValidation = function () {
          var formGroupElements = document.querySelectorAll('.form-group.gv-invalid');
          var returnVal = formGroupElements.length === 0;
          return returnVal;
        };

        $scope.submitProducentbestallning = function () {
          $scope.sendOrderClicked = true;
          if (!validateForms()) {
            console.warn('--- order is not valid ---');
            $scope.orderValid = false;
          } else {
            console.info('--- order is valid ---');
            $scope.orderValid = true;
            Bestallning.createProducentbestallning(ProducentbestallningState.current()).then(function (status) {
              console.log('Status: ' + status);
              if (status === 201) {
                console.log('Going to state');
                //reset();
                $state.go('serviceProducerOrderConfirmed');
              }
            });

          }
        };

        _.assign($scope, {
          addLogiskAdressToAllAnslutningar: ProducentbestallningState.addLogiskAdressToAllAnslutningar,
          addLogiskAdressToAnslutning: ProducentbestallningState.addLogiskAdressToAnslutning,
          canAddLogiskAdressToAllAnslutningar: ProducentbestallningState.canAddLogiskAdressToAllAnslutningar,
          canAddLogiskAdressToAnslutning: ProducentbestallningState.canAddLogiskAdressToAnslutning,
          removeLogiskAdressFromAllAnslutningar: ProducentbestallningState.removeLogiskAdressFromAllAnslutningar,
          removeLogiskAdressFromAnslutning: ProducentbestallningState.removeLogiskAdressFromAnslutning,
          addTjanstekonsumentToOrder: ProducentbestallningState.addTjanstekonsument,
          removeTjanstekonsumentFromOrder: ProducentbestallningState.removeTjanstekonsument,
          removeAnslutningFromOrder: ProducentbestallningState.removeAnslutning,
          getFilteredLogiskaAdresser: LogicalAddress.getFilteredLogicalAddresses
        });

        var _reset = function() {
          console.info('--- reset ---');
          _.assign($scope, {
            rivProfiles: rivProfiles,
            canHandleLogiskaAdresserInUnity: true,
            linkLogicalAddressChoice: 'sameForAllAnslutningar',
            orderValid: true,
            sendOrderClicked: false,
            selectedTjanstedoman: undefined,
            selectedLogicalAddress: {},
            requestForCallPermissionInSeparateOrder: true
          });
          $scope.$broadcast('show-errors-reset');
          _.each($scope.nat, function(nat) {
            delete nat._checked;
          });
        };

        _reset();

        ProducentbestallningState.init().then(function () {
          $scope.producentbestallning = ProducentbestallningState.current();
        });

        $scope.$watch(function () { //watching for changed tjanstekomponent in 'main' Bestallning
          return BestallningState.current().tjanstekomponent;
        }, function (newVal) {
          if (newVal) {
            _reset();
            ProducentbestallningState.setTjanstekomponent(newVal);
            $scope.updateAnslutningarIValdTjanstedoman();
          }
        }, true);

        $scope.$watch(function () { //watching for changed nat in 'main' Bestallning
          return BestallningState.current().nat;
        }, function (newVal) {
          if (newVal) {
            ProducentbestallningState.setNat(newVal);
            $scope.updateAnslutningarIValdTjanstedoman();
          }
        }, true);



      }
    ]
  );
