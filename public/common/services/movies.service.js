(function() {
    angular
        .module('themoviesStop')
        .service('movies', movies);

    movies.$inject = ['$http', '$localStorage'];

    function chunk(arr, size) {
        var newArr = [];
        for (var i = 0; i < arr.length; i += size) {
            newArr.push(arr.slice(i, i + size));
        }
        return newArr;
    }

    function getTitle() {
        console.log("");
    }

    function movies($http, $localStorage) {
        var movies = [];
        var getPopular = function() {
            return $http.get('/movies/popular').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
                return chunk(movies, 2);
            });
        }
        var getTopRated = function() {
            return $http.get('/movies/top').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
                return movies;
            });
        }
        var getUpcoming = function() {
            return $http.get('/movies/upcoming').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
                return movies;
            });
        }
        var getShowingNow = function() {
            return $http.get('/movies/showingnow').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
                return movies;
            });
        }
        var getMovieDetails = function(id) {
            return $http.get('/movies/' + id).then(function(data) {
                return JSON.parse(data.data);
            });
        }
        var getMovies = function() {
            return movies;
        }
        var getMoviesOpeningThisWeek = function() {
            if (!$localStorage.OpeningThisWeek) {
                return $http.get('/movies/openingThisWeek').then(function(data) {
                    $localStorage.OpeningThisWeek = JSON.parse(data.data);
                    return JSON.parse(data.data);
                });
            } else {
                return $localStorage.OpeningThisWeek;
            }
        }
        return {
            getPopular: getPopular,
            getTopRated: getTopRated,
            getUpcoming: getUpcoming,
            getShowingNow: getShowingNow,
            getMovieDetails: getMovieDetails,
            getMovies: getMovies,
            getMoviesOpeningThisWeek: getMoviesOpeningThisWeek
        };
    }
})();