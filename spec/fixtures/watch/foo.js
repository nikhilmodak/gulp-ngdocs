'use strict';

angular.module('my.directives', [])

/**
  * @ngdoc directive
  * @name my.directives.directive:foo
  * @restrict E
  * @description A custom element-directive that does nothing in particular
  * @param {Object} bar An argument that does nothing in particular.
  * @example 
**/ 
.directive('foo', function() {
  return {
    scope: {
      bar: '='
    }
  };
});