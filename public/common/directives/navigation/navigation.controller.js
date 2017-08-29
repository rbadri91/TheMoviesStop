(function() {

    angular
        .module('themoviesStop')
        .controller('NavCtrl', NavCtrl);

    NavCtrl.$inject = ['$location', 'authentication'];

    function NavCtrl($location, authentication) {
        var vm = this;

        vm.isLoggedIn = authentication.isLoggedIn();

        vm.currentUser = authentication.currentUser();

    }

})();