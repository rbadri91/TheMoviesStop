(function() {

    angular
        .module('themoviesStop')
        .controller('homeCtrl', homeCtrl);

    homeCtrl.$inject = ['$scope', 'allMedia', '$localStorage'];

    function homeCtrl($scope, allMedia, $localStorage) {
        $scope.upcoming = allMedia.upcoming.results;
        $scope.nowShowing = allMedia.nowShowing.results;
        $scope.OpeningThisWeek = allMedia.OpeningThisWeek.results;
        $localStorage.OpeningThisWeek = $scope.OpeningThisWeek;
    }
})();