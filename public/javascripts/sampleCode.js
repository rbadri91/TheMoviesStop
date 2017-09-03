var app = angular.module('themoviesStop', ['ui.router']);

app.factory('auth', ['$http', '$window', function($http, $window) {
    var auth = {};

    auth.saveToken = function(token) {
        $window.localStorage['moviestop-token'] = token;
    };

    auth.getToken = function() {
        return $window.localStorage['moviestop-token'];
    }

    auth.isLoggedIn = function() {
        var token = auth.getToken();
        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.register = function(user) {
        return $http.post('/register', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function(user) {
        return $http.post('/login', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function() {
        $window.localStorage.removeItem('moviestop-token');
    };

    auth.currentUser = function() {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };

    return auth;
}]);

app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'authentication',
    function($scope, $state, authentication) {
        $scope.user = {};

        $scope.register = function() {
            authentication.register($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                $state.go('home');
            });
        };

        $scope.logIn = function() {
            authentication.logIn($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                $state.go('home');
            });
        };

    }
]);

app.controller('NavCtrl', [
    '$scope',
    'authentication',
    function($scope, authentication) {
        $scope.isLoggedIn = authentication.isLoggedIn;
        $scope.currentUser = authentication.currentUser;
        $scope.logOut = authentication.logOut;
    }
]);

app.controller('MainCtrl', [
    '$scope',
    'authentication',
    function($scope, authentication) {
        $scope.isLoggedIn = authentication.isLoggedIn;
    }
]);

// var compareTo = function() {
//     return {
//         require: "ngModel",
//         scope: {
//             otherModelValue: "=compareTo"
//         },
//         link: function(scope, element, attributes, ngModel) {

//             ngModel.$validators.compareTo = function(modelValue) {
//                 return modelValue == scope.otherModelValue;
//             };

//             scope.$watch("otherModelValue", function() {
//                 ngModel.$validate();
//             });
//         }
//     };
// };

// app.directive("compareTo", compareTo);

angular
    .module('themoviesStop')
    .config([
        '$stateProvider',
        '$urlRouterProvider',
        'authentication',
        function($stateProvider, $urlRouterProvider, authentication) {

            $stateProvider
                .state('home', {
                    url: '/home',
                    templateUrl: 'templates/home/home.view.ejs',
                    controller: 'MainCtrl'
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