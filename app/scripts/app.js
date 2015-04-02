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
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'ui.grid',
    'ui.grid.selection',
    'ui.select',
    'ngTagsInput',
    'ui.bootstrap.showErrors'
  ])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    // Now set up the states
    $stateProvider
      .state('landing', {
        url: '/',
        templateUrl: 'views/landing.html'
      })
      .state('updateContact', {
        url: '/contact/update',
        templateUrl: 'views/contact/update.html',
        controller: 'UpdateContactCtrl'
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
  .config(['uiSelectConfig', function(uiSelectConfig) {
    uiSelectConfig.theme = 'bootstrap';
  }])
  .config(['tagsInputConfigProvider', function(tagsInputConfigProvider) {
    tagsInputConfigProvider
      .setDefaults('tagsInput', {
        placeholder: '',
        addOnEnter: false
      });
  }]).config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('SessionInterceptor');
  }]).config(['showErrorsConfigProvider', function(showErrorsConfigProvider) {
    showErrorsConfigProvider.showSuccess(true);
  }]);
