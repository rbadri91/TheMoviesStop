(function() {

    angular
        .module('themoviesStop')
        .controller('peopleCtrl', peopleCtrl);

    peopleCtrl.$inject = ['$scope', 'people', 'authentication'];

    function peopleCtrl($scope, people, authentication) {
        var vm = this;
        $scope.shows = movies;
    }

})();