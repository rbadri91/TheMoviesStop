(function() {
    angular
        .module('themoviesStop')
        .controller('fullCastCtrl', fullCastCtrl);

    fullCastCtrl.$inject = ['$scope', 'movies', 'shows', 'casts', '$location', '$localStorage'];

    function fullCastCtrl($scope, movies, shows, cast, $location, $localStorage) {
        var vm = this;
        var url = $location.url();
        if ($localStorage.cast) {
            $scope.cast = $localStorage.cast;
            $scope.crew = $localStorage.crew;
            $scope.backdrop_path = $localStorage.backdrop_path;
            $scope.poster_path = $localStorage.poster_path;
            $scope.name = $localStorage.name;
            $scope.year = $localStorage.year;
        }
        $scope.crewMap = chunk($scope.crew);
        $scope.getCastCount = function() {
            return $scope.cast.length;
        }
        $scope.getCrewCount = function() {
            return $scope.crew.length;
        }
    }

    function chunk(crewData) {
        var crewObjects = {};
        var newJobMapping = [];

        for (var j = 0; j < crewData.length; j++) {
            var dept = "";
            if (!crewObjects[crewData[j].department]) {
                crewObjects[crewData[j].department] = [];
            }
            crewObjects[crewData[j].department].push(crewData[j]);
        }
        return crewObjects;
    }

})();