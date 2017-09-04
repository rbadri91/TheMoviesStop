(function() {
    angular.module('themoviesStop').directive('fireCustomEvent', function() {
        return {
            restrict: "A",
            link: function(scope, element) {
                element.find('button').on('click', function() {
                    element.find('span').trigger("customEvent");
                });
            }
        };
    });
})();