(function() {

    angular
        .module('themoviesStop')
        .service('authentication', authentication);

    authentication.$inject = ['$http', '$window', '$location'];

    function authentication($http, $window, $location) {

        var saveToken = function(token) {
            $window.localStorage['moviestop-token'] = token;
        };

        var getToken = function() {
            return $window.localStorage['moviestop-token'];
        };

        var isLoggedIn = function() {
            var token = getToken();
            var payload;
            if (token) {
                payload = token.split('.')[1];
                payload = $window.atob(payload);
                payload = JSON.parse(payload);

                return payload.exp > Date.now() / 1000;
            } else {
                return false;
            }
        };

        var currentUser = function() {
            if (isLoggedIn()) {
                var token = getToken();
                var payload = token.split('.')[1];
                payload = $window.atob(payload);
                payload = JSON.parse(payload);
                return payload.username;
            }
        };

        var currUserId = function() {
            if (isLoggedIn()) {
                var token = getToken();
                var payload = token.split('.')[1];
                payload = $window.atob(payload);
                payload = JSON.parse(payload);
                return payload._id;
            }
        }

        register = function(user) {
            return $http.post('/register', user).then(function(data) {
                saveToken(data.data.token);
            });
        };

        login = function(user) {
            return $http.post('/login', user).then(function(data) {
                saveToken(data.data.token);
            });
        };

        logout = function() {
            $window.localStorage.removeItem('moviestop-token');
            $location.path("/");
        };

        return {
            currentUser: currentUser,
            saveToken: saveToken,
            getToken: getToken,
            isLoggedIn: isLoggedIn,
            register: register,
            login: login,
            logout: logout,
            currUserId: currUserId
        };
    }


})();