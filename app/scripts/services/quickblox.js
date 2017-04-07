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
