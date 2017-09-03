(function() {
    angular
        .module('themoviesStop')
        .controller('genreCtrl', genreCtrl);

    genreCtrl.$inject = ['$scope', 'genreShows', '$location', '$localStorage'];

    function genreCtrl($scope, genreShows, $location, $localStorage) {
        var vm = this;
        $scope.headerReady = false;
        $scope.shows = genreShows;

        $scope.getTitle = function(show) {
            var title = "";
            title = (show.original_title) ? show.original_title : show.original_name;
            return title;
        }
        $scope.getReleaseDateOrYear = function(show, type) {
            var date = "";
            if (show.release_date) {
                var d;
                d = new Date(show.release_date);

                locale = "en-us";
                var dt = d.getDate();
                var month = d.toLocaleString(locale, { month: "long" });
                var year = d.getFullYear();
                date = dt + " " + month + " " + year;
            } else {
                date = ((show.first_air_date) ? show.first_air_date.substring(0, show.first_air_date.indexOf("-")) : "");
            }
            return date;
        };
        $scope.getMediaLink = function(id) {
            var url = $location.url();
            if (url.indexOf('movies') != -1) {
                return "#/movies/" + id;
            } else {
                return "#/tv/" + id;
            }
        }
        $scope.getTitleHeader = function() {
            var genreArray = [];
            var genreId = $localStorage.genreId;
            genreArray = $localStorage.genreMapping;
            console.log("in get title header");
            return getGenreName(genreArray, genreId);
        }
    }

    function getGenreName(genreArray, genreId) {
        for (var i = 0; i < genreArray.length; i++) {
            if (genreArray[i].id == genreId) {
                console.log("name here:", genreArray[i].name);
                return genreArray[i].name;
                break;
            }
        }
    }

})();