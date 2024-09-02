/*jshint esversion: 6 */

var express = require('express');
// var router = express.Router();
// var passport = require('passport');
var jwt = require('express-jwt');
var http = require("https");
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
const { Curl } = require('node-libcurl');


var mongoose = require('mongoose');
var User = require('../models/users.js');
module.exports = function(router, passport) {

    var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

    /* GET home page. */
    router.get('/', function(req, res, next) {
        res.render('index', { title: 'Express' });
    });

    router.get('/allFeeds', function(req, res, next) {
        var result = {};
            getUpcomingMovies().then((upcomingMovies) => {
                result.upcoming = JSON.parse(upcomingMovies);
                getShowingNowMovies().then((nowShowingMovies) => {
                    result.nowShowing = JSON.parse(JSON.stringify(nowShowingMovies, null, 2));
                    getOpeningThisWeek().then((OpeningThisWeek) => {
                        result.OpeningThisWeek = JSON.parse(OpeningThisWeek);
                        res.json(result);
                    });
                });
            });
    });

    router.post('/register', function(req, res, next) {
        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({ message: 'Please fill out all fields' });
        }

        var user = new User();

        user.username = req.body.username;
        user.email = req.body.email;

        user.setPassword(req.body.password);

        user.save(function(err) {
            if (err) { return next(err); }
            var resObj = { token: user.generateJWT() };
            return res.json(resObj);
        });
    });

    router.post('/login', function(req, res, next) {
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({ message: 'Please fill out all fields' });
        }

        passport.authenticate('local', function(err, user, info) {
            if (err) { return next(err); }

            if (user) {
                return res.json({ token: user.generateJWT() });
            } else {
                return res.status(401).json(info);
            }
        })(req, res, next);
    });

    router.get('/movies/top', function(req, res, next) {
        getTopMovies().then((movies) => {
            res.json(movies);
        });
    });

    router.get('/movies/upcoming', function(req, res, next) {
        getUpcomingMovies().then((movies) => {
            res.json(movies);
        });
    });

    router.get('/movies/showingnow', function(req, res, next) {
        getNowShowingMovies().then((movies) => {
            res.json(movies);
        });
    });

    router.get('/movies/popular', function(req, res, next) {
        getPopularMovies().then((movies) => {
            res.json(movies);
        });
    });

    router.get('/movies/openingThisWeek', function(req, res, next) {
        getOpeningThisWeek().then((movies) => {
            res.json(movies);
        });
    });

    router.get('/movies/:movie', function(req, res, next) {
        var movieId = req.params.movie;
        getMovieInfo(movieId).then((movieInfo) => {
            res.json(movieInfo);
        });
    });
    router.get('/movies/genre/:genreId', function(req, res, next) {
        var genreId = req.params.genreId;
        getGenereMovies(genreId).then((moviesList) => {
            res.json(moviesList);
        });
    });

    router.get('/user/:userId/moviesLikedAndtoWatch/:movieId', function(req, res, next) {
        var userId = req.params.userId;

        User.findById(userId).then(function(user) {
            var resObj = {};
            var currMovieId = req.params.movieId;
            resObj.isInWatchList = false;
            resObj.isInFavoritesList = false;

            for (var i = 0; i < user.watchList.length; i++) {
                if (currMovieId == user.watchList[i].id) {
                    resObj.isInWatchList = true;
                    break;
                }
            }
            for (var j = 0; j < user.favoritesList.length; j++) {
                if (currMovieId == user.favoritesList[j].id) {
                    resObj.isInFavoritesList = true;
                    break;
                }
            }
            res.json(resObj);
        });
    });

    router.post('/user/movies/addToFavorites/', auth, function(req, res, next) {
        var movieId = parseInt(req.body.movieId);
        User.findById(req.payload._id).then(function(user) {
            var favoritesList = user.favoritesList;
            var index = -1;
            for (var i = 0; i < favoritesList.length; i++) {
                if (favoritesList[i].id == movieId) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                user.favoritesList.splice(index, 1);
            } else {
                var favObj = { id: movieId, mediaType: "movie" };
                user.favoritesList.push(favObj);
            }
            user.save(function(err) {
                if (err) { return next(err); }
                return "Success";
            });
        });
    });

    router.post('/user/movies/rate/', auth, function(req, res, next) {
        var movieId = parseInt(req.body.movieId);
        var ratingVal = parseInt(req.body.ratingVal);
        var ratingsList = req.user.ratings;
        var index = -1;
        for (var i = 0; i < ratingsList.length; i++) {
            if (ratingsList[i].id == movieId) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            req.user.ratingsList.splice(index, 1);
        }
        if (ratingVal > 0) {
            var ratingObj = { id: movieId, mediaType: "movie", ratingValue: ratingVal };
            req.user.ratings.push(ratingObj);
        }

        req.user.save(function(err) {
            if (err) { return next(err); }
            return "Success";
        });
    });

    router.post('/user/movies/addToWatchList', auth, function(req, res, next) {
        var movieId = parseInt(req.body.movieId);
        User.findById(req.payload._id).then(function(user) {
            var watchList = user.watchList;
            var index = -1;
            for (var i = 0; i < watchList.length; i++) {
                if (watchList[i].id == movieId) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                user.watchList.splice(index, 1);
            } else {
                var watchObj = { id: movieId, mediaType: "movie" };
                user.watchList.push(watchObj);
            }
            user.save(function(err) {
                if (err) { return next(err); }
                return "Success";
            });
        });

    });
    router.get('/tv/genre/:genreId', function(req, res, next) {
        var genreId = req.params.genreId;
        getGenereShows(genreId).then((showsList) => {
            res.json(showsList);
        });
    });
    router.get('/movies/company/:companyId', function(req, res, next) {
        var companyId = req.params.companyId;
        getCompanyMovies(companyId).then((moviesList) => {
            res.json(moviesList);
        });
    });
    router.get('/tv/network/:networkId', function(req, res, next) {
        var networkId = req.params.networkId;
        getNetworkShows(networkId).then((showsList) => {
            res.json(showsList);
        });
    });

    router.get('/user/tv/addToFavorites', function(req, res, next) {
        var showId = parseInt(req.body);
        var favoritesList = req.user.favoritesList;
        var index = -1;
        for (var i = 0; i < favoritesList.length; i++) {
            if (favoritesList[i].id == showId) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            req.user.favoritesList.splice(index, 1);
        } else {
            var favObj = { id: showId, mediaType: "shows" };
            req.user.favoritesList.push(favObj);
        }
        req.user.save(function(err) {
            if (err) { return next(err); }
            return "Success";
        });
    });
    router.post('/user/tv/addToWatchList', auth, function(req, res, next) {
        var showId = parseInt(req.body);
        var watchList = req.user.watchList;
        var index = -1;
        for (var i = 0; i < watchList.length; i++) {
            if (watchList[i].id == showId) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            req.user.watchList.splice(index, 1);
        } else {
            var watchObj = { id: showId, mediaType: "shows" };
            req.user.watchList.push(watchObj);
        }
        req.user.save(function(err) {
            if (err) { return next(err); }
            return "Success";
        });
    });

    router.post('/user/tv/rate', auth, function(req, res, next) {
        var showId = parseInt(req.body.showId);
        var ratingVal = parseInt(req.body.ratingVal);
        var ratingsList = req.user.ratings;
        var index = -1;
        for (var i = 0; i < ratingsList.length; i++) {
            if (ratingsList[i].id == showId) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            req.user.ratingsList.splice(index, 1);
        }
        if (ratingVal > 0) {
            var ratingObj = { id: showId, mediaType: "movie", ratingValue: ratingVal };
            req.user.ratings.push(ratingObj);
        }

        req.user.save(function(err) {
            if (err) { return next(err); }
            return "Success";
        });
    });

    function getPopularMovies() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/popular?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };

            getdata(options, resolve);
        });
    }

    function getTopMovies() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/top_rated?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getUpcomingMovies() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/upcoming?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getShowingNowMovies() {
        var url = 'https://api.themoviedb.org/3/movie/now_playing?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539';

        return new Promise((resolve, reject) => {
            const curl = new Curl();
            let responseData = '';
    
            // Set Curl options
            curl.setOpt('URL', url);
            curl.setOpt('FOLLOWLOCATION', true); // Follow redirects
            curl.setOpt('WRITEFUNCTION', (data) => {
                responseData += data.toString();
                return Buffer.byteLength(data);
            });
            curl.setOpt('HEADERFUNCTION', (header) => {
                // Optional: Process headers if needed
                return Buffer.byteLength(header);
            });
    
            curl.on('end', function (statusCode, data, headers) {
                curl.close();
                if (statusCode >= 200 && statusCode < 300) {
                    try {
                        const jsonData = JSON.parse(responseData);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error('Failed to parse JSON response.'));
                    }
                } else {
                    reject(new Error(`HTTP error! status: ${statusCode}`));
                }
            });
    
            curl.on('error', function (error) {
                curl.close();
                reject(new Error('error: ' + error.message));
            });
    
            curl.perform();
        });

    }

    function getNowShowingMovies() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/now_playing?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    router.get('/tv/popular', function(req, res, next) {
        getPopularShows().then((shows) => {
            res.json(shows);
        });
    });

    router.get('/tv/top', function(req, res, next) {
        getTopShows().then((shows) => {
            res.json(shows);
        });
    });

    router.get('/tv/onTV', function(req, res, next) {
        getonTVShows().then((shows) => {
            res.json(shows);
        });
    });

    router.get('/tv/airingToday', function(req, res, next) {
        getAiringTodayShows().then((shows) => {
            res.json(shows);
        });
    });

    router.get('/tv/:show', function(req, res, next) {
        var showId = req.params.show;
        getShowInfo(showId).then((showInfo) => {
            var showDetails = showInfo;
            memcached.set("numShows", JSON.parse(showInfo).seasons.length);
            req.session.numSeasons = JSON.parse(showInfo).seasons.length;
            req.session.hasSeason0 = (JSON.parse(showInfo).seasons[0].season_number == 0);
            getSeasonInfo(showId, JSON.parse(showInfo).seasons.length-1).then((showData) => {
                var addShowInfo = JSON.parse(showInfo);
                addShowInfo.last_seasonInfo = JSON.parse(JSON.stringify(showData, null, 2));
                addShowInfo = JSON.stringify(addShowInfo);

                res.json(addShowInfo);
            });

        });
    });

    router.get('/tv/:show/allseason', function(req, res, next) {
        var showId = req.params.show;
        var results = [];
        var count = req.session.numSeasons;
        var hasSeason0 = req.session.hasSeason0;

        for (var i = 0; i < count; i++) {
            getSeasonInfo(showId, ((hasSeason0) ? i : i + 1)).then((showData) => {
                results.push(JSON.parse(showData));
                if (results.length == count) {
                    results = sortSeasonDetails(results);
                    res.json(results);
                }
            }).catch(error => {
                // Handle any errors that occurred during the fetch or parsing

                res.status(500).json({
                    message: 'Internal Server Error: Unable to fetch data.',
                    details: error.message
                });
            });;
        }
    });

    function getPopularShows() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/popular?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };

            getdata(options, resolve);
        });
    }

    function getTopShows() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/top_rated?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getonTVShows() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/on_the_air?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getAiringTodayShows() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/airing_today?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    router.get('/people/popular', function(req, res, next) {
        getPopularPeople().then((people) => {
            res.json(people);
        });
    });
    router.get('/people/:person', function(req, res, next) {
        var peopleId = req.params.person;
        getPeopleInfo(peopleId).then((peopleInfo) => {
            peopleInfo = sortCastsAndCrews(JSON.parse(peopleInfo));
            res.json(peopleInfo);
        });
    });

    function getPopularPeople() {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/person/popular?page=1&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };

            getdata(options, resolve);
        });
    }

    function getdata(options, resolve) {
        var req = http.request(options, function(res) {
            var chunks = [];
            var objectConstructor = ({}).constructor;

            res.on("data", function(chunk) {
                chunks.push(chunk);
            });
            res.on("end", function() {
                var body = Buffer.concat(chunks);
                resolve(body.toString());
            });
        });
        req.write("{}");
        req.end();
    }

    function getMovieInfo(id) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/" + id + "?append_to_response=images%2Cvideos%2Calternative_titles%2Ccredits%2Creviews%2Creleases%2Csimilar%2Crecommendations&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };

            getdata(options, resolve);
        });
    }

    function getShowInfo(id) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/" + id + "?append_to_response=images%2Cvideos%2Calternative_titles%2Ccontent_ratings%2Ccredits%2Creviews%2Creleases%2Csimilar%2Crecommendations%2Ccertifications&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getSeasonInfo(id, seasonNumber) {
        var url = 'https://api.themoviedb.org/3/tv/' + id + '/season/' + seasonNumber + '?api_key=646a10c0084204abfff75a025d3c4539&language=en-US';
        return new Promise((resolve, reject) => {
            const curl = new Curl();
            let responseData = '';
    
            // Set Curl options
            curl.setOpt('URL', url);
            curl.setOpt('FOLLOWLOCATION', true); // Follow redirects
            curl.setOpt('WRITEFUNCTION', (data) => {
                responseData += data.toString();
                return Buffer.byteLength(data);
            });
            curl.setOpt('HEADERFUNCTION', (header) => {
                // Optional: Process headers if needed
                return Buffer.byteLength(header);
            });
    
            curl.on('end', function (statusCode, data, headers) {
                curl.close();
                if (statusCode >= 200 && statusCode < 300) {
                    try {
                        const jsonData = JSON.parse(responseData);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error('Failed to parse JSON response.'));
                    }
                } else {
                    reject(new Error(`HTTP error! status: ${statusCode}`));
                }
            });
    
            curl.on('error', function (error) {
                curl.close();
                reject(new Error('error: ' + error.message));
            });
    
            curl.perform();
        });
    }

    function getPeopleInfo(id) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/person/" + id + "?append_to_response=images%2Cchanges%2Ccombined_credits%2Ctagged_images%2Crecommendations%2Csimilar&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getReleaseYear(show) {
        if (show.media_type == "movie") {
            return ((show.release_date) ? show.release_date.substring(0, show.release_date.indexOf("-")) : "");
        } else {
            return ((show.first_air_date) ? show.first_air_date.substring(0, show.first_air_date.indexOf("-")) : "");
        }
    }

    function sortCastsAndCrews(peopleInfo) {
        for (var i = 0; i < peopleInfo.combined_credits.cast.length; i++) {
            var releaseYear = getReleaseYear(peopleInfo.combined_credits.cast[i]);
            peopleInfo.combined_credits.cast[i].releaseYear = releaseYear;
        }
        for (var j = 0; j < peopleInfo.combined_credits.crew.length; j++) {
            var rYear = getReleaseYear(peopleInfo.combined_credits.crew[j]);
            peopleInfo.combined_credits.crew[j].releaseYear = rYear;
        }
        var casting = peopleInfo.combined_credits.cast;
        casting.sort(function(a, b) {
            return parseInt(b.releaseYear) - parseInt(a.releaseYear);
        });
        peopleInfo.combined_credits.cast = casting;
        var crews = peopleInfo.combined_credits.crew;
        crews.sort(function(a, b) {
            return parseInt(b.releaseYear) - parseInt(a.releaseYear);
        });
        peopleInfo.combined_credits.crew = crews;
        return JSON.stringify(peopleInfo);
    }

    function sortSeasonDetails(seasonDetails) {
        seasonDetails.sort(function(a, b) {
            return parseInt(a.season_number) - parseInt(b.season_number);
        });
        return seasonDetails;
    }

    function getGenereMovies(genreId) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/discover/movie?with_genres=" + genreId + "&page=1&include_video=false&include_adult=true&sort_by=popularity.desc&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getGenereShows(genreId) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/discover/tv?include_null_first_air_dates=true&with_genres=" + genreId + "&page=1&sort_by=popularity.desc&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getCompanyMovies(companyId) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/discover/movie?with_companies=" + companyId + "&page=1&include_video=false&include_adult=true&sort_by=popularity.desc&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getNetworkShows(networkId) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/discover/tv?include_null_first_air_dates=false&with_networks=" + networkId + "&page=1&sort_by=popularity.desc&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getOpeningThisWeek() {
        var d = new Date();
        var nextWeek = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
        var nY = nextWeek.getFullYear();
        var nM = nextWeek.getMonth() + 1;
        var nD = nextWeek.getDate();

        var tY = d.getFullYear();
        var tM = d.getMonth() + 1;
        var tD = d.getDate();
        var nWDate = nY + "-" + nM + "-" + nD;
        var thisDate = tY + "-" + tM + "-" + tD;

        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/discover/movie?primary_release_date.lte=" + nWDate + "&primary_release_date.gte=" + thisDate + "&primary_release_year=" + tY + "&page=1&include_video=false&include_adult=true&sort_by=popularity.desc&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
                "headers": {}
            };
            getdata(options, resolve);
        });
    }
}