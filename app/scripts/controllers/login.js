'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('LoginCtrl', function($scope, $rootScope, $location, $localStorage, QuickbloxService) {
		$scope.user = {};
		$scope.submit = function(isvalid) {
			$rootScope.startLoading('loadingLogin');
			if (isvalid) {
				QuickbloxService.createSession($scope.user).then(function(result) {
					$localStorage.session = $scope.user;
					$localStorage.session.user_id = result.user_id;
					// $localStorage.session.user_id = 19565312;
					QuickbloxService.connect().then(function(result) {
						$location.path('/dashboard');
						$rootScope.finishLoading('loadingLogin');
					},
					function(err) {
						alert('Invalid Username and Password');
						$rootScope.finishLoading('loadingLogin');
					});
				},
				function(err) {
					console.log(err);
					if (err.code == 401) {
						alert('Invalid Username and Password1');
					} else {
						alert('Failed to create Quickblox Session');
					}
					$rootScope.finishLoading('loadingLogin');
				});
			} else {
				$rootScope.finishLoading('loadingLogin');
			}
			return false;
		}
	});
