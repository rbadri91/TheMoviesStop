(function() {
    angular
        .module('themoviesStop')
        .service('allMedia', allMedia);

    allMedia.$inject = ['$http'];

    function allMedia($http) {
        var getAllMediaDetails = function(id) {
            return $http.get('/allFeeds').then(function(result) {
                return result.data;
            });
        };
        return {
            getAllMediaDetails: getAllMediaDetails
        };
    }

})();