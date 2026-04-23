const request = require('supertest');
const { buildApp, closeApp } = require('./helpers/app.helper');
const User = require('../models/users');

const TEST_USER = {
  username: 'userdata_test_user',
  email: 'userdata_test@themoviesstop.test',
  password: 'TestPass123!',
};

const MOVIE_ID = 550;   // Fight Club
const SHOW_ID  = 1396;  // Breaking Bad

let app;
let token;
let userId;

beforeAll(async () => {
  app = await buildApp();
  await User.deleteOne({ username: TEST_USER.username });

  const res = await request(app).post('/register').send(TEST_USER);
  token = res.body.token;
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  userId = payload._id;
});

afterAll(async () => {
  await User.deleteOne({ username: TEST_USER.username });
  await closeApp();
});

// ─── Auth guard ─────────────────────────────────────────────────────────────

describe('Auth-protected routes reject requests without a token', () => {
  const unauthCases = [
    ['POST', '/user/movies/addToWatchList', { movieId: MOVIE_ID }],
    ['POST', '/user/movies/addToFavorites/', { movieId: MOVIE_ID }],
    ['POST', '/user/movies/rate/', { movieId: MOVIE_ID, ratingVal: 8 }],
    ['POST', '/user/tv/addToWatchList', { showId: SHOW_ID }],
    ['POST', '/user/tv/addToFavorites', { showId: SHOW_ID }],
    ['POST', '/user/tv/rate', { showId: SHOW_ID, ratingVal: 8 }],
  ];

  test.each(unauthCases)('%s %s returns 401', async (method, path, body) => {
    const res = await request(app)[method.toLowerCase()](path).send(body);
    expect(res.status).toBe(401);
  });
});

// ─── Movie watchlist ─────────────────────────────────────────────────────────

describe('Movie watchlist', () => {
  it('adds a movie to the watchlist', async () => {
    const res = await request(app)
      .post('/user/movies/addToWatchList')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const user = await User.findById(userId);
    expect(user.watchList.some(m => m.id === MOVIE_ID)).toBe(true);
  });

  it('GET /user/:id/moviesLikedAndtoWatch reflects watchlist status', async () => {
    const res = await request(app).get(`/user/${userId}/moviesLikedAndtoWatch/${MOVIE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.isInWatchList).toBe(true);
    expect(res.body.isInFavoritesList).toBe(false);
    expect(res.body.userRating).toBe(0);
  });

  it('removes the movie from watchlist on second toggle', async () => {
    await request(app)
      .post('/user/movies/addToWatchList')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID });

    const user = await User.findById(userId);
    expect(user.watchList.some(m => m.id === MOVIE_ID)).toBe(false);
  });
});

// ─── Movie favorites ─────────────────────────────────────────────────────────

describe('Movie favorites', () => {
  it('adds a movie to favorites', async () => {
    const res = await request(app)
      .post('/user/movies/addToFavorites/')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const user = await User.findById(userId);
    expect(user.favoritesList.some(m => m.id === MOVIE_ID && m.mediaType === 'movie')).toBe(true);
  });

  it('GET status shows movie is in favorites', async () => {
    const res = await request(app).get(`/user/${userId}/moviesLikedAndtoWatch/${MOVIE_ID}`);
    expect(res.body.isInFavoritesList).toBe(true);
  });

  it('removes movie from favorites on second toggle', async () => {
    await request(app)
      .post('/user/movies/addToFavorites/')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID });

    const user = await User.findById(userId);
    expect(user.favoritesList.some(m => m.id === MOVIE_ID)).toBe(false);
  });
});

// ─── Movie ratings ───────────────────────────────────────────────────────────

describe('Movie ratings', () => {
  it('saves a movie rating', async () => {
    const res = await request(app)
      .post('/user/movies/rate/')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID, ratingVal: 8 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, ratingVal: 8 });

    const user = await User.findById(userId);
    expect(user.ratings.find(r => r.id === MOVIE_ID)?.ratingValue).toBe(8);
  });

  it('updates an existing rating without duplicating it', async () => {
    await request(app)
      .post('/user/movies/rate/')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID, ratingVal: 5 });

    const user = await User.findById(userId);
    const matches = user.ratings.filter(r => r.id === MOVIE_ID);
    expect(matches).toHaveLength(1);
    expect(matches[0].ratingValue).toBe(5);
  });

  it('removes the rating when ratingVal is 0', async () => {
    await request(app)
      .post('/user/movies/rate/')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID, ratingVal: 0 });

    const user = await User.findById(userId);
    expect(user.ratings.some(r => r.id === MOVIE_ID)).toBe(false);
  });

  it('GET status reflects the current userRating', async () => {
    await request(app)
      .post('/user/movies/rate/')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: MOVIE_ID, ratingVal: 7 });

    const res = await request(app).get(`/user/${userId}/moviesLikedAndtoWatch/${MOVIE_ID}`);
    expect(res.body.userRating).toBe(7);
  });
});

// ─── TV watchlist ────────────────────────────────────────────────────────────

describe('TV show watchlist', () => {
  it('adds a show to the watchlist', async () => {
    const res = await request(app)
      .post('/user/tv/addToWatchList')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const user = await User.findById(userId);
    expect(user.watchList.some(s => s.id === SHOW_ID)).toBe(true);
  });

  it('GET /user/:id/tvLikedAndToWatch reflects watchlist status', async () => {
    const res = await request(app).get(`/user/${userId}/tvLikedAndToWatch/${SHOW_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.isInWatchList).toBe(true);
    expect(res.body.isInFavoritesList).toBe(false);
  });

  it('removes show from watchlist on second toggle', async () => {
    await request(app)
      .post('/user/tv/addToWatchList')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID });

    const user = await User.findById(userId);
    expect(user.watchList.some(s => s.id === SHOW_ID)).toBe(false);
  });
});

