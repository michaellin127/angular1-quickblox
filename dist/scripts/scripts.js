'use strict';

/**
 * @ngdoc overview
 * @name chitchat
 * @description
 * # chitchat
 *
 * Main module of the application.
 */

	QuickbloxService.$inject = ["$q", "$localStorage", "$rootScope"];
agGrid.initialiseAgGridWithAngular1(angular);

angular
  .module('chitchat', [
    'ui.router',
    'ngAnimate',
    'agGrid',
    'ui.bootstrap',
    'ng-topchat',
    // 'angular-simple-chat',
    'darthwade.dwLoading',
    'ngStorage'
    // 'ui.grid'
  ])
  .config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.when('/dashboard', '/dashboard/users');
    $urlRouterProvider.otherwise('/login');

    $stateProvider
      .state('base', {
        abstract: true,
        url: '',
        templateUrl: 'views/base.html'
      })
        .state('login', {
          url: '/login',
          parent: 'base',
          templateUrl: 'views/login.html',
          controller: 'LoginCtrl'
        })
        .state('dashboard', {
          url: '/dashboard',
          parent: 'base',
          templateUrl: 'views/dashboard.html',
          controller: 'DashboardCtrl'
        })
          .state('users', {
            url: '/users',
            parent: 'dashboard',
            templateUrl: 'views/dashboard/users.html',
            controller: 'UsersCtrl',
          })
          .state('vipusers', {
            url: '/vipusers',
            parent: 'dashboard',
            templateUrl: 'views/dashboard/vipusers.html',
            controller: 'VIPUsersCtrl',
          })
          .state('chat', {
            url: '/chat',
            parent: 'dashboard',
            templateUrl: 'views/dashboard/chat.html',
            controller: 'ChatCtrl',
          })
          .state('auto', {
            url: '/auto',
            parent: 'dashboard',
            templateUrl: 'views/dashboard/auto.html',
            controller: 'AutoCtrl',
          })

  }])
  .run(["$rootScope", "$loading", "$localStorage", "$location", function($rootScope, $loading, $localStorage, $location) {
    $rootScope.startLoading = function(name) {
      $loading.start(name);
    };

    $rootScope.finishLoading = function(name) {
      $loading.finish(name);
    };
    $rootScope.logout = function() {
      $localStorage.$reset();
      $location.path('/login');
    };
    $rootScope.chkImagefile = function(filename) {
      var valid_ext = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'bmp']
      var ext = filename.split('.').pop().toLowerCase();
      return (valid_ext.indexOf(ext) < 0) ? false : true;
    };
  }]);

'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('LoginCtrl', ["$scope", "$rootScope", "$location", "$localStorage", "QuickbloxService", function($scope, $rootScope, $location, $localStorage, QuickbloxService) {
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
	}]);

'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('DashboardCtrl', ["$scope", "$state", "$location", "$rootScope", "$localStorage", function($scope, $state, $location, $rootScope, $localStorage) {
		$scope.$state = $state;
		$scope.username = $localStorage.session.login;
		$scope.logout = function() {
			$rootScope.logout();
		}
	}]);

'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:UsersCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('UsersCtrl', ["$scope", "$rootScope", "$state", "$uibModal", "$filter", "$localStorage", "QuickbloxService", function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, QuickbloxService) {
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
	}]);

'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:VIPUsersCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('VIPUsersCtrl', ["$scope", "$rootScope", "$state", "$uibModal", "$filter", "$localStorage", "QuickbloxService", "Config", "$http", function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, QuickbloxService, Config, $http) {
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
	}]);

'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:ChatCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('ChatCtrl', ["$scope", "$rootScope", "$state", "$uibModal", "$filter", "$localStorage", "Config", "QuickbloxService", function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, Config, QuickbloxService) {
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
	}]);

'use strict';

/**
 * @ngdoc function
 * @name chitchat.controller:AutoCtrl
 * @description
 * # MainCtrl
 * Controller of chitchat
 */
angular.module('chitchat')
	.controller('AutoCtrl', ["$scope", "$rootScope", "$state", "$uibModal", "$filter", "$localStorage", "Config", "QuickbloxService", "$http", function($scope, $rootScope, $state, $uibModal, $filter, $localStorage, Config, QuickbloxService, $http) {
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
	}]);

'use strict';

angular.module('chitchat')
	.service('Config', Config);

function Config() {
	// this.occupantsIDsForAdmin = [
	// 	{login: 'Katty1', user_id: 21422385},
	// 	{login: 'hottie_xoxo', user_id: 21475577},
	// 	{login: 'luluxxx', user_id: 22459727},
	// 	{login: 'hotbella', user_id: 22459396},
	// 	{login: 'sexxy1', user_id: 22459780},
	// 	{login: 'Jenna', user_id: 22459066},
	// 	{login: 'blair45', user_id: 22459437},
	// 	{login: 'janelle', user_id: 22459582},
	// 	{login: 'hottiexx', user_id: 22461718},
	// 	{login: 'dirtygurlx', user_id: 22461647},
	// 	{login: 'miababy', user_id: 22459296},
	// 	{login: 'Emmylove', user_id: 22461780},
	// 	{login: 'sharon66xo', user_id: 22459638},
	// 	{login: 'taytay33', user_id: 22460972},
	// 	{login: 'PicTrade', user_id: 22461189},
	// 	{login: 'picswap', user_id: 22461371},
	// 	{login: 'larascrayy', user_id: 22461528}
	// ],
	this.api = {
		url: "http://52.10.49.5/app/index.php",
	};
	this.occupantsIDsForAdmin = [
		21422385,
		21475577,
		22459727,
		22459396,
		22459780,
		22459066,
		22459437,
		22459582,
		22461718,
		22461647,
		22459296,
		22461780,
		22459638,
		22460972,
		22461189,
		22461371,
		22461528
	];
}

'use strict';

