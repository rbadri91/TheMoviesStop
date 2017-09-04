(function() {
    angular
        .module('themoviesStop')
        .service('movies', movies);

    movies.$inject = ['$http', '$localStorage', 'authentication'];

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

    function movies($http, $localStorage, authentication) {
        var movies = [];
        var isInWatchList = false;
        var isInFavoritesList = false;
        var getPopular = function() {
            return $http.get('/movies/popular').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
            });
        };
        var getTopRated = function() {
            return $http.get('/movies/top').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
            });
        };
        var getUpcoming = function() {
            return $http.get('/movies/upcoming').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
            });
        };
        var getShowingNow = function() {
            return $http.get('/movies/showingnow').then(function(data) {
                angular.copy(JSON.parse(data.data).results, movies);
            });
        };
        var getMovieDetails = function(id, userId) {
            return $http.get('/movies/' + id).then(function(data) {
                angular.copy(JSON.parse(data.data), movies);
                console.log("authentication.isLoggedIn():", authentication.isLoggedIn());
                if (authentication.isLoggedIn()) {
                    var userId = authentication.currUserId();
                    var movieId = JSON.parse(data.data).id;
                    console.log("movieId:", movieId);
                    $http.get('/user/' + userId + '/moviesLikedAndtoWatch/' + movieId).then((data) => {
                        console.log("data here:", JSON.parse(data.data.isInWatchList));
                        this.isInFavoritesList = JSON.parse(data.data.isInFavoritesList);
                        this.isInWatchList = JSON.parse(data.data.isInWatchList);
                        // angular.copy(JSON.parse(data.data.isInFavoritesList), isInFavoritesList);
                        // angular.copy(JSON.parse(data.data.isInWatchList), isInWatchList);
                    });
                }

            });
        };
        var getMovies = function() {
            return movies;
        };
        var getisInFavoritesList = function() {
            return isInFavoritesList;
        };
        var getisInWatchList = function() {
            return isInWatchList;
        };
        var getMoviesOpeningThisWeek = function() {
            if (!$localStorage.OpeningThisWeek) {
                return $http.get('/movies/openingThisWeek').then(function(data) {
                    $localStorage.OpeningThisWeek = JSON.parse(data.data);
                    angular.copy(JSON.parse(data.data), movies);
                });
            } else {
                return $localStorage.OpeningThisWeek;
            }
        };
        var handleAddToFavorites = function(movieId) {

            return $http.post('/user/movies/addToFavorites/', { movieId: movieId }, {
                headers: { Authorization: 'Bearer ' + authentication.getToken() }
            });
        };
        var handleAddToWatchList = function(movieId) {
            return $http.post('/user/movies/addToWatchList', { movieId: movieId }, {
                headers: { Authorization: 'Bearer ' + authentication.getToken() }
            });
        };
        return {
            movies: movies,
            isInFavoritesList: isInFavoritesList,
            isInWatchList: isInWatchList,
            getisInWatchList: getisInWatchList,
            getisInFavoritesList: getisInFavoritesList,
            getPopular: getPopular,
            getTopRated: getTopRated,
            getUpcoming: getUpcoming,
            getShowingNow: getShowingNow,
            getMovieDetails: getMovieDetails,
            getMovies: getMovies,
            getMoviesOpeningThisWeek: getMoviesOpeningThisWeek,
            handleAddToFavorites: handleAddToFavorites,
            handleAddToWatchList: handleAddToWatchList
        };
    }
})();