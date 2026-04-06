const request = require('supertest');
const mongoose = require('mongoose');
const { buildApp, closeApp } = require('./helpers/app.helper');
const User = require('../models/users');

const TEST_USER = {
  username: 'integration_test_user',
  email: 'integration_test@themoviesstop.test',
  password: 'TestPass123!',
};

let app;

beforeAll(async () => {
  app = await buildApp();
  // Clean up any leftover test user from a previous failed run
  await User.deleteOne({ username: TEST_USER.username });
});

afterAll(async () => {
  await User.deleteOne({ username: TEST_USER.username });
  await closeApp();
});

// ─── Registration ───────────────────────────────────────────────────────────

describe('POST /register', () => {
  it('creates a new user and returns a JWT token', async () => {
    const res = await request(app).post('/register').send(TEST_USER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');

    // Verify the JWT has 3 parts (header.payload.signature)
    const parts = res.body.token.split('.');
    expect(parts).toHaveLength(3);

    // Verify the payload contains the correct username
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    expect(payload.username).toBe(TEST_USER.username);
    expect(payload.email).toBe(TEST_USER.email);
    expect(payload).toHaveProperty('exp');
  });

  it('stores the password as a hash — never plain text', async () => {
    const user = await User.findOne({ username: TEST_USER.username });
    expect(user).not.toBeNull();
    expect(user.hash).not.toBe(TEST_USER.password);
    expect(user.salt).toBeDefined();
    expect(user.hash.length).toBeGreaterThan(0);
  });

  it('rejects registration with missing fields', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'incomplete_user' }); // no email or password

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('rejects duplicate username', async () => {
    const res = await request(app).post('/register').send(TEST_USER);

    // MongoDB duplicate key error should surface as a non-200
    expect(res.status).not.toBe(200);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe('POST /login', () => {
  it('returns a JWT token with valid credentials', async () => {
    const res = await request(app).post('/login').send({
      username: TEST_USER.username,
      password: TEST_USER.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    const payload = JSON.parse(
      Buffer.from(res.body.token.split('.')[1], 'base64').toString()
    );
    expect(payload.username).toBe(TEST_USER.username);
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/login').send({
      username: TEST_USER.username,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });

  it('rejects login with unknown username', async () => {
    const res = await request(app).post('/login').send({
      username: 'nobody',
      password: 'whatever',
    });

    expect(res.status).toBe(401);
  });

  it('rejects login with missing fields', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: TEST_USER.username }); // no password

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

// ─── Password hashing correctness ────────────────────────────────────────────

describe('Password hashing (pbkdf2 regression)', () => {
  it('correctly validates a password using sha512 digest', () => {
    const user = new User();
    user.setPassword('mySecurePassword');

    expect(user.validPassword('mySecurePassword')).toBe(true);
    expect(user.validPassword('wrongPassword')).toBe(false);
  });

  it('produces a different hash for the same password with a different salt', () => {
    const user1 = new User();
    const user2 = new User();
    user1.setPassword('samePassword');
    user2.setPassword('samePassword');

    expect(user1.hash).not.toBe(user2.hash);
    expect(user1.salt).not.toBe(user2.salt);
  });
});
