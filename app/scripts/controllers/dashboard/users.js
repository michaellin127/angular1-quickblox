'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:UsersCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('UsersCtrl', function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, QuickbloxService) {
		$scope.init = function() {
			$scope.per_page = 100;
			$scope.qbParams = {page: 1, per_page: $scope.per_page};
			$scope.qbDialogParams = {skip: 0, limit: $scope.per_page, type: 3};
			$scope.pagination = {total: 0, page: 1, maxsize: 5, per_page: $scope.per_page};
			$scope.gridOptions = {
				rowData: null,
				enableColResize: true,
				enableFilter: true,
				rowHeight: 40,
				rowSelection: 'multiple',
				suppressRowClickSelection: true,
				angularCompileHeaders: true,
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
					{headerName:'QuickBlox ID', field: 'id', cellClass:['col-sm-4'], filter: 'text', filterParams: {apply: true}},
					{headerName:'Quickblox Login', field: 'login', filter: 'text', filterParams: {apply: true}},
					// {headerName:'Email', field: 'email', filter: 'text', filterParams: {apply: true}}
				],
				onCellClicked: $scope.showChat,
			};
			$scope.selUser = null;
			$scope.selChatDialog = {};
			$scope.chat = {
				messages:[],
				me: {
					userId: $localStorage.session.user_id.toString(),
					userName: $localStorage.session.login
				}
			};
			$scope.chatDialogs = [];
			$scope.selMultiUser = null;
			$scope.selMultiChatDialog = [];
			$scope.isShowChatUser = false;
			$scope.getUsers();
		};
		$scope.onFilterbyChatUser = function(value) {
			$scope.isShowChatUser = value;
			$scope.qbParams = {page: 1, per_page: $scope.per_page};
			$scope.qbDialogParams = {skip: 0, limit: $scope.per_page};
			$scope.pagination = {total: 0, page: 1, maxsize: 5, per_page: $scope.per_page};
			$scope.getUsers();
		}
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
			$scope.filterText = value;
			$scope.gridOptions.api.setQuickFilter(value);
		};
		$scope.filterUsers = function(event, value) {
			if (event.keyCode === 13) {
				console.log('enter');
				console.log(value);
				$scope.filterText = value;
				$scope.getUsers();
			}
		}
		$scope.pageChanged = function() {
			// $scope.gridOptions.api.showLoadingOverlay();
			$scope.qbParams.page = $scope.pagination.page;
			$scope.qbDialogParams.skip = ($scope.pagination.page - 1) * $scope.per_page;
			$scope.getUsers();
		};
		$scope.getUsers = function() {
			setTimeout(function() {
				$scope.gridOptions.api.showLoadingOverlay();
				($scope.isShowChatUser) ? $scope.getChatUsers() : $scope.getAllUsers();
			}, 1000);
		};
		$scope.getChatUsers = function() {
			$scope.qbDialogParams.last_message_user_id = {"nin" : ['null']};
			QuickbloxService.getAllDialogs($scope.qbDialogParams).then(function(res) {
				console.log(res);
				var $filtered = res.items;
				var tmps = [];
				var tmp_sender_info = {};
				angular.forEach(res.items, function(val, key) {
					// tmp_dialog_ids.push(val._id);
					tmp_sender_info.id = QuickbloxService.qb.chat.helpers.getRecipientId(val.occupants_ids, $localStorage.session.user_id);
					tmp_sender_info.login = val.name;
					tmp_sender_info.email  = "";
					QuickbloxService.getMessageListbySendId(val._id, tmp_sender_info).then(function(res_msg) {
						if (res_msg.items.length > 0) {
							tmps.push(res_msg.sender);
						}
						if (key === (res.items.length - 1)) {
							setTimeout(function() {
								console.log(tmps);
								$scope.gridOptions.api.setRowData(tmps);
								$scope.pagination.total = 0;
								if ($scope.filterText !== undefined && $scope.filterText !== "") {
									$scope.gridOptions.api.setQuickFilter($scope.filterText);
								}
							}, 500);
						}
					},
					function(err) {
					});
					tmp_sender_info = {};
				});
			},
			function(err) {
				$scope.gridOptions.api.setRowData([]);
				$scope.pagination.total = 0;
				$scope.pagination.page = 0;
			});
		};
		$scope.getAllUsers = function() {
			var tmp = [];
			// if ($scope.filterText !== undefined && $scope.filterText !== "") {
			// 	$scope.qbParams.filter = { field: 'login', param: 'gt', value: $scope.filterText};
			// } else {
			// 	delete $scope.qbParams.filter;
			// }
			QuickbloxService.getUsers($scope.qbParams).then(function(res) {
				angular.forEach(res.items, function(val, key) {
					tmp.push(val.user)
				});
				$scope.gridOptions.api.showLoadingOverlay();
				$scope.gridOptions.api.setRowData(tmp);
				$scope.pagination.total = res.total_entries;
				$scope.pagination.page = res.current_page;
				if ($scope.filterText !== undefined && $scope.filterText !== "") {
					$scope.gridOptions.api.setQuickFilter($scope.filterText);
				}
			},
			function(err) {
				$scope.gridOptions.api.setRowData([]);
				$scope.pagination.total = 0;
				$scope.pagination.page = 0;
			});
		}
		$scope.filterChatDialogByOccupant = function(dialogs, occupant_id) {
			// var occupant_id = $scope.selUser.id;
			return $filter('filter')(dialogs, {occupants_ids:occupant_id});
		};
		$scope.showChat = function(param) {
			if (param.column.colId === 'checkbox') {
				return false;
			}
			$rootScope.startLoading('loadingChat');
			$scope.selUser = param.data;
			var modal_template = 'views/modal/chat.html';
			QuickbloxService.getDialogs().then(function(res) {
				var filteredDialog = $scope.filterChatDialogByOccupant(res.items, $scope.selUser.id);
				if (filteredDialog.length > 0) {
					$scope.selChatDialog = filteredDialog[0];
					QuickbloxService.getMessageList($scope.selChatDialog._id).then(function(res) {
						console.log(res.items);
						$scope.setMessage(res.items);
						$scope.openModal(modal_template, 'lg');
						$rootScope.finishLoading('loadingChat');
					},
					function(err) {
						alert('Failed to get message list. Please refresh this page');
						$rootScope.finishLoading('loadingChat');
					});
				} else {
					var occupants = [$scope.selUser.id];
					QuickbloxService.createDialog(occupants).then(function(dialog) {
						$scope.selChatDialog = dialog;
						$scope.openModal(modal_template, 'lg');
						$rootScope.finishLoading('loadingChat');
					},
					function(err) {
						alert('Failed to create dialog.');
						$rootScope.finishLoading('loadingChat');
					});
				}
			},
			function(err) {
				if (err.code === 401) {
					alert('Session Expired! Please login again.');
				} else {
					alert('Failed to get dialogs');
				}
				$rootScope.logout();
			});
		};
		$scope.setMessage = function(messages) {
			var msg = {};
			angular.forEach(messages, function(message, key) {
				msg.id = message._id;
				if (message.attachments.length > 0) {
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
			$scope.selUser = null;
			$scope.chat.messages = [];
			$scope.modal.close();
		};
		$scope.sendMessage = function(message) {
			if ($scope.selUser == null) {
				alert('Please select receiver');
			} else {
				QuickbloxService.sendMessage($scope.selChatDialog, message.text);
			}
		};
		$scope.sendAttachment = function(attach) {
			if (angular.isDefined(attach)) {
				QuickbloxService.sendAttachment($scope.selChatDialog, attach);
			}
		};
		$scope.showMultiChat = function() {
			$scope.selMultiUser = $scope.gridOptions.api.getSelectedRows();
			if ($scope.selMultiUser.length > 0) {
				$scope.openModal('views/modal/multichat.html', 'lg');
			} else {
				alert('Please select at least one user');
			}
		};
		$scope.sendMultiChat = function(message) {
			$scope.count = 0;
			$scope.total = $scope.selMultiUser.length;
			if (message === undefined || message === '') {
				alert('please enter message');
				return false;
			}
			$rootScope.startLoading('SendingChat');
			QuickbloxService.getDialogs().then(function(res) {
				$scope.chatDialogs = res.items;
				$scope._sendMultiChat($scope.count, message);
			},
			function(err) {
				alert('Failed to get Dialog in Mass Messaging!');
				$rootScope.finishLoading('SendingChat');
			});
		};
		$scope._sendMultiChat = function(index, message) {
			$scope.count = index + 1;
			var user = $scope.selMultiUser[index];
			var seldialog = {}
			seldialog = $scope.filterChatDialogByOccupant($scope.chatDialogs, user.id);
			seldialog = seldialog[0];
			if (seldialog === undefined || seldialog.length <= 0) {
				var occupants = [user.id];
				QuickbloxService.createDialog(occupants).then(function(dialog) {
					seldialog = dialog;
					QuickbloxService.sendMessage(seldialog, message);
					$scope._recurSendMultiChat(message);
				},
				function(err) {
					$scope._recurSendMultiChat(message);
				});
			} else {
				QuickbloxService.sendMessage(seldialog, message);
				$scope._recurSendMultiChat(message);
			}
		};
		$scope._recurSendMultiChat = function(message) {
			if ($scope.count < $scope.total) {
				$scope._sendMultiChat($scope.count, message);
			} else {
				$rootScope.finishLoading('SendingChat');
				$scope.closeModal();
			}
		};
		$scope.init();
	});
