(function() {
    angular
        .module('themoviesStop')
        .controller('companyListCtrl', companyListCtrl);
    companyListCtrl.$inject = ['$scope', '$location', '$localStorage'];

    function companyListCtrl($scope, $location, $localStorage) {
        var vm = this;
        if ($localStorage.companies) {
            $scope.companies = $localStorage.companies;
            $scope.backdrop_path = $localStorage.backdrop_path;
            $scope.poster_path = $localStorage.poster_path;
            $scope.name = $localStorage.name;
            $scope.year = $localStorage.year;
        }
        var url = $location.url();
        if (url.indexOf('movies') != -1) {
            $scope.companies = $localStorage.companies;
        } else {
            $scope.companies = $localStorage.networks;
        }
        $scope.getHeader = function() {
            if (url.indexOf('movies') != -1) {
                return "All Companies";
            } else {
                return "All Networks";
            }
        }
    }


})();