/*jshint esversion: 6 */

var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var http = require("https");
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');

var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });
var mongoose = require('mongoose');
var User = require('../models/users.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/allFeeds', function(req, res, next) {
    var result = {};
    getUpcomingMovies().then((upcomingMovies) => {
        result.upcoming = JSON.parse(upcomingMovies);
        getNowShowingMovies().then((NowShowingMovies) => {
            result.nowShowing = JSON.parse(NowShowingMovies);
            getOpeningThisWeek().then((OpeningThisWeek) => {
                result.OpeningThisWeek = JSON.parse(OpeningThisWeek);
                res.json(result);
            });
        });
    });
});

router.post('/register', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Please fill out all fields' });
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password);

    user.save(function(err) {
        if (err) { return next(err); }

        return res.json({ token: user.generateJWT() })
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

router.get('/movies/popular', function(req, res, next) {
    getPopularMovies().then((movies) => {
        res.json(movies);
    });
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

        getSeasonInfo(showId, JSON.parse(showInfo).seasons.length).then((showData) => {
            var addShowInfo = JSON.parse(showInfo);
            addShowInfo.last_seasonInfo = JSON.parse(showData);
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

    // memcached.get('numShows', (err, count) => {

    for (var i = 0; i < count; i++) {
        getSeasonInfo(showId, ((hasSeason0) ? i : i + 1)).then((showData) => {
            results.push(JSON.parse(showData));
            if (results.length == count) {
                results = sortSeasonDetails(results);
                res.json(results);
            }
        });
    }
    // });
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
    return new Promise((resolve) => {
        var options = {
            "method": "GET",
            "hostname": "api.themoviedb.org",
            "port": null,
            "path": "/3/tv/" + id + "/season/" + seasonNumber + "?api_key=646a10c0084204abfff75a025d3c4539",
            "headers": {}
        };
        getdata(options, resolve);
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
            "path": "/3/discover/movie?primary_release_date.lte=" + nWDate + "&primary_release_date.gte=" + thisDate + "&primary_release_year=2017&page=1&include_video=false&include_adult=true&sort_by=popularity.desc&language=en-US&api_key=646a10c0084204abfff75a025d3c4539",
            "headers": {}
        };
        getdata(options, resolve);
    });
}

module.exports = router;