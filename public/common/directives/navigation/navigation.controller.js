(function() {

    angular
        .module('themoviesStop')
        .controller('NavCtrl', NavCtrl);

    NavCtrl.$inject = ['$scope', '$location', 'authentication', '$window'];

    function NavCtrl($scope, $location, authentication, $window) {
        var vm = this;

        vm.isLoggedIn = authentication.isLoggedIn();

        vm.currentUser = authentication.currentUser();
        $scope.logOut = function() {
            authentication.logout();
            $scope.token = authentication.getToken();
            $location.path("/");
        }
        $scope.isCollapsed = true;
        $scope.token = authentication.getToken();
        $scope.doCollapse = function() {
            $scope.isCollapsed = true;
        }
    }

})();