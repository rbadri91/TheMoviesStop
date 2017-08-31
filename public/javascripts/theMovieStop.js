var app = angular.module('themoviesStop', ['ui.router', 'ui.bootstrap']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'templates/home/home.view.ejs',
                controller: 'homeCtrl'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login/login.view.ejs',
                controller: 'loginCtrl',
                onEnter: ['$state', 'authentication', function($state, authentication) {
                    if (authentication.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: 'templates/register/register.view.ejs',
                controller: 'registerCtrl',
                onEnter: ['$state', 'authentication', function($state, authentication) {
                    if (authentication.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            })
            .state('popularMovies', {
                url: '/movies/popular',
                templateUrl: 'templates/popularMovies.view.ejs',
                controller: 'moviesCtrl',
                resolve: {
                    movies: ['movies', function(movies) {
                        return movies.getPopular();
                    }]
                },
                title: 'Popular Movies'
            })
            .state('topRatedMovies', {
                url: '/movies/top',
                templateUrl: 'templates/topRatedMovies.view.ejs',
                controller: 'moviesCtrl',
                resolve: {
                    movies: ['movies', function(movies) {
                        return movies.getTopRated();
                    }]
                },
                title: 'Top Rated Movies'
            })
            .state('upComingMovies', {
                url: '/movies/upcoming',
                templateUrl: 'templates/upcomingMovies.view.ejs',
                controller: 'moviesCtrl',
                resolve: {
                    movies: ['movies', function(movies) {
                        return movies.getUpcoming();
                    }]
                },
                title: 'Upcoming Movies'
            })
            .state('showingNowMovies', {
                url: '/movies/showingnow',
                templateUrl: 'templates/showingNowMovies.view.ejs',
                controller: 'moviesCtrl',
                resolve: {
                    movies: ['movies', function(movies) {
                        return movies.getShowingNow();
                    }]
                },
                title: 'Showing Now Movies'
            })
            .state('movieDetails', {
                url: '/movies/{id}',
                templateUrl: 'templates/movieDetails.view.ejs',
                controller: 'moviesCtrl',
                resolve: {
                    movies: ['$stateParams', 'movies', function($stateParams, movies) {
                        // var moviesDetails = movies.getMovieDetails($stateParams.id);
                        // console.log("moviesDetails here:", moviesDetails);
                        return movies.getMovieDetails($stateParams.id);
                    }]
                },
                title: 'Movie Information'
            })
            .state('popularShows', {
                url: '/tv/popular',
                templateUrl: 'templates/popularShows.view.ejs',
                controller: 'showsCtrl',
                resolve: {
                    shows: ['shows', function(shows) {
                        return shows.getPopular();
                    }]
                },
                title: 'Popular Shows'
            })
            .state('topShows', {
                url: '/tv/top',
                templateUrl: 'templates/topShows.view.ejs',
                controller: 'showsCtrl',
                resolve: {
                    shows: ['shows', function(shows) {
                        return shows.getTopRated();
                    }]
                },
                title: 'Top Rated Shows'
            })
            .state('onTVShows', {
                url: '/tv/onTV',
                templateUrl: 'templates/onTVShows.view.ejs',
                controller: 'showsCtrl',
                resolve: {
                    shows: ['shows', function(shows) {
                        return shows.getOnTV();
                    }]
                },
                title: 'On TV Shows'
            })
            .state('airingTodayShows', {
                url: '/tv/airingToday',
                templateUrl: 'templates/airingToday.view.ejs',
                controller: 'showsCtrl',
                resolve: {
                    shows: ['shows', function(shows) {
                        return shows.getAiringToday();
                    }]
                },
                title: 'Airing Today Shows'
            })
            .state('popularPeople', {
                url: '/people/popular',
                templateUrl: 'templates/popularPeople.view.ejs',
                controller: 'peopleCtrl',
                resolve: {
                    people: ['people', function(people) {
                        return people.getPopular();
                    }]
                },
                title: 'Popular People'
            });

        $urlRouterProvider.otherwise('home');
    }
]);

app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.hashPrefix('');
}]);

app.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'https://www.youtube.com/**'
    ]);
});