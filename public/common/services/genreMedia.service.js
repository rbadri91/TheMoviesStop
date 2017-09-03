(function() {
    angular
        .module('themoviesStop')
        .service('genreShows', genreShows);

    genreShows.$inject = ['$http', '$localStorage'];

    function genreShows($http, $localStorage) {
        var getAllGenreMovies = function(id) {
            $localStorage.genreId = id;
            return $http.get('/movies/genre/' + id).then(function(data) {
                if (!$localStorage.genreMapping) {
                    fetch('/json/genres.json').then((response) => {
                        return response.json();
                    }).then((res) => {
                        genreArray = res;
                        $localStorage.genreMapping = genreArray;
                        return JSON.parse(data.data).results;
                    });
                } else {
                    return JSON.parse(data.data).results;
                }

            });
        };
        var getAllGenreShows = function(id) {
            $localStorage.genreId = id;
            return $http.get('/tv/genre/' + id).then(function(data) {
                if (!$localStorage.genreMapping) {
                    fetch('/json/genres.json').then((response) => {
                        return response.json();
                    }).then((res) => {
                        genreArray = res;
                        $localStorage.genreMapping = genreArray;
                        console.log("data here:", JSON.parse(data.data).results);
                        return JSON.parse(data.data).results;
                    });
                } else {
                    return JSON.parse(data.data).results;
                }
            });
        }
        return {
            getAllGenreMovies: getAllGenreMovies,
            getAllGenreShows: getAllGenreShows
        }
    }

})();