if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./config/database');
var passport = require('passport');
var mongoose = require('mongoose');
// var session = require('express-session');
var session = require('cookie-session');

const { MongoClient } = require('mongodb');

var users = require('./routes/users');

var app = express();

const ANGULAR_DIST = path.join(__dirname, 'frontend', 'dist', 'frontend', 'browser');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve Angular build output
app.use(express.static(ANGULAR_DIST));

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

let client;

// error handler — placed before routes intentionally for EJS errors;
// API error handler is registered after routes inside connectToDatabase()

async function connectToDatabase() {
    client = new MongoClient(db.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    try {
        await client.connect();

        // Use the database connection
        const db = client.db('theMovieAuth'); // Replace with your database name

        // Setup routes
        require('./routes/index')(app, passport, db);

        app.use('/users', users);

        // Catch-all: serve Angular's index.html for any non-API route
        // This allows Angular's client-side router to handle all page navigation
        app.use(function(req, res) {
            res.sendFile(path.join(ANGULAR_DIST, 'index.html'));
        });

        // global API error handler — keeps the process alive
        app.use(function(err, req, res, next) {
            console.error('[API Error]', err.message);
            res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
        });

    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }

    // Handle disconnection
    client.on('close', function() {
        console.log('MongoDB connection disconnected');
    });

    // Handle errors
    client.on('error', function(err) {
        console.error('MongoDB connection error:', err);
    });
}

connectToDatabase().catch(console.error);

mongoose.connect(process.env.MONGODB_URL).catch(err => console.error('Mongoose connection error:', err));

require('./config/passport.js')(passport);
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

module.exports = app;