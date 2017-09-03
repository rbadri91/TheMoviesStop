(function() {

    angular
        .module('themoviesStop')
        .controller('seasonsCtrl', seasonsCtrl);

    seasonsCtrl.$inject = ['$scope', 'seasons', '$localStorage'];

    function seasonsCtrl($scope, seasons, $localStorage) {
        var vm = this;
        $scope.seasons = seasons;
        if ($localStorage.backdrop_path) {
            $scope.backdrop_path = $localStorage.backdrop_path;
            $scope.poster_path = $localStorage.poster_path;
            $scope.name = $localStorage.name;
            $scope.year = $localStorage.year;
        }

        $scope.getOverview = function(overview) {
            if (overview == '') {
                return "This season does not have any Summary";
            } else {
                return overview;
            }
        }
    }
})();