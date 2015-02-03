'use strict';

angular.module('my.services', [])

/**
  * @ngdoc service
  * @name my.services.bar
  * @requires other
**/
.service('bar', function() {
  this.baz = function() {
    console.log('boop');
  }
});