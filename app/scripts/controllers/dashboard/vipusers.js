'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:VIPUsersCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('VIPUsersCtrl', function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, QuickbloxService, Config, $http) {
		$scope.init = function() {
			// $scope.qbParams = {page: 1, per_page: 100};
			// $scope.pagination = {total: 0, page: 1, maxsize: 5, per_page: 100};
			$scope.gridOptions = {
				rowData: null,
				enableColResize: true,
				enableFilter: true,
				rowHeight: 40,
				rowSelection: 'multiple',
				suppressRowClickSelection: true,
				columnDefs: [
					{headerName:'Username', field: 'user_name', filter: 'text', filterParams: {apply: true}},
					{headerName:'Device ID', field: 'user_device_id', width: 350, filter: 'text', filterParams: {apply: true}},
					{headerName:'Created Date', field: 'user_created', filter: 'text', filterParams: {apply: true}},
					{headerName:'Media Upgrade', field: 'user_is_media', filter: 'text', filterParams: {apply: true}},
				],
			};
			$scope.getUsers();
		};
		$scope.onFilterChanged = function(value) {
			$scope.filterText = value;
			$scope.gridOptions.api.setQuickFilter(value);
		};
		$scope.getUsers = function() {
			var url = Config.api.url + "?action=getVIPUser";
			$http.get(url).then(function(res) {
				console.log(res);
				$scope.vipUsers = res.data.values;
				$scope.gridOptions.api.setRowData($scope.vipUsers);
			},
			function(err) {
				alert("Failed to connect server(get).");
				$scope.vipUsers = [];
				$scope.gridOptions.api.setRowData($scope.vipUsers);
			});
		};
		$scope.init();
	});
