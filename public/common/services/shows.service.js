(function() {
    angular
        .module('themoviesStop')
        .service('shows', shows);

    shows.$inject = ['$http'];

    function shows($http) {
        var shows = [];
        var getPopular = function() {
            return $http.get('/tv/popular').then(function(data) {
                angular.copy(JSON.parse(data.data).results, shows);
                return shows;
            });
        }
        var getTopRated = function() {
            return $http.get('/tv/top').then(function(data) {
                angular.copy(JSON.parse(data.data).results, shows);
                return shows;
            });
        }
        var getOnTV = function() {
            return $http.get('/tv/onTV').then(function(data) {
                angular.copy(JSON.parse(data.data).results, shows);
                return shows;
            });
        }
        var getAiringToday = function() {
            return $http.get('/tv/airingToday').then(function(data) {
                angular.copy(JSON.parse(data.data).results, shows);
                return shows;
            });
        }
        return {
            getPopular: getPopular,
            getTopRated: getTopRated,
            getOnTV: getOnTV,
            getAiringToday: getAiringToday
        };
    }
})();