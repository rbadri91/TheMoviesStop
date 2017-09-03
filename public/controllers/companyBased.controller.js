(function() {
    angular
        .module('themoviesStop')
        .controller('companyAndNetworkCtrl', companyAndNetworkCtrl);
    companyAndNetworkCtrl.$inject = ['$scope', 'companyMedia', '$location', '$localStorage'];

    function companyAndNetworkCtrl($scope, companyMedia, $location, $localStorage) {
        var vm = this;
        $scope.shows = companyMedia;
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
            var url = $location.url();
            if (url.indexOf('movies') != -1) {
                return $localStorage.companyName;
            } else {
                return $localStorage.networkName;
            }
        }
    }


})();