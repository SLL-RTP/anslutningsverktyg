'use strict';

angular.module('avApp')
  .factory('SessionInterceptor', ['configuration', function (configuration) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        config.headers['X-ap-auth'] = configuration.apiToken;
        return config;
      }
    };
  }]);
