/*jshint esversion: 6 */

var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var http = require("https");

var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });
var mongoose = require('mongoose');
var User = require('../models/users.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
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

router.get('/movies/:movie', function(req, res, next) {
    var movieId = req.params.movie;
    getMovieInfo(movieId).then((movieInfo) => {
        res.json(movieInfo);
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
        getLastSeasonInfo(showId, JSON.parse(showInfo).seasons.length).then((showData) => {
            console.log("typeOf showData:", typeof(showData));
            var addShowInfo = JSON.parse(showInfo);
            addShowInfo["last_seasonInfo"] = JSON.parse(showData);
            addShowInfo = JSON.stringify(addShowInfo);
            console.log("addShowInfo here:", addShowInfo);

            res.json(addShowInfo);
        });

    });
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

function getLastSeasonInfo(id, seasonNumber) {
    return new Promise((resolve) => {
        var options = {
            "method": "GET",
            "hostname": "api.themoviedb.org",
            "port": null,
            "path": "/3/tv/" + id + "/season/7?api_key=646a10c0084204abfff75a025d3c4539",
            "headers": {}
        };
        getdata(options, resolve);
    });
}

module.exports = router;