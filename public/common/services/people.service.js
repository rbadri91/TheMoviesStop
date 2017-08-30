(function() {
    angular
        .module('themoviesStop')
        .service('people', people);

    people.$inject = ['$http'];

    function people($http) {
        var people = [];

        var setKnownFors = function(results) {
            for (var i = 0; i < results.length; i++) {
                var knownFor = "";
                for (var j = 0; j < results[i].known_for.length; j++) {
                    knownFor += (results[i].known_for[j].original_title) ? results[i].known_for[j].original_title : results[i].known_for[j].original_name;
                    if (j != results[i].known_for.length - 1) {
                        knownFor += ", ";
                    }
                }
                results[i]["knownFor"] = knownFor;
            }
            return results;
        }
        var getPopular = function() {
            return $http.get('/people/popular').then(function(data) {
                var results = setKnownFors(JSON.parse(data.data).results);
                console.log("new Results:", results);
                angular.copy(results, people);
                return people;
            });
        }

        return {
            getPopular: getPopular
        };
    }
})();