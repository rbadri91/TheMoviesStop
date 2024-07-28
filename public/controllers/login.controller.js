(function() {

    angular
        .module('themoviesStop')
        .controller('loginCtrl', loginCtrl);

    loginCtrl.$inject = ['$scope', '$state', 'authentication'];

    function loginCtrl($scope, $state, authentication) {
        var vm = this;

        $scope.credentials = {
            username: "",
            password: ""
        };

        $scope.onSubmit = function() {
            authentication
                .login($scope.credentials)
                .catch(function(err) {
                    $scope.error = err;
                })
                .then(function() {
                    $state.go('home');
                });
        };

    }

})();