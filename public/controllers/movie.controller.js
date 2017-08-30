(function() {

    angular
        .module('themoviesStop')
        .controller('moviesCtrl', movieCtrl);

    movieCtrl.$inject = ['$scope', 'movies', 'authentication'];

    function movieCtrl($scope, movies, authentication) {
        var vm = this;
        $scope.movies = movies;
    }

})();