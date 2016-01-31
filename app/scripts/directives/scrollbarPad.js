'use strict';

angular.module('avApp')
  .directive('scrollbarPad', ['$parse', 'ScrollbarPadService',
    function($parse, ScrollbarPadService) {
      return {
        restrict: 'A',
        scope: {
          scrollbarPad: '='
        },
        link: function($scope, $element, $attr) {
          $scope.$watch('scrollbarPad', function(value) {
            if (value) {
              if (!ScrollbarPadService.isZero()) {
                $element.css({'padding-right': ScrollbarPadService.getWidth() + 'px'});
              }
            } else {
              $element.css({'padding-right': ''});
            }
          });
        }
      };
  }])
  .factory('ScrollbarPadService', function() {
    var _scrollbarWidth;
    var _init = function() {
      var scrollDiv = document.createElement('div');
      scrollDiv.className = 'scrollbar-measure';
      document.body.appendChild(scrollDiv);
      var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
      _scrollbarWidth = scrollbarWidth;
    };
    return {
      getWidth: function() {
        if (_scrollbarWidth === undefined) {
          _init();
        }
        return _scrollbarWidth;
      },
      isZero: function() {
        if (_scrollbarWidth === undefined) {
          _init();
        }
        return _scrollbarWidth === 0;
      }
    };
  });
