(function() {

    angular
        .module('themoviesStop')
        .controller('registerCtrl', registerCtrl);

    registerCtrl.$inject = ['$scope', '$state', 'authentication'];

    function registerCtrl($scope, $state, authentication) {
        var vm = this;

        $scope.credentials = {
            userName: "",
            email: "",
            password: ""
        };

        $scope.onSubmit = function() {
            authentication
                .register($scope.credentials)
                .catch(function(err) {
                    $scope.error = error;
                })
                .then(function() {
                    $state.go('home');
                });
        };

    }

})();