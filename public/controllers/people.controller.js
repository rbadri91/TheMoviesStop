(function() {

    angular
        .module('themoviesStop')
        .controller('peopleCtrl', peopleCtrl);

    peopleCtrl.$inject = ['$scope', 'people', 'authentication'];

    function peopleCtrl($scope, people, authentication) {
        var vm = this;
        $scope.people = people;
        $scope.showMovies = true;
        $scope.value = "Movies";
        $scope.getGender = function(gender) {
            if (gender == 1) {
                return "Female";
            } else if (gender == 2) {
                return "Male";
            } else {
                return "Not specified";
            }
        }
        $scope.getTitle = function(show, type) {
            var title = "";
            if (!type) {
                title = (show.original_title) ? show.original_title : show.original_name;
            } else {
                title = (show.media.original_title) ? show.media.original_title : show.media.original_name;
            }

            return title;
        }
        $scope.getShowLink = function(show, type) {
            var link = "";
            if (!type) {
                link = ((show.media_type == "movie") ? "/#/movies/desc/" : "/#/tv/desc/") + show.id;
            } else {
                link = ((show.media_type == "movie") ? "/#/movies/desc/" : "/#/tv/desc/") + show.media.id;
            }

            return link;
        }
        $scope.getReleaseYear = function(show) {
            if (show.media_type == "movie") {
                return ((show.release_date) ? show.release_date.substring(0, show.release_date.indexOf("-")) : "");
            } else {
                return ((show.first_air_date) ? show.first_air_date.substring(0, show.first_air_date.indexOf("-")) : "");
            }
        };
        $scope.getReleaseDateOrYear = function(show, type) {
            var date = "";
            if (show.media_type == "movie") {
                var d;
                if (!type) {
                    d = new Date(show.release_date);
                } else {
                    d = new Date(show.media.release_date);
                }

                locale = "en-us";
                var dt = d.getDate();
                var month = d.toLocaleString(locale, { month: "long" });
                var year = d.getFullYear();
                date = dt + " " + month + " " + year;
            } else {
                if (!type) {
                    date = ((show.first_air_date) ? show.first_air_date.substring(0, show.first_air_date.indexOf("-")) : "");
                } else {
                    date = ((show.media.first_air_date) ? show.media.first_air_date.substring(0, show.media.first_air_date.indexOf("-")) : "");
                }
            }
        }
        $scope.handleOptionsClick = function($event) {
            var className;
            console.log("$event.target here:", $event.target);
            var el = $event.target;
            $(".menuNavSection span").removeClass("active");
            console.log("el here:", el);
            $(el).addClass("active");
            if (el.textContent == "Personal Info") {
                className = ".DetailsSection";
            } else if (el.textContent == "Profile Images") {
                className = ".ProfileSection";
            } else if (el.textContent == "Known For") {
                className = ".RecommendedSection";
            } else if (el.textContent == "Tagged Images") {
                className = ".TaggedImagesSection";
            } else if (el.textContent == "FilmoGraphy") {
                className = ".FilmographySection";
            }
            $('html,body').animate({
                    scrollTop: $(className).offset().top
                },
                'slow');
        };
        $scope.newValue = function(val) {
            console.log("in handleMediaTypeChange");
            $scope.value = val;
            $scope.showMovies = (val == "Movies") ? true : false;
        };

    }

})();