(function() {
    angular
        .module('themoviesStop')
        .directive("passwordVerify", passwordVerify);

    function passwordVerify() {
        return {
            restrict: 'A',
            require: 'registerCtrl',
            link: function(scope, elem, attrs, ngModel) {
                scope.$watch(attrs.ngModel, function() {
                    if (scope.registerCtrl.credentials.confirmPassword === scope.registerCtrl.credentials.password) {
                        scope.registerCtrl.credentials.confirmPassword.$setValidity('passwordVerify', true);
                        scope.credentials.password.$setValidity('passwordVerify', true);

                    } else if (scope.confirmPassword !== scope.password) {
                        scope.credentials.confirmPassword.$setValidity('passwordVerify', false);
                        scope.credentials.password.$setValidity('passwordVerify', false);
                    }
                });
            }
        };
    }
})();