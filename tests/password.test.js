const request = require('supertest');
const { buildApp, closeApp } = require('./helpers/app.helper');
const User = require('../models/users');

const TEST_USER = {
  username: 'password_test_user',
  email: 'password_test@themoviesstop.test',
  password: 'OldPass123!',
};

let app;
let token;

beforeAll(async () => {
  app = await buildApp();
  await User.deleteOne({ username: TEST_USER.username });

  const res = await request(app).post('/register').send(TEST_USER);
  token = res.body.token;
});

afterAll(async () => {
  await User.deleteOne({ username: TEST_USER.username });
  await closeApp();
});

// ─── Change password ─────────────────────────────────────────────────────────

describe('POST /user/change-password', () => {
  it('rejects without an auth token', async () => {
    const res = await request(app)
      .post('/user/change-password')
      .send({ currentPassword: TEST_USER.password, newPassword: 'NewPass123!' });
    expect(res.status).toBe(401);
  });

  it('rejects when fields are missing', async () => {
    const res = await request(app)
      .post('/user/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_USER.password }); // no newPassword
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('rejects a new password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/user/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_USER.password, newPassword: '123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/);
  });

  it('rejects when the current password is wrong', async () => {
    const res = await request(app)
      .post('/user/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'NewPass123!' });
    expect(res.status).toBe(401);
  });

  it('changes the password and returns a new JWT', async () => {
    const res = await request(app)
      .post('/user/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_USER.password, newPassword: 'NewPass123!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    token = res.body.token;
    TEST_USER.password = 'NewPass123!';
  });

  it('old password no longer works for login', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: TEST_USER.username, password: 'OldPass123!' });
    expect(res.status).toBe(401);
  });

  it('new password works for login', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: TEST_USER.username, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

// ─── Forgot password ─────────────────────────────────────────────────────────

describe('POST /forgot-password', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/forgot-password').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns success for an unregistered email (no leaking)', async () => {
    const res = await request(app)
      .post('/forgot-password')
      .send({ email: 'nobody@nowhere.test' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If that email/);
  });

  it('returns success for a real email and sets a passcode in the DB', async () => {
    const res = await request(app)
      .post('/forgot-password')
      .send({ email: TEST_USER.email });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If that email/);

    const user = await User.findOne({ email: TEST_USER.email });
    expect(user.resetPasscode).toBeDefined();
    expect(user.resetPasscode).not.toBeNull();
    expect(user.resetPasscodeExpiry).not.toBeNull();
    expect(new Date(user.resetPasscodeExpiry) > new Date()).toBe(true);
  });
});

// ─── Reset password ──────────────────────────────────────────────────────────

describe('POST /reset-password', () => {
  it('rejects when required fields are missing', async () => {
    const res = await request(app)
      .post('/reset-password')
      .send({ email: TEST_USER.email }); // no passcode or newPassword
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('rejects a new password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/reset-password')
      .send({ email: TEST_USER.email, passcode: '123456', newPassword: '12' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/);
  });

  it('rejects an expired passcode', async () => {
    await User.updateOne(
      { email: TEST_USER.email },
      { resetPasscode: '999999', resetPasscodeExpiry: new Date(Date.now() - 1000) }
    );

    const res = await request(app)
      .post('/reset-password')
      .send({ email: TEST_USER.email, passcode: '999999', newPassword: 'AnotherPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/);
  });

  it('rejects an incorrect passcode', async () => {
    await User.updateOne(
      { email: TEST_USER.email },
      { resetPasscode: '111111', resetPasscodeExpiry: new Date(Date.now() + 60 * 60 * 1000) }
    );

    const res = await request(app)
      .post('/reset-password')
      .send({ email: TEST_USER.email, passcode: '000000', newPassword: 'AnotherPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid or expired/);
  });

  it('resets the password with a valid passcode and returns a JWT', async () => {
    await User.updateOne(
      { email: TEST_USER.email },
      { resetPasscode: '222222', resetPasscodeExpiry: new Date(Date.now() + 60 * 60 * 1000) }
    );

    const res = await request(app)
      .post('/reset-password')
      .send({ email: TEST_USER.email, passcode: '222222', newPassword: 'ResetPass123!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    const user = await User.findOne({ email: TEST_USER.email });
    expect(user.resetPasscode).toBeNull();
    expect(user.resetPasscodeExpiry).toBeNull();

    token = res.body.token;
    TEST_USER.password = 'ResetPass123!';
  });

  it('new password works for login after reset', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: TEST_USER.username, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
