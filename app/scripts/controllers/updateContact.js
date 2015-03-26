'use strict';

angular.module('avApp')
  .controller('UpdateContactCtrl', ['$scope', '$log', 'ServiceComponent',
    function ($scope, $log, ServiceComponent) {

      $scope.selectedServiceComponent = {};
      $scope.filteredServiceComponents = [];

      $scope.filterServiceComponents = function (query) {
        ServiceComponent.getFilteredServiceComponents(query).then(function (result) {
          $scope.filteredServiceComponents = result;
        });
      };

      $scope.$watch('selectedServiceComponent.selected', function (newValue) {
          if (newValue) {
            reset();
            if (angular.isDefined(newValue.namn)) { //FIXME: fix until backend returns a service component from TAK on this call
              ServiceComponent.getServiceComponent(newValue.hsaId).then(function (result) {
                $scope.serviceComponent = _.cloneDeep(result);
              });
            } else {
              $scope.serviceComponent = _.cloneDeep(newValue);
            }
          } else {
            reset();
          }
        }
      );

      $scope.updateComponent = function() {
        console.log('updateComponent: ');
        console.log($scope.serviceComponent);
        ServiceComponent.updateServiceComponent($scope.serviceComponent);
      };

      var reset = function () {
        delete $scope.serviceComponent;
      };
    }
  ]
);
