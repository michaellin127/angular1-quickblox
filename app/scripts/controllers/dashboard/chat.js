'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:ChatCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('ChatCtrl', function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, Config, QuickbloxService) {
		$scope.init = function() {
			console.log('init');
			$scope.qbParams = {skip: 0, limit: 10};
			$scope.pagination = {total: 0, page: 1, maxsize: 5, per_page: $scope.qbParams.limit};
			$scope.gridOptions = {
				rowData: null,
				enableColResize: true,
				rowHeight: 40,
				rowSelection: 'multiple',
				suppressRowClickSelection: true,
				columnDefs: [
					{
						headerName:'',
						field: 'checkbox',
						cellClass:['text-center'],
						checkboxSelection: true,
						suppressMenu: true,
						suppressSorting: true,
						headerCellRenderer: $scope.selectAllRenderer,
						width: 40
					},
					// {headerName:'', field: 'checkbox', checkboxSelection: true, width: 40, cellClass:['text-center']},
					{headerName:'ID', field: '_id', width: 240},
					{headerName:'Name', field: 'name', width: 105},
					{headerName:'Occupants IDs', field: 'occupants_ids', width: 170},
					{headerName:'Last message', field: 'last_message', width: 250},
					{headerName:'Last message User ID', field: 'last_message_user_id', width: 185, cellClass:['text-center']},
					{
						headerName:'Last message date sent', field: 'last_message_date_sent', width: 200,
						cellRenderer: function(params) {
							return params.value ? new Date(params.value * 1000).toLocaleString() : '';
						}
					},
				],
				onCellClicked: $scope.showChat
			};
			$scope.selChatDialog = {};
			$scope.chat = {
				messages:[],
				me: {
					userId: $localStorage.session.user_id.toString(),
					userName: $localStorage.session.login
				}
			};
			$scope.chatDialogs = [];
			$scope.isFilter = true;
			$scope.isRecentFilter = true;
			$scope.getDialogs();
			$scope.autoRefresh = setInterval($scope.refreshChat, 60*1000);
		};
		$scope.selectAllRenderer = function(params) {
			var cb = document.createElement('input');
			cb.setAttribute('type', 'checkbox');

			var eHeader = document.createElement('label');
			var eTitle = document.createTextNode(params.colDef.headerName);
			eHeader.appendChild(cb);
			eHeader.appendChild(eTitle);

			cb.addEventListener('change', function(e) {
				if ($(this)[0].checked) {
					params.api.selectAll();
				} else {
					params.api.deselectAll();
				}
			});
			return eHeader;
		};
		$scope.onFilterChanged = function(value) {
			$scope.gridOptions.api.setQuickFilter(value);
		};
		$scope.pageChanged = function() {
			$scope.gridOptions.api.showLoadingOverlay();
			$scope.qbParams.skip = ($scope.pagination.page - 1) * $scope.qbParams.limit;
			$scope.getDialogs();
		};
		$scope.refreshChat = function() {
			$scope.gridOptions.api.showLoadingOverlay();
			$scope.getDialogs();
		};
		$scope.onChangeFilter = function(isRecentFilter) {
			$scope.gridOptions.api.showLoadingOverlay();
			$scope.isFilter = isRecentFilter;
			$scope.getDialogs();
		};
		$scope.getDialogs = function() {
			if ($scope.isFilter) {
				$scope.qbParams.last_message_user_id = {"nin" : [$localStorage.session.user_id, 'null']};
			} else {
				delete $scope.qbParams.last_message_user_id;
			}
			QuickbloxService.getDialogs($scope.qbParams).then(function(res) {
				var $filtered = res.items;
				// if ($localStorage.session.login === 'djpessy11' && $scope.isFilter) { //Admin user
				// 	$filtered = $filter('filter')($filtered, function(value, index, array) {
				// 		var other_id = ($localStorage.session.user_id === value.occupants_ids[0]) ? value.occupants_ids[1] : value.occupants_ids[0];
				// 		return (Config.occupantsIDsForAdmin.indexOf(other_id) < 0) ? false : true;
				// 	});
				// }
				$scope.gridOptions.api.setRowData($filtered);
				$scope.pagination.total = res.total_entries;
			},
			function(err) {
				$scope.gridOptions.api.setRowData([]);
				$scope.pagination.total = 0;
				$scope.pagination.page = 0;
			});
		};
		$scope.showChat = function(param) {
			if (param.column.colId === 'checkbox') {
				return false;
			}
			$rootScope.startLoading('loadingChat');
			$scope.selChatDialog = param.data;
			var modal_template = 'views/modal/chat.html';
			QuickbloxService.getMessageList($scope.selChatDialog._id).then(function(res) {
				$scope.setMessage(res.items);
				$scope.openModal(modal_template, 'lg');
				$rootScope.finishLoading('loadingChat');
			},
			function(err) {
				alert('Failed to get message list. Please refresh this page');
				$rootScope.finishLoading('loadingChat');
			});
		};
		$scope.setMessage = function(messages) {
			var msg = {};
			angular.forEach(messages, function(message, key) {
				msg.id = message._id;
				if (message.attachments.length > 0) {
					console.log(message);
					var fileId = message.attachments[0].id;
					var attachtype = message.attachments[0].type;
					var qbSessionToken = QuickbloxService.session.token;
					var privateUrl = "https://apichitchat.quickblox.com/blobs/" + fileId + "/download?token=" + qbSessionToken;
					var imageHTML = "";
					if (attachtype == 'video') {
						imageHTML = "<video width='320' height='240' controls><source src='" + privateUrl + "' type='video/mp4'>Your browser does not support the video tag.</video>";
					} else {
						imageHTML = "<img src='" + privateUrl + "' alt='photo'/>";
					}
					msg.text = imageHTML;
				} else {
					msg.text = message.message;
				}
				msg.userId = message.sender_id.toString();
				msg.date = message.date_sent * 1000;
				$scope.chat.messages.push(msg);
				msg = {};
			});
			$scope.chat.messages.reverse();
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
		$scope.sendMessage = function(message) {
			QuickbloxService.sendMessage($scope.selChatDialog, message.text);
		};
		$scope.sendAttachment = function(attach) {
			if (angular.isDefined(attach)) {
				QuickbloxService.sendAttachment($scope.selChatDialog, attach);
			}
		};
		$scope.$on('$destroy', function(event) {
			alert('leave page');
			clearInterval($scope.autoRefresh);
		});
		$scope.init();
	});
