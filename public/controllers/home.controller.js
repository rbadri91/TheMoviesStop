(function() {

    angular
        .module('themoviesStop')
        .controller('homeCtrl', homeCtrl);

    function homeCtrl() {
        console.log('Home controller is running');
    }
})();