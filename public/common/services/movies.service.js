(function() {
    angular
        .module('themoviesStop')
        .service('movies', movies);

    movies.$inject = ['$http'];

    function chunk(arr, size) {
        var newArr = [];
        for (var i = 0; i < arr.length; i += size) {
            newArr.push(arr.slice(i, i + size));
        }
        console.log("new Arr here:", newArr);
        return newArr;
    }

    function getTitle() {
        console.log("");
    }

    function movies($http) {
        var movies = [];
        var getPopular = function() {
            return $http.get('/movies/popular').then(function(data) {
                console.log("data here:", JSON.parse(data.data).results);
                angular.copy(JSON.parse(data.data).results, movies);
                return chunk(movies, 2);
            });
        }
        var getTopRated = function() {
            return $http.get('/movies/top').then(function(data) {
                console.log("data here:", data);
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
        return {
            getPopular: getPopular,
            getTopRated: getTopRated,
            getUpcoming: getUpcoming,
            getShowingNow: getShowingNow
        };
    }
})();