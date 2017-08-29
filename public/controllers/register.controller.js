(function() {

    angular
        .module('themoviesStop')
        .controller('registerCtrl', registerCtrl);

    registerCtrl.$inject = ['$scope', '$state', 'authentication'];

    function registerCtrl($scope, $state, authentication) {
        var vm = this;

        vm.credentials = {
            email: "",
            password: ""
        };

        vm.onSubmit = function() {
            authentication
                .register(vm.credentials)
                .error(function(err) {
                    $scope.error = error;
                })
                .then(function() {
                    $state.go('home');
                });
        };

    }

})();