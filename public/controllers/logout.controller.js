(function() {

    angular
        .module('themoviesStop')
        .controller('PopoverDemoCtrl', function($scope) {
            $scope.myData = {
                firstname: 'John',
                lastname: 'Doe',
                employer: 'Stackoverflow'
            };
        });
})();