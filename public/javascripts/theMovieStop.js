var app = angular.module('themoviesStop', ['ui.router', 'ngAnimate', 'ui.bootstrap', 'ngSanitize', 'ngStorage', 'ui.bootstrap.tpls', 'ui.bootstrap.collapse']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'templates/home/home.view.ejs',
                controller: 'homeCtrl',
                resolve: {
                    allMedia: ['allMedia', function(allMedia) {
                        return allMedia.getAllMediaDetails();
                    }]
                },
                title: "The Movies Spot"
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
                    postPromise: ['movies', function(movies) {
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
                    postPromise: ['movies', function(movies) {
                        return movies.getTopRated();
                    }]
                },
                title: 'Top Rated Movies'
            })
            .state('upComingMovies', {
                url: '/movies/upcoming',
                templateUrl: 'templates/upcomingMovies.view.ejs',
                controller: 'moviesCtrl',
                postPromise: {
                    postPromise: ['movies', function(movies) {
                        return movies.getUpcoming();
                    }]
                },
                title: 'Upcoming Movies'
            })
            .state('showingNowMovies', {
                url: '/movies/showingnow',
                templateUrl: 'templates/showingNowMovies.view.ejs',
                controller: 'moviesCtrl',
                postPromise: {
                    postPromise: ['movies', function(movies) {
                        return movies.getShowingNow();
                    }]
                },
                title: 'Showing Now Movies'
            })
            .state('MoviesOpeningThisWeek', {
                url: '/movies/openingthisweek',
                templateUrl: 'templates/openingThisWeekMovies.view.ejs',
                controller: 'moviesCtrl',
                resolve: {
                    postPromise: ['movies', function(movies) {
                        return movies.getMoviesOpeningThisWeek();
                    }]
                },
                title: 'Movies Opening This Week'
            })
            .state('movieDetails', {
                url: '/movies/desc/{id}',
                templateUrl: 'templates/movieDetails.view.ejs',
                controller: 'moviesCtrl',
                resolve: {
                    postPromise: ['$stateParams', 'movies', function($stateParams, movies) {
                        return movies.getMovieDetails($stateParams.id);
                    }]
                },
                title: 'Movie Information'
            })
            .state('fullCast', {
                url: '/movies/desc/{id}/fullCast',
                templateUrl: 'templates/fullCast.view.ejs',
                controller: 'fullCastCtrl',
                title: 'Full Cast'
            })
            .state('moviesAllReviews', {
                url: '/movies/desc/{id}/reviews',
                templateUrl: 'templates/Reviews.view.ejs',
                controller: 'reviewsCtrl',
                title: 'All Reviews'
            })
            .state('moviesAlsoKnownAs', {
                url: '/movies/desc/{id}/alsoKnownAs',
                templateUrl: 'templates/AltName.view.ejs',
                controller: 'altNameCtrl',
                title: 'Also Known As'
            })
            .state('genreBasedMovies', {
                url: '/movies/genre/{id}',
                templateUrl: 'templates/GenreBased.view.ejs',
                controller: 'genreCtrl',
                resolve: {
                    genreShows: ['$stateParams', 'genreShows', function($stateParams, genreShows) {

                        return genreShows.getAllGenreMovies($stateParams.id);
                    }]
                },
                title: 'Genre Based Movies'
            })
            .state('companyBasedMovies', {
                url: '/movies/company/{id}',
                templateUrl: 'templates/companyBased.view.ejs',
                controller: 'companyAndNetworkCtrl',
                resolve: {
                    companyMedia: ['$stateParams', 'companyMedia', function($stateParams, companyMedia) {
                        return companyMedia.getAllCompanyMovies($stateParams.id);
                    }]
                },
                title: 'Company Based Shows'
            })
            .state('companyLists', {
                url: '/movies/desc/{id}/allCompanies',
                templateUrl: 'templates/companyList.view.ejs',
                controller: 'companyListCtrl',
                title: 'All Companies'
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
            .state('showDetails', {
                url: '/tv/desc/{id}',
                templateUrl: 'templates/showDetails.view.ejs',
                controller: 'showsCtrl',
                resolve: {
                    shows: ['$stateParams', 'shows', function($stateParams, shows) {
                        return shows.getShowDetails($stateParams.id);
                    }]
                },
                title: 'Show Information'
            })
            .state('ShowsfullCast', {
                url: '/tv/desc/{id}/fullCast',
                templateUrl: 'templates/fullCast.view.ejs',
                controller: 'fullCastCtrl',
                title: 'Full Cast'
            })
            .state('showsAllReviews', {
                url: '/tv/desc/{id}/reviews',
                templateUrl: 'templates/Reviews.view.ejs',
                controller: 'reviewsCtrl',
                title: 'All Reviews'
            })
            .state('showsAllSeason', {
                url: '/tv/desc/{id}/allseason',
                templateUrl: 'templates/SeasonReviews.view.ejs',
                controller: 'seasonsCtrl',
                resolve: {
                    seasons: ['$stateParams', 'seasons', function($stateParams, seasons) {
                        return seasons.getAllSeasonDetails($stateParams.id);
                    }]
                },
                title: 'All Seasons'
            })
            .state('genreBasedShows', {
                url: '/tv/genre/{id}',
                templateUrl: 'templates/GenreBased.view.ejs',
                controller: 'genreCtrl',
                resolve: {
                    genreShows: ['$stateParams', 'genreShows', function($stateParams, genreShows) {
                        return genreShows.getAllGenreShows($stateParams.id);
                    }]
                },
                title: 'Genre Based Shows'
            })
            .state('networkBasedShows', {
                url: '/tv/network/{id}',
                templateUrl: 'templates/companyBased.view.ejs',
                controller: 'companyAndNetworkCtrl',
                resolve: {
                    companyMedia: ['$stateParams', 'companyMedia', function($stateParams, companyMedia) {
                        return companyMedia.getAllNetworkShows($stateParams.id);
                    }]
                },
                title: 'Network Based Shows'
            })
            .state('networkLists', {
                url: '/tv/desc/{id}/allNetworks',
                templateUrl: 'templates/companyList.view.ejs',
                controller: 'companyListCtrl',
                title: 'All Networks'
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
            })
            .state('peopleDetails', {
                url: '/people/desc/{id}',
                templateUrl: 'templates/peopleDetails.view.ejs',
                controller: 'peopleCtrl',
                resolve: {
                    people: ['$stateParams', 'people', function($stateParams, people) {
                        return people.getPeopleDetails($stateParams.id);
                    }]
                },
                title: 'People Information'
            })
            .state('profilePage', {
                url: '/profile',
                templateUrl: 'templates/popularPeople.view.ejs',
                controller: 'peopleCtrl',
                resolve: {
                    people: ['people', function(people) {
                        return people.getPopular();
                    }]
                },
                title: 'Popular People'
            })


        $urlRouterProvider.otherwise('home');
    }
]);

function run($rootScope, $location, authentication) {
    $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
        if ($location.path() === '/profile' && !authentication.isLoggedIn()) {
            $location.path('/');
        }
    });
}

app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.hashPrefix('');
}]);

app.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'https://www.youtube.com/**'
    ]);
});
app.value('HTMLIZE_CONVERSIONS', [
    { expr: /\n+?/g, value: '<br>' }
]);

app.filter('htmlize', function(HTMLIZE_CONVERSIONS) {
    return function(string) {
        return HTMLIZE_CONVERSIONS.reduce(function(result, conversion) {
            return result.replace(conversion.expr, conversion.value);
        }, string || '');
    };
});
app.run(['$rootScope', '$location', 'authentication', run]);