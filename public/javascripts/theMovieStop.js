var app = angular.module('themoviesStop', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'templates/home/home.view.ejs',
                controller: 'homeCtrl'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login/login.view.ejs',
                controller: 'loginCtrl',
                onEnter: ['$state', 'authentication', function($state, authentication) {
                    if (authentication.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: 'templates/register/register.view.ejs',
                controller: 'registerCtrl',
                onEnter: ['$state', 'authentication', function($state, authentication) {
                    if (authentication.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            });

        $urlRouterProvider.otherwise('home');
    }
]);

app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.hashPrefix('');
}]);