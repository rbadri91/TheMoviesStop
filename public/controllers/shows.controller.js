(function() {

    angular
        .module('themoviesStop')
        .controller('showsCtrl', showsCtrl);

    showsCtrl.$inject = ['$scope', 'shows', 'authentication'];

    function showsCtrl($scope, shows, authentication) {
        var vm = this;
        $scope.shows = shows;
    }

})();