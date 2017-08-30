(function() {
    angular
        .module('themoviesStop')
        .service('people', people);

    people.$inject = ['$http'];

    function shows($http) {
        var people = [];
        var getPopular = function() {
            return $http.get('/people/popular').then(function(data) {
                angular.copy(JSON.parse(data.data).results, people);
                return people;
            });
        }

        return {
            getPopular: getPopular
        };
    }
});