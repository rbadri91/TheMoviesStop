(function() {

    angular
        .module('themoviesStop')
        .controller('moviesCtrl', movieCtrl);

    movieCtrl.$inject = ['$scope', 'movies', 'authentication', '$location', '$localStorage'];

    function movieCtrl($scope, movies, authentication, $location, $localStorage) {
        var vm = this;
        var movieArr = movies.movies;
        $scope.movies = movieArr;
        if (movieArr.credits) {
            $localStorage.cast = movieArr.credits.cast;
            $localStorage.crew = movieArr.credits.crew;
            $localStorage.backdrop_path = movieArr.backdrop_path;
            $localStorage.poster_path = movieArr.poster_path;
            $localStorage.name = movieArr.title;
            $localStorage.reviews = movieArr.reviews.results;
            $localStorage.companies = movieArr.production_companies;
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
            var el = $event.target;
            $(".menuNavSection span").removeClass("active");
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
        $scope.getFullCastLocation = function() {
            return "#" + $location.url() + '/fullCast';
        };
        $scope.getAllReviewLocation = function() {
            return "#" + $location.url() + '/reviews';
        };
        $scope.handleCompanyClick = function($event) {
            var companyName = $event.target.textContent;
            $localStorage.companyName = companyName;
        };

        if (movies.isInWatchList) {
            $scope.isInWatchList = "#1fd41f";
        } else {
            $scope.isInWatchList = "#fff";
        }

        if (movies.isInFavoritesList) {
            $scope.FavoritesColor = "#1fd41f";
        } else {
            $scope.FavoritesColor = "#fff";
        }

        $scope.handleWatchListClick = function($event) {
            var ele = $event.target;
            if ($scope.WatchListColor === "#fff") {
                $scope.WatchListColor = "#1fd41f";
            } else {
                $scope.WatchListColor = "#fff";
            }
            movies.handleAddToWatchList($scope.movies.id);
        };
        $scope.handleFavoritesClick = function($event) {
            var ele = $event.target;
            if ($scope.FavoritesColor === "#fff") {
                $scope.FavoritesColor = "#1fd41f";
            } else {
                $scope.FavoritesColor = "#fff";
            }
            movies.handleAddToFavorites($scope.movies.id);
        };

    }

})();