// ─── TV favorites ────────────────────────────────────────────────────────────

describe('TV show favorites', () => {
  it('adds a show to favorites', async () => {
    const res = await request(app)
      .post('/user/tv/addToFavorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID });

    expect(res.status).toBe(200);
    const user = await User.findById(userId);
    expect(user.favoritesList.some(s => s.id === SHOW_ID && s.mediaType === 'shows')).toBe(true);
  });

  it('removes show from favorites on second toggle', async () => {
    await request(app)
      .post('/user/tv/addToFavorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID });

    const user = await User.findById(userId);
    expect(user.favoritesList.some(s => s.id === SHOW_ID)).toBe(false);
  });
});

// ─── TV ratings ──────────────────────────────────────────────────────────────

describe('TV show ratings', () => {
  it('saves a TV show rating', async () => {
    const res = await request(app)
      .post('/user/tv/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID, ratingVal: 9 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, ratingVal: 9 });
  });

  it('updates an existing TV show rating without duplicating it', async () => {
    await request(app)
      .post('/user/tv/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID, ratingVal: 6 });

    const user = await User.findById(userId);
    const matches = user.ratings.filter(r => r.id === SHOW_ID);
    expect(matches).toHaveLength(1);
    expect(matches[0].ratingValue).toBe(6);
  });

  it('removes the TV rating when ratingVal is 0', async () => {
    await request(app)
      .post('/user/tv/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID, ratingVal: 0 });

    const user = await User.findById(userId);
    expect(user.ratings.some(r => r.id === SHOW_ID)).toBe(false);
  });

  it('GET status reflects the current TV userRating', async () => {
    await request(app)
      .post('/user/tv/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId: SHOW_ID, ratingVal: 8 });

    const res = await request(app).get(`/user/${userId}/tvLikedAndToWatch/${SHOW_ID}`);
    expect(res.body.userRating).toBe(8);
  });
});

// ─── GET status for unknown user ─────────────────────────────────────────────

describe('GET status for unknown user', () => {
  const fakeId = '000000000000000000000000';

  it('moviesLikedAndtoWatch returns default false/0 for unknown userId', async () => {
    const res = await request(app).get(`/user/${fakeId}/moviesLikedAndtoWatch/${MOVIE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isInWatchList: false, isInFavoritesList: false, userRating: 0 });
  });

  it('tvLikedAndToWatch returns default false/0 for unknown userId', async () => {
    const res = await request(app).get(`/user/${fakeId}/tvLikedAndToWatch/${SHOW_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isInWatchList: false, isInFavoritesList: false, userRating: 0 });
  });
});
