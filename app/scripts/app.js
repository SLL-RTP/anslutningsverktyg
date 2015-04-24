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
          ]
        }
      })
      .state('serviceProducerOrderConfirmed', {
        url: '/connectServiceProducer/confirmed',
        templateUrl: 'views/serviceProducer/confirmed.html'
      });
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('SessionInterceptor');
  }]);
