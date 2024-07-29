var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./config/database');
var passport = require('passport');
var mongoose = require('mongoose');
var session = require('express-session');
const { MongoClient } = require('mongodb');

var users = require('./routes/users');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'dlikhoiuhwaf', resave: false, saveUninitialized: false }));

const port = 8002;

let client;

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

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

        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
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

require('./config/passport.js')(passport);
app.use(session({ secret: 'dlikhoiuhwaf', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

module.exports = app;