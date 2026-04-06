require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');

let app;

async function buildApp() {
  if (app) return app;

  app = express();
  app.set('views', path.join(__dirname, '../../views'));
  app.set('view engine', 'ejs');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

  await mongoose.connect(process.env.MONGODB_URL);

  require('../../config/passport.js')(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  // Mount routes — pass null for the MongoClient db (auth routes don't use it)
  require('../../routes/index')(app, passport, null);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  return app;
}

async function closeApp() {
  await mongoose.disconnect();
}

module.exports = { buildApp, closeApp };
