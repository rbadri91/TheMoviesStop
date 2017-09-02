(function() {
    angular
        .module('themoviesStop')
        .controller('reviewsCtrl', reviewsCtrl);
    reviewsCtrl.$inject = ['$scope', '$localStorage'];

    function reviewsCtrl($scope, $localStorage) {
        var vm = this;
        if ($localStorage.reviews) {
            $scope.reviews = $localStorage.reviews;
            $scope.backdrop_path = $localStorage.backdrop_path;
            $scope.poster_path = $localStorage.poster_path;
            $scope.name = $localStorage.name;
            $scope.year = $localStorage.year;
        }
    }


})();