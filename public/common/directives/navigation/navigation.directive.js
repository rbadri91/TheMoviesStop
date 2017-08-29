(function() {

    angular
        .module('themoviesStop')
        .directive('navigation', navigation);

    function navigation() {
        return {
            restrict: 'EA',
            templateUrl: '/common/directives/navigation/navigation.template.html',
            controller: 'NavCtrl as navvm'
        };
    }

})();