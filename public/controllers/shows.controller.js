(function() {

    angular
        .module('themoviesStop')
        .controller('showsCtrl', showsCtrl);

    showsCtrl.$inject = ['$scope', 'shows', 'authentication', '$location', '$localStorage'];

    function showsCtrl($scope, shows, authentication, $location, $localStorage) {
        var vm = this;
        $scope.shows = shows;

        $scope.getIframeSrc = function(videoId) {
            return 'https://www.youtube.com/embed/' + videoId;
        };
        $scope.getReleaseYear = function(date) {
            return ((date) ? date.substring(0, date.indexOf("-")) : "");
        };
        $scope.getTime = function(time) {
            var hours = Math.floor(time / 60);
            var mins = time % 60;
            return ((hours > 0) ? (hours + " h ") : "") + ((mins > 0) ? (mins + " m") : "");
        };

        $scope.isLoggedIn = function() {
            return authentication.isLoggedIn();
        };
        $scope.getCertificate = function(list) {
            var rating = "";
            for (var i = 0; i < list.length; i++) {
                if (list[i]["iso_3166_1"] === "US") {
                    rating = "US " + list[i].rating;
                    break;
                }
            }
            if (rating === "" && list.length > 0) rating = list[0]["iso_3166_1"] + " " + list[0].rating;
            return (rating === "") ? "N/A" : rating;
        };
        if (shows.credits) {
            $localStorage.cast = shows.credits.cast;
            $localStorage.crew = shows.credits.crew;
            $localStorage.backdrop_path = shows.backdrop_path;
            $localStorage.poster_path = shows.poster_path;
            $localStorage.name = shows.original_name;
            $localStorage.year = $scope.getReleaseYear(shows.first_air_date);
            $localStorage.networks = shows.networks;
        }

        $scope.handleOptionsClick = function($event) {
            var className;
            var el = $event.target;
            $(".menuNavSection span").removeClass("active");
            $(el).addClass("active");
            if (el.textContent == "Cast") {
                className = ".CastLists";
            } else if (el.textContent == "Season Reviews") {
                className = ".SeasonReviewsSection";
            } else if (el.textContent == "Videos") {
                className = ".VideosSection";
            } else if (el.textContent == "Recommended") {
                className = ".RecommendedSection";
            } else if (el.textContent == "Details") {
                className = ".DetailsSection";
            } else if (el.textContent == "Box Office") {
                className = ".BoxOfficeSection";
            } else if (el.textContent == "Prodution Credits") {
                className = ".ProdCreditsSection";
            }
            $('html,body').animate({
                    scrollTop: $(className).offset().top
                },
                'slow');
        };
        $scope.getFullCastLocation = function() {
            return "#" + $location.url() + '/fullCast';
        };
        $scope.getAllSeasonLocation = function() {
            return "#" + $location.url() + '/allseason';
        };
        $scope.handleNetworkClick = function($event) {
            var networkName = $event.target.textContent;
            $localStorage.networkName = networkName;
        };
    }

})();