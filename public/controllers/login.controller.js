(function() {

    angular
        .module('themoviesStop')
        .controller('loginCtrl', loginCtrl);

    loginCtrl.$inject = ['$scope', '$state', 'authentication'];

    function loginCtrl($scope, $state, authentication) {
        var vm = this;

        vm.credentials = {
            email: "",
            password: ""
        };

        vm.onSubmit = function() {
            authentication
                .logIn(vm.credentials)
                .error(function(err) {
                    $scope.error = error;
                })
                .then(function() {
                    $state.go('home');
                });
        };

    }

})();