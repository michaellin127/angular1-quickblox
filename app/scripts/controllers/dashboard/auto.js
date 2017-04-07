'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:AutoCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('AutoCtrl', function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, Config, QuickbloxService, $http) {
		$scope.init = function() {
			// $scope.qbParams = {skip: 0, limit: 100};
			// $scope.pagination = {total: 0, page: 1, maxsize: 5, per_page: $scope.qbParams.limit};
			$scope.gridOptions = {
				rowData: null,
				enableColResize: true,
				rowHeight: 40,
				rowSelection: 'single',
				suppressRowClickSelection: true,
				columnDefs: [
					{headerName:'Username', field: 'username', width: 150, editable: true},
					{headerName:'Quickblox User ID', field: 'qbuserid', width: 150, editable: true},
					{headerName:'Message', field: 'message', width: 350, editable: true},
					{headerName:'Delay Time(S)', field: 'delay', width: 120, editable: true},
					{
						headerName:'Active', field: 'active', width: 100, editable: true, cellEditor:'select',
						cellEditorParams: {
							values: ['1', '0']
						}
					},
					// {
					// 	headerName:'Active status', field: 'active', width: 100,
					// 	cellRenderer: function(params) {
					// 		var checked = params.value ? true : false;
					// 		var eDiv = document.createElement('div');
					// 		eDiv.innerHTML = '<input type="checkbox" checked>'
					// 		// return params.value ? new Date(params.value * 1000).toLocaleString() : '';
					// 	}
					// },
				],
				onCellValueChanged: $scope.onChange
			};
			$scope.isRandom = false;
			$scope.autoUsers = [];
			$scope.getAutoUser();
			$scope.getIsRandom();
		};
		$scope.onChangeRandom = function(value) {
			var is_rand = (value) ? 1 : 0;
			var strdata = '';
			strdata = 'action=setIsRandomAutoMsg&random=' + is_rand;
			$rootScope.startLoading('Waiting');
			$http.post(Config.api.url, strdata, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).then(function(res) {
				$rootScope.finishLoading('Waiting');
			},
			function(err) {
				alert("Failed to connect server(change random).");
				$rootScope.finishLoading('Waiting');
			});
		}
		$scope.getIsRandom = function() {
			var url = Config.api.url + "?action=getIsRandomAutoMsg";
			$rootScope.startLoading('Waiting');
			$http.get(url).then(function(res) {
				$scope.isRandom = (res.data.values === "1") ? true : false;
				$rootScope.finishLoading('Waiting');
			},
			function(err) {
				alert("Failed to connect server(get IsRandom).");
				$rootScope.finishLoading('Waiting');
			});
		};
		$scope.getAutoUser = function() {
			var url = Config.api.url + "?action=getAutoUser";
			$http.get(url).then(function(res) {
				$scope.autoUsers = res.data.values;
				$scope.setTBData($scope.autoUsers);
			},
			function(err) {
				alert("Failed to connect server(get).");
				$scope.autoUsers = [];
				$scope.setTBData($scope.autoUsers);
			});
		};
		$scope.updateAutoUser = function(data) {
			data.action = 'updateAutoUser';
			var strdata = '';
			for (name in data) {
				if (strdata === '') {
					strdata = encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
				} else {
					strdata += '&' + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
				}
			}
			$http.post(Config.api.url, strdata, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).then(function(res) {
				$scope.getAutoUser();
				// $scope.gridOptions.api.hideOverlay();
			},
			function(err) {
				$scope.errorHandler('Failed to connect server(update).');
			});
		};
		$scope.setTBData = function(data) {
			setTimeout(function() {
				$scope.gridOptions.api.hideOverlay();
				$scope.gridOptions.api.setRowData(data);
			}, 100);
		};
		$scope.onChange = function(event) {
			$scope.gridOptions.api.showLoadingOverlay();
			var userinfo = event.data;
			if (event.colDef.field === 'username' || event.colDef.field === 'qbuserid') {
				// var params = {}
				var tmp = (event.colDef.field === 'username') ? 'login' : 'id';
				var params = {filter: {field: tmp, param: 'eq', value: event.newValue}};
				QuickbloxService.getUsers(params).then(function(res) {
					if (res.items.length > 0) {
						userinfo.qbuserid = res.items[0].user.id;
						userinfo.username = res.items[0].user.login;
						$scope.updateAutoUser(userinfo);
					} else {
						$scope.errorHandler('Wrong Username/UserID!');
					}
				},
				function(err) {
					$scope.errorHandler('Failed to change Username/UserID');
				});
			} else {
				$scope.updateAutoUser(userinfo);
			}
		};
		$scope.errorHandler = function(msg) {
			$scope.getAutoUser();
			alert(msg);
			// $scope.gridOptions.api.hideOverlay();
		};
		$scope.openModal = function(page, size) {
			$scope.modal = $uibModal.open({
				animation: true,
				templateUrl: page,
				size: size,
				scope: $scope,
				backdrop: 'static',
				resolve: {
					items: function() {
						return $scope.items;
					}
				}
			});
		};
		$scope.closeModal = function() {
			$scope.chat.messages = [];
			$scope.modal.close();
		};
		$scope.init();
	});
