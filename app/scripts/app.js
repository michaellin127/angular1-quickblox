'use strict';

/**
 * @ngdoc overview
 * @name chitchat
 * @description
 * # chitchat
 *
 * Main module of the application.
 */

agGrid.initialiseAgGridWithAngular1(angular);

angular
  .module('chitchat', [
    'ui.router',
    'ngAnimate',
    'agGrid',
    'ui.bootstrap',
    // 'ng-topchat',
    'angular-simple-chat',
    'darthwade.dwLoading',
    'ngStorage'
    // 'ui.grid'
  ])
  .config(function($stateProvider, $urlRouterProvider) {

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

  })
  .run(function($rootScope, $loading, $localStorage, $location) {
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
  });
