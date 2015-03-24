'use strict';

angular.module('services.config', [])
  .constant('configuration', {
    basePath: '@@basePath',
    apiToken: '@@apiToken',
    devDebug: '@@devDebug'
  });
