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

var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'dlikhoiuhwaf', resave: false, saveUninitialized: false }));

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

mongoose.connect(db.url, function(err) {
    if (err) throw err;
});

mongoose.connection.on('connected', function() {
    var conn = mongoose.connection;
    console.log("connected to mongoDB database");
    require('./routes/index')(app, passport);
    // var index = require('./routes/index');
    // app.use('/', index);
    app.use('/users', users);
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });
});

// If the connection throws an error
mongoose.connection.on('error', function(err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function() {
    console.log('Mongoose default connection disconnected');
});

require('./config/passport.js')(passport);
app.use(session({ secret: 'dlikhoiuhwaf', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

module.exports = app;