angular.module('chitchat')
	.service('QuickbloxService', QuickbloxService);

	function QuickbloxService($q, $localStorage, $rootScope) {
		var self = this;
		this.config = {
			appId: 48868,
			authKey: '7euzEYpEEUH5F6U',
			authSecret: 'SFrxyAsgfRhc-BJ'
		};
		this.session = {id:null, token:null, login:null, user_id:null, pass:null};
		this.init = function() {
			this.qb = QB;
			var dconfig = {
				endpoints: {
					api: "apichitchat.quickblox.com",
					chat: "chatchitchat.quickblox.com"
				},
				chatProtocol: {
					active: 2 // set 1 to use BOSH, set 2 to use WebSockets (default)
				},
				debug: {mode: 0} // set DEBUG mode
			};
			this.qb.init(this.config.appId, this.config.authKey, this.config.authSecret, dconfig);
			// this.qb.chat.onDeliveredStatusListener = function(messageId, dialogId, userId) {
			// 	console.log('Delivered');
			// 	console.log(messageId);
			// 	console.log(dialogId);
			// 	console.log(userId);
			// };
			// this.qb.chat.onMessageListener = function(userId, receivedMessage) {
			// 	console.log('onMessageListener');
			// 	// sends 'read' status back
			// 	if(receivedMessage.markable){
			// 		var params = {
			// 			messageId: receivedMessage.id,
			// 			userId: userId,
			// 			dialogId: receivedMessage.dialogId
			// 		};
			// 		self.qb.chat.sendReadStatus(params);
			// 	}
			// };
			// this.qb.chat.onReadStatusListener = function(messageId, dialogId, userId) {
			// 	console.log('onReadStatusListener');
			// 	console.log(messageId);
			// 	console.log(dialogId);
			// 	console.log(userId);
			// };
		};
		this.connect = function() {
			var deferred = $q.defer();
			this.qb.chat.connect({userId: this.session.user_id, password: this.session.pass}, function(err, roster) {
				err ? deferred.reject(err) : deferred.resolve(roster);
			});
			return deferred.promise;
		};
		this.createSession = function(userinfo) {
			if (userinfo !== undefined) {
				this.session = (userinfo !== undefined) ? userinfo : null;
			} else {
				this.session = ($localStorage.session !== undefined) ? $localStorage.session : null;
			}
			//{"login":"djpessy11","pass":"Coolio143","id":"58770762a0eb475bcc000128","token":"ed74b5be9edaa07de9f14c36a27ceb523b00bee4","user_id":19565312}
			var deferred = $q.defer();
			if (this.session !== null) {
				this.qb.createSession({login: this.session.login, password: this.session.pass}, function(err, result) {
				// this.qb.createSession(function(err, result) {
					if (result) {
						self.session.id = result._id;
						self.session.token = result.token;
						self.session.user_id = result.user_id;
						// self.session.user_id = 19565312;
						deferred.resolve(result);
					} else {
						self.session.id = null;
						self.session.token = null;
						self.session.login = null;
						self.session.pass = null;
						self.session.user_id = null;
						deferred.reject(err);
					}
				});
			} else {
				deferred.reject('Error: Invalid credentials');
			}
			return deferred.promise;
		};
		this.getUsers = function(params) {
			if (self.session.user_id !== null) {
				return this._getUsers(params);
			} else {
				return this.createSession().then(function() {
					return self._getUsers(params);
				});
			}
		};
		this._getUsers = function(params) {
			var deferred = $q.defer();
			this.qb.users.listUsers(params, function(err, result) {
				result ? deferred.resolve(result) : deferred.reject(err);
			});
			return deferred.promise;
		};
		this.getDialogs = function(filters) {
			if (this.session.user_id !== null) {
				return this._getDialogs(filters);
			} else {
				return this.createSession().then(function() {
					return self._getDialogs(filters);
				});
			}
		};
		this.createDialog = function(occupants) {
			var deferred = $q.defer();
			var params = {
				type: 3,
				occupants_ids: occupants,
				name: 'webchat_with_' + occupants[0]
			};
			this.qb.chat.dialog.create(params, function(err, createdDialog) {
				err ? deferred.reject(err) : deferred.resolve(createdDialog);
			});
			return deferred.promise;
		};
		this._getDialogs = function(filters) {
			var deferred = $q.defer();
			if (filters === undefined) {
				filters = null;
			}
			this.connect().then(function(result) {
				self.qb.chat.dialog.list(filters, function(err, resDialogs) {
					err ? deferred.reject(err) : deferred.resolve(resDialogs);
				});
			});
			return deferred.promise;
		};
		this.getAllDialogs = function(filters) {
			if (this.session.user_id !== null) {
				return this._getAllDialogs(filters);
			} else {
				return this.createSession().then(function() {
					return self._getAllDialogs(filters);
				});
			}
		};
		this._getAllDialogs = function(filters) {
			var deferred = $q.defer();
			var count_filters = angular.copy(filters);
			count_filters.count = 1;
			if (filters === undefined) {
				filters = null;
			}
			this.connect().then(function(result) {
				self.qb.chat.dialog.list(count_filters, function(counts_err, counts_res) {
					if (counts_err) {
						deferred.reject(counts_err);
					} else {
						// deferred.resolve(counts_res);
						filters.limit = counts_res.items.count;
						filters.skip = 0;
						self.qb.chat.dialog.list(filters, function(err, resDialogs) {
							err ? deferred.reject(err) : deferred.resolve(resDialogs);
						});
					}
				});
				// self.qb.chat.dialog.list(filters, function(err, resDialogs) {
				// 	err ? deferred.reject(err) : deferred.resolve(resDialogs);
				// });
			});
			return deferred.promise;
		}
		this.getMessageList = function(dialog_id) {
			var deferred = $q.defer();
			var params = {chat_dialog_id: dialog_id, sort_desc: 'date_sent', limit: 100, skip: 0};
			this.qb.chat.message.list(params, function(err, messages) {
				messages ? deferred.resolve(messages) : deferred.reject(err);
			});
			return deferred.promise;
		};
		this.getMessageListbySendId = function(dialog_id, sender) {
			var deferred = $q.defer();
			var params = {chat_dialog_id: dialog_id, sender_id: sender.id, sort_desc: 'date_sent', limit: 100, skip: 0};
			this.qb.chat.message.list(params, function(err, messages) {
				if (messages) {
					messages.sender = sender;
					deferred.resolve(messages);
				} else {
					deferred.reject(err);
				}
			});
			return deferred.promise;
		};
		this.sendAttachment = function(dialog, attach) {
			var params = {name: attach.name, file: attach, type: attach.type, size: attach.size, 'public': false};
			var attachtype = 'photo';
			if (attach.type == 'video/mp4') {
				attachtype = 'video'
			}

			self.qb.content.createAndUpload(params, function(err, response) {
				if (err) {
					console.log(err);
				} else {
					var uploadedFileId = response.id;
					var msg = {
						type: 'chat',
						body: "attachment",
						extension: {
							save_to_history: 1,
						}
					};
					msg["extension"]["attachments"] = [{id: uploadedFileId, type: attachtype}];
					self._send(dialog, msg);
				}
			});
		};
		this.sendMessage = function(dialog, message) {
			var msg = {
				type: 'chat',
				body: message,
				extension: {
					save_to_history: 1,
				}
			};
			self._send(dialog, msg);
		};
		this._send = function(dialog, msg) {
			var opponentId = self.qb.chat.helpers.getRecipientId(dialog.occupants_ids, this.session.user_id);
			console.log(opponentId);
			var msgId = self.qb.chat.send(opponentId, msg);
			console.log(msgId);
			// self.qb.chat.onDeliveredStatusListener = function(messageId, dialogId, userId) {
			// 	console.log('Delivered1');
			// 	console.log(messageId);
			// 	console.log(dialogId);
			// 	console.log(userId);
			// };
		};
		this.changeUserLogin = function(userid, userlogin) {
			var deferred = $q.defer();
			self.qb.users.update(userid, {login: userlogin}, function(err, user) {
				user ? deferred.resolve(user) : deferred.reject(err);
			});
			return deferred.promise;
		};
		this.init();
	}
