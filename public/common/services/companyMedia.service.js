(function() {
    angular
        .module('themoviesStop')
        .service('companyMedia', companyMedia);

    companyMedia.$inject = ['$http', '$localStorage'];

    function companyMedia($http, $localStorage) {
        var getAllCompanyMovies = function(id) {
            $localStorage.genreId = id;
            return $http.get('/movies/company/' + id).then(function(data) {
                return JSON.parse(data.data).results;

            });
        };
        var getAllNetworkShows = function(id) {
            $localStorage.genreId = id;
            return $http.get('/tv/network/' + id).then(function(data) {
                return JSON.parse(data.data).results;
            });
        };
        return {
            getAllCompanyMovies: getAllCompanyMovies,
            getAllNetworkShows: getAllNetworkShows
        };
    }

})();