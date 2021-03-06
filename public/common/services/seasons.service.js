(function() {
    angular
        .module('themoviesStop')
        .service('seasons', seasons);

    seasons.$inject = ['$http'];

    function seasons($http) {
        var getAllSeasonDetails = function(id) {
            return $http.get('/tv/' + id + "/allseason").then(function(data) {
                return data.data;
            });
        }
        return {
            getAllSeasonDetails: getAllSeasonDetails
        }
    }
})();