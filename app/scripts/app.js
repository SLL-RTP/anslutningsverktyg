'use strict';

/**
 * @ngdoc overview
 * @name anslutningsverktygetApp
 * @description
 * # anslutningsverktygetApp
 *
 * Main module of the application.
 */
angular
  .module('avApp', [
    'services.config',
    'ngAnimate',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.showErrors',
    'ng.shims.placeholder'
  ])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    // Now set up the states
    $stateProvider
      .state('landing', {
        url: '/',
        templateUrl: 'views/landing.html'
      })
      .state('updateTjanstekomponent', {
        url: '/tjanstekomponent/update',
        templateUrl: 'views/tjanstekomponent/update.html',
        controller: 'UpdateTjanstekomponentCtrl'
      })
      .state('updateTjanstekomponentConfirmation', {
        url: '/tjanstekomponent/update/confirmation',
        templateUrl: 'views/tjanstekomponent/confirmation.html'
      })
      .state('connectServiceProducer', {
        url: '/connectServiceProducer',
        templateUrl: 'views/serviceProducer/connect.html',
        controller: 'ConnectServiceProducerCtrl',
        resolve: {
          environments: ['Environment',
            function(EnvironmentFactory) {
              return EnvironmentFactory.getAvailableEnvironments();
            }],
          rivProfiles: ['RivProfile',
            function(RivProfileFactory) {
              return RivProfileFactory.getAvailableProfiles();
            }
          ],
          currentUser: ['User',
            function(UserFactory) {
              return UserFactory.getCurrentUser();
            }
          ],
          nat: ['Nat',
            function(NatFactory) {
              return NatFactory.getNat();
            }

          ]
        }
      })
      .state('serviceProducerOrderConfirmed', {
        url: '/connectServiceProducer/confirmed',
        templateUrl: 'views/serviceProducer/confirmed.html'
      })
      .state('order', {
        resolve: {
          environments: ['Environment',
            function(EnvironmentFactory) {
              return EnvironmentFactory.getAvailableEnvironments();
            }],
          currentUser: ['User',
            function(UserFactory) {
              return UserFactory.getCurrentUser();
            }
          ],
          nat: ['Nat',
            function(NatFactory) {
              return NatFactory.getNat();
            }
          ],
          mainOrder: ['BestallningState', '$q',
            function(BestallningStateFactory, $q) {
              var deferred = $q.defer();
              BestallningStateFactory.init().then(function() {
                deferred.resolve(BestallningStateFactory.current());
              });
              return deferred.promise;
            }
          ]
        },
        url: '/order',
        controller: 'OrderMainCtrl',
        templateUrl: 'views/order/main.html'
      })
      .state('order.producent', {
        resolve: {
          rivProfiles: ['RivProfile',
            function(RivProfileFactory) {
              return RivProfileFactory.getAvailableProfiles();
            }
          ]
        },
        parent: 'order',
        url: '/producent',
        controller: 'OrderProducentCtrl',
        templateUrl: 'views/order/producent.html'
      })
      .state('order.konsument', {
        parent: 'order',
        url: '/konsument',
        controller: 'OrderKonsumentCtrl',
        templateUrl: 'views/order/konsument.html'
      })
      .state('exempelmatris', {
        url: '/exempelmatris',
        templateUrl: 'views/exempelmatris/exempelmatris.html',
        controller: 'ExempelMatrisCtrl'
      });
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('SessionInterceptor');
  }]);
