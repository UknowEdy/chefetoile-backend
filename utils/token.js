const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chefetoile_jwt_secret_dev_2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
const rawCookieName = process.env.SESSION_COOKIE_NAME || 'chefetoile_session';
// Nom de cookie valide : lettres/chiffres/_-. Sinon fallback.
const SESSION_COOKIE_NAME = /^[A-Za-z0-9_.-]+$/.test(rawCookieName)
  ? rawCookieName
  : 'chefetoile_session';

const isSecureCookie = () =>
  process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

exports.generateAccessToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

exports.attachSessionCookie = (res, token) => {
  if (process.env.SESSION_COOKIE_DISABLED === 'true') return;

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  });
};

exports.SESSION_COOKIE_NAME = SESSION_COOKIE_NAME;
