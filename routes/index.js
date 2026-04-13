/*jshint esversion: 6 */

var express = require('express');
// var router = express.Router();
// var passport = require('passport');
const { expressjwt: jwt } = require('express-jwt');
var http = require("https");
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Client: McpClient } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const Anthropic = require('@anthropic-ai/sdk');

const ratingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60,                   // max 60 ratings per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

const summaryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // max 10 AI summary requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many summary requests, please try again later.' },
});


var mongoose = require('mongoose');
var User = require('../models/users.js');
module.exports = function(router, passport) {

    var auth = jwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'], requestProperty: 'payload' });
    var TMDB_API_KEY = process.env.TMDB_API_KEY;

    router.get('/allFeeds', function(req, res, next) {
        Promise.all([
            getUpcomingMovies(),
            getNowShowingMovies(),
            getOpeningThisWeek(1)
        ]).then(([upcomingMovies, nowShowingMovies, OpeningThisWeek]) => {
            res.json({
                upcoming: JSON.parse(upcomingMovies),
                nowShowing: JSON.parse(nowShowingMovies),
                OpeningThisWeek: JSON.parse(OpeningThisWeek)
            });
        }).catch(next);
    });

    router.post('/register', function(req, res, next) {
        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({ message: 'Please fill out all fields' });
        }

        var user = new User();

        user.username = req.body.username;
        user.email = req.body.email;

        user.setPassword(req.body.password);

        user.save().then(function() {
            return res.json({ token: user.generateJWT() });
        }).catch(function(err) {
            return next(err);
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

    router.post('/user/change-password', auth, function(req, res, next) {
        var currentPassword = req.body.currentPassword;
        var newPassword = req.body.newPassword;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please fill out all fields' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        User.findById(req.payload._id).then(function(user) {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (!user.validPassword(currentPassword)) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            user.setPassword(newPassword);
            return user.save().then(function() {
                return res.json({ token: user.generateJWT() });
            });
        }).catch(function(err) {
            return next(err);
        });
    });

    router.get('/movies/top', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getTopMovies(page).then((movies) => {
            res.json(JSON.parse(movies));
        }).catch(next);
    });

    router.get('/movies/upcoming', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getUpcomingMovies(page).then((movies) => {
            res.json(JSON.parse(movies));
        }).catch(next);
    });

    router.get('/movies/showingnow', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getNowShowingMovies(page).then((movies) => {
            res.json(JSON.parse(movies));
        }).catch(next);
    });

    router.get('/movies/popular', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getPopularMovies(page).then((movies) => {
            res.json(JSON.parse(movies));
        }).catch(next);
    });

    router.get('/movies/openingThisWeek', function(req, res, next) {
        getOpeningThisWeek(1).then((movies) => {
            res.json(JSON.parse(movies));
        }).catch(next);
    });

    router.post('/movies/:id/summary', summaryLimiter, async function(req, res, next) {
        const movieId = parseInt(req.params.id, 10);
        if (!movieId || isNaN(movieId)) {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'AI summary not configured' });
        }

        const transport = new StdioClientTransport({
            command: 'node',
            args: [path.join(__dirname, '..', 'mcp', 'movie-summary-server.js')],
            env: { ...process.env },
        });

        const mcpClient = new McpClient({ name: 'movies-stop-backend', version: '1.0.0' });

        try {
            await mcpClient.connect(transport);

            const { tools } = await mcpClient.listTools();
            const anthropicTools = tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            }));

            const anthropic = new Anthropic.default({ apiKey });
            const messages = [
                {
                    role: 'user',
                    content: `Fetch the details for movie ID ${movieId} and write a concise 3-4 sentence summary covering what the film is about, its genre and tone, and why someone might enjoy it.`,
                },
            ];

            let summary = '';
            // Agentic loop: Claude calls get_movie_details, we run it via MCP, then Claude writes the summary
            for (let i = 0; i < 5; i++) {
                const response = await anthropic.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 512,
                    tools: anthropicTools,
                    messages,
                });

                if (response.stop_reason === 'end_turn') {
                    summary = response.content
                        .filter(b => b.type === 'text')
                        .map(b => b.text)
                        .join('');
                    break;
                }

                if (response.stop_reason === 'tool_use') {
                    messages.push({ role: 'assistant', content: response.content });

                    const toolResults = [];
                    for (const block of response.content) {
                        if (block.type !== 'tool_use') continue;
                        const result = await mcpClient.callTool({
                            name: block.name,
                            arguments: block.input,
                        });
                        toolResults.push({
                            type: 'tool_result',
                            tool_use_id: block.id,
                            content: result.content[0]?.text ?? 'No data returned',
                        });
                    }
                    messages.push({ role: 'user', content: toolResults });
                } else {
                    break;
                }
            }

            if (!summary) {
                return res.status(500).json({ error: 'Failed to generate summary' });
            }

            res.json({ summary });
        } catch (err) {
            next(err);
        } finally {
            try { await mcpClient.close(); } catch (_) {}
        }
    });

    router.get('/movies/:movie', function(req, res, next) {
        var movieId = req.params.movie;
        getMovieInfo(movieId).then((movieInfo) => {
            res.json(movieInfo);
        }).catch(next);
    });
    router.get('/movies/genre/:genreId', function(req, res, next) {
        var genreId = req.params.genreId;
        getGenereMovies(genreId).then((moviesList) => {
            res.json(moviesList);
        }).catch(next);
    });

    router.get('/user/:userId/moviesLikedAndtoWatch/:movieId', function(req, res, next) {
        var userId = req.params.userId;

        User.findById(userId).then(function(user) {
            var resObj = { isInWatchList: false, isInFavoritesList: false, userRating: 0 };
            if (!user) return res.json(resObj);
            var currMovieId = req.params.movieId;

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
            for (var k = 0; k < user.ratings.length; k++) {
                if (currMovieId == user.ratings[k].id) {
                    resObj.userRating = user.ratings[k].ratingValue;
                    break;
                }
            }
            res.json(resObj);
        }).catch(next);
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
                user.favoritesList.push({ id: movieId, mediaType: "movie" });
            }
            return user.save().then(function() {
                res.json({ success: true });
            });
        }).catch(next);
    });

    router.post('/user/movies/rate/', ratingLimiter, auth, function(req, res, next) {
        var movieId = parseInt(req.body.movieId);
        var ratingVal = parseInt(req.body.ratingVal);
        User.findById(req.payload._id).then(function(user) {
            var index = -1;
            for (var i = 0; i < user.ratings.length; i++) {
                if (user.ratings[i].id == movieId) { index = i; break; }
            }
            if (index != -1) user.ratings.splice(index, 1);
            if (ratingVal > 0) user.ratings.push({ id: movieId, mediaType: 'movie', ratingValue: ratingVal });
            return user.save().then(function() {
                res.json({ success: true, ratingVal: ratingVal });
            });
        }).catch(next);
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
                user.watchList.push({ id: movieId, mediaType: "movie" });
            }
            return user.save().then(function() {
                res.json({ success: true });
            });
        }).catch(next);
    });
    router.get('/tv/genre/:genreId', function(req, res, next) {
        var genreId = req.params.genreId;
        getGenereShows(genreId).then((showsList) => {
            res.json(showsList);
        }).catch(next);
    });
    router.get('/movies/company/:companyId', function(req, res, next) {
        var companyId = req.params.companyId;
        getCompanyMovies(companyId).then((moviesList) => {
            res.json(moviesList);
        }).catch(next);
    });
    router.get('/tv/network/:networkId', function(req, res, next) {
        var networkId = req.params.networkId;
        getNetworkShows(networkId).then((showsList) => {
            res.json(showsList);
        }).catch(next);
    });

    router.post('/user/tv/addToFavorites', auth, function(req, res, next) {
        var showId = parseInt(req.body.showId);
        User.findById(req.payload._id).then(function(user) {
            var favoritesList = user.favoritesList;
            var index = -1;
            for (var i = 0; i < favoritesList.length; i++) {
                if (favoritesList[i].id == showId) { index = i; break; }
            }
            if (index != -1) {
                user.favoritesList.splice(index, 1);
            } else {
                user.favoritesList.push({ id: showId, mediaType: "shows" });
            }
            return user.save().then(function() {
                res.json({ success: true });
            });
        }).catch(next);
    });

    router.get('/user/:userId/tvLikedAndToWatch/:showId', function(req, res, next) {
        User.findById(req.params.userId).then(function(user) {
            var showId = req.params.showId;
            var resObj = { isInWatchList: false, isInFavoritesList: false, userRating: 0 };
            if (!user) return res.json(resObj);
            for (var i = 0; i < user.watchList.length; i++) {
                if (showId == user.watchList[i].id) { resObj.isInWatchList = true; break; }
            }
            for (var j = 0; j < user.favoritesList.length; j++) {
                if (showId == user.favoritesList[j].id) { resObj.isInFavoritesList = true; break; }
            }
            for (var k = 0; k < user.ratings.length; k++) {
                if (showId == user.ratings[k].id) { resObj.userRating = user.ratings[k].ratingValue; break; }
            }
            res.json(resObj);
        }).catch(next);
    });

    router.get('/user/profile', auth, function(req, res, next) {
        User.findById(req.payload._id).then(async function(user) {
            var enrichItem = async function(item) {
                return new Promise(function(resolve) {
                    var path = (item.mediaType === 'movie')
                        ? '/3/movie/' + item.id + '?language=en-US&api_key=' + TMDB_API_KEY
                        : '/3/tv/' + item.id + '?language=en-US&api_key=' + TMDB_API_KEY;
                    var options = { method: 'GET', hostname: 'api.themoviedb.org', port: null, path: path, headers: {} };
                    getdata(options, function(data) {
                        try {
                            var parsed = JSON.parse(data);
                            resolve(Object.assign({}, item.toObject(), {
                                title: parsed.title || parsed.name,
                                poster_path: parsed.poster_path,
                            }));
                        } catch(e) { resolve(item.toObject()); }
                    });
                });
            };
            try {
                var [watchList, favoritesList, ratings] = await Promise.all([
                    Promise.all(user.watchList.map(enrichItem)),
                    Promise.all(user.favoritesList.map(enrichItem)),
                    Promise.all(user.ratings.map(enrichItem)),
                ]);
                res.json({ username: user.username, watchList: watchList, favoritesList: favoritesList, ratings: ratings });
            } catch(e) {
                res.json({ username: user.username, watchList: [], favoritesList: [], ratings: [] });
            }
        }).catch(next);
    });
    router.post('/user/tv/addToWatchList', auth, function(req, res, next) {
        var showId = parseInt(req.body.showId);
        User.findById(req.payload._id).then(function(user) {
            var watchList = user.watchList;
            var index = -1;
            for (var i = 0; i < watchList.length; i++) {
                if (watchList[i].id == showId) { index = i; break; }
            }
            if (index != -1) {
                user.watchList.splice(index, 1);
            } else {
                user.watchList.push({ id: showId, mediaType: "shows" });
            }
            return user.save().then(function() {
                res.json({ success: true });
            });
        }).catch(next);
    });

    router.post('/user/tv/rate', ratingLimiter, auth, function(req, res, next) {
        var showId = parseInt(req.body.showId);
        var ratingVal = parseInt(req.body.ratingVal);
        User.findById(req.payload._id).then(function(user) {
            var index = -1;
            for (var i = 0; i < user.ratings.length; i++) {
                if (user.ratings[i].id == showId) { index = i; break; }
            }
            if (index != -1) user.ratings.splice(index, 1);
            if (ratingVal > 0) user.ratings.push({ id: showId, mediaType: 'shows', ratingValue: ratingVal });
            return user.save().then(function() {
                res.json({ success: true, ratingVal: ratingVal });
            });
        }).catch(next);
    });

    function getPopularMovies(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/popular?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getTopMovies(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/top_rated?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getUpcomingMovies(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/upcoming?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getShowingNowMovies(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/now_playing?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getNowShowingMovies(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/movie/now_playing?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    router.get('/tv/popular', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getPopularShows(page).then((shows) => {
            res.json(shows);
        }).catch(next);
    });

    router.get('/tv/top', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getTopShows(page).then((shows) => {
            res.json(shows);
        }).catch(next);
    });

    router.get('/tv/onTV', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getonTVShows(page).then((shows) => {
            res.json(shows);
        }).catch(next);
    });

    router.get('/tv/airingToday', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getAiringTodayShows(page).then((shows) => {
            res.json(shows);
        }).catch(next);
    });

    router.get('/tv/:show', function(req, res, next) {
        var showId = req.params.show;
        getShowInfo(showId).then((showInfo) => {
            var parsed = JSON.parse(showInfo);
            if (!parsed || !parsed.seasons || !parsed.seasons.length) {
                return res.json(parsed || {});
            }
            memcached.set("numShows", parsed.seasons.length);
            req.session.numSeasons = parsed.seasons.length;
            req.session.hasSeason0 = (parsed.seasons[0].season_number == 0);
            setTimeout(() => {
                getSeasonInfo(showId, parsed.seasons.length - 1).then((showData) => {
                    try {
                        parsed.last_seasonInfo = JSON.parse(showData);
                    } catch(e) {
                        parsed.last_seasonInfo = null;
                    }
                    res.json(parsed);
                }).catch(next);
            }, 300);
        }).catch(next);
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

    function getPopularShows(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/popular?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getTopShows(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/top_rated?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getonTVShows(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/on_the_air?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getAiringTodayShows(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/tv/airing_today?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    router.get('/people/popular', function(req, res, next) {
        var page = parseInt(req.query.page) || 1;
        getPopularPeople(page).then((people) => {
            res.json(people);
        }).catch(next);
    });
    router.get('/people/:person', function(req, res, next) {
        var peopleId = req.params.person;
        getPeopleInfo(peopleId).then((peopleInfo) => {
            peopleInfo = sortCastsAndCrews(JSON.parse(peopleInfo));
            res.json(peopleInfo);
        }).catch(next);
    });

    function getPopularPeople(page) {
        return new Promise((resolve) => {
            var options = {
                "method": "GET",
                "hostname": "api.themoviedb.org",
                "port": null,
                "path": "/3/person/popular?page=" + (page||1) + "&language=en-US&api_key=" + TMDB_API_KEY,
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
                "path": "/3/movie/" + id + "?append_to_response=images%2Cvideos%2Calternative_titles%2Ccredits%2Creviews%2Creleases%2Csimilar%2Crecommendations&api_key=" + TMDB_API_KEY,
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
                "path": "/3/tv/" + id + "?append_to_response=images%2Cvideos%2Calternative_titles%2Ccontent_ratings%2Ccredits%2Creviews%2Creleases%2Csimilar%2Crecommendations%2Ccertifications&api_key=" + TMDB_API_KEY,
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
                "path": "/3/tv/" + id + "/season/" + seasonNumber + "?api_key=" + TMDB_API_KEY + "&language=en-US",
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
                "path": "/3/person/" + id + "?append_to_response=images%2Cchanges%2Ccombined_credits%2Ctagged_images%2Crecommendations%2Csimilar&api_key=" + TMDB_API_KEY,
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
                "path": "/3/discover/movie?with_genres=" + genreId + "&page=1&include_video=false&include_adult=true&sort_by=popularity.desc&language=en-US&api_key=" + TMDB_API_KEY,
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
                "path": "/3/discover/tv?include_null_first_air_dates=true&with_genres=" + genreId + "&page=1&sort_by=popularity.desc&language=en-US&api_key=" + TMDB_API_KEY,
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
                "path": "/3/discover/movie?with_companies=" + companyId + "&page=1&include_video=false&include_adult=true&sort_by=popularity.desc&language=en-US&api_key=" + TMDB_API_KEY,
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
                "path": "/3/discover/tv?include_null_first_air_dates=false&with_networks=" + networkId + "&page=1&sort_by=popularity.desc&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }

    function getOpeningThisWeek(pageId) {
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
                "path": "/3/discover/movie?primary_release_date.lte=" + nWDate + "&primary_release_date.gte=" + thisDate + "&primary_release_year=" + tY + "&page="+pageId + "&include_video=false&include_adult=true&sort_by=popularity.desc&language=en-US&api_key=" + TMDB_API_KEY,
                "headers": {}
            };
            getdata(options, resolve);
        });
    }
}