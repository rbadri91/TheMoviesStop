var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/users.js');

module.exports = function(passport) {

    passport.serializeUser(function(data, done) {
        done(null, data.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id).then(function(data) {
            done(null, data);
        }).catch(function(err) {
            done(err);
        });
    });

    passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
        },
        function(username, password, done) {
            User.findOne({ username: username }).then(function(user) {
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (!user.validPassword(password)) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            }).catch(function(err) {
                return done(err);
            });
        }
    ));
};