(function() {

    angular
        .module('themoviesStop')
        .controller('moviesCtrl', movieCtrl);

    movieCtrl.$inject = ['$scope', 'movies', 'authentication', '$location', '$localStorage'];

    function movieCtrl($scope, movies, authentication, $location, $localStorage) {
        var vm = this;
        $scope.movies = movies;
        console.log("movies here:", movies);
        if (movies.credits) {
            $localStorage.cast = movies.credits.cast;
            $localStorage.crew = movies.credits.crew;
            $localStorage.backdrop_path = movies.backdrop_path;
            $localStorage.poster_path = movies.poster_path;
            $localStorage.name = movies.title;

            console.log("backdrop_path here:", $localStorage.backdrop_path);
        }

        $scope.getIframeSrc = function(videoId) {
            return 'https://www.youtube.com/embed/' + videoId;
        };
        $scope.getReleaseYear = function(date) {
            var year = date.substring(0, date.indexOf("-"))
            $localStorage.year = year;
            return year;
        };
        $scope.getTime = function(time) {
            var hours = Math.floor(time / 60);
            var mins = time % 60;
            return hours + " h " + mins + " m";
        };
        $scope.getReleaseDate = function(date) {

            var d = new Date(date);
            locale = "en-us";
            var dt = d.getDate();
            var month = d.toLocaleString(locale, { month: "long" });
            var year = d.getFullYear();
            return dt + " " + month + " " + year;
        };
        $scope.getCertificate = function(countries) {
            var cetificate = "";
            for (var i = 0; i < countries.length; i++) {
                if (countries[i]["iso_3166_1"] === "US") {
                    cetificate = countries[i].certification;
                }
            }
            if (cetificate === "" && countries.length > 0) cetificate = countries[0].certification;
            return (cetificate === "") ? "N/A" : cetificate;
        };
        $scope.isLoggedIn = function() {
            return authentication.isLoggedIn();
        };
        $scope.handleOptionsClick = function($event) {
            var className;
            console.log("$event.target here:", $event.target);
            var el = $event.target;
            $(".menuNavSection span").removeClass("active");
            console.log("el here:", el);
            $(el).addClass("active");
            if (el.textContent == "Cast") {
                className = ".CastLists";
            } else if (el.textContent == "Reviews") {
                className = ".ReviewsSection";
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
        $scope.numberWithCommas = function(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };
        $scope.getNewLocation = function() {
            return "#" + $location.url() + '/fullCast';
        };

    }

})();