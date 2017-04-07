'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('DashboardCtrl', function($scope, $state, $location, $rootScope, $localStorage) {
		$scope.$state = $state;
		$scope.username = $localStorage.session.login;
		$scope.logout = function() {
			$rootScope.logout();
		}
	});
