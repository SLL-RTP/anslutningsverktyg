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
    'avApp.constants',
    'ngAnimate',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.showErrors',
    'ng.shims.placeholder',
    'pascalprecht.translate'
  ])
  .config(['$stateProvider', '$urlRouterProvider', '$translateProvider', 'translations', function ($stateProvider, $urlRouterProvider, $translateProvider, translations) {

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
        controller: 'UpdateTjanstekomponentCtrl',
        resolve: {
          nat: ['Nat',
            function(NatFactory) {
              return NatFactory.getNat();
            }
          ]
        }
      })
      .state('updateTjanstekomponentConfirmation', {
        url: '/tjanstekomponent/update/confirmation',
        templateUrl: 'views/tjanstekomponent/confirmation.html'
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
      .state('order-confirmation', {
        url: '/order/confirmation',
        templateUrl: 'views/order-confirmation/order-confirmation.html'
      });

    //add translations to $translateProvider
    _.forOwn(translations, function (translationMap, languageKey) {
      $translateProvider.translations(languageKey, translationMap);
    });

    //set up $translateProvider
    $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
    $translateProvider.preferredLanguage('sv');

  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('SessionInterceptor');
  }])
  .run(['$rootScope', 'configuration', function($rootScope, configuration) {
    $rootScope.configuration = configuration;
  }]);
