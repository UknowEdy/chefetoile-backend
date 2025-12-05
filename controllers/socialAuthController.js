const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Issuer, generators } = require('openid-client');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generateAccessToken, attachSessionCookie } = require('../utils/token');

const SECURE_COOKIE = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const FRONTEND_CALLBACK_PATH = process.env.FRONTEND_AUTH_CALLBACK || '/auth/callback';
const BACKEND_BASE_URL = (
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.PORT || process.env.RAILWAY_PORT || 8080}`
).replace(/\/$/, '');

const cookieConfig = {
  httpOnly: true,
  secure: SECURE_COOKIE,
  sameSite: 'lax',
  signed: Boolean(process.env.COOKIE_SECRET),
  maxAge: 10 * 60 * 1000, // 10 min
};

const setFlowCookie = (res, provider, payload) => {
  res.cookie(`oauth_${provider}`, JSON.stringify(payload), cookieConfig);
};

const readFlowCookie = (req, provider) => {
  const source = process.env.COOKIE_SECRET ? req.signedCookies : req.cookies;
  const raw = source?.[`oauth_${provider}`];
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    logger.error('Impossible de parser le cookie OAuth', { provider, error: error.message });
    return null;
  }
};

const clearFlowCookie = (res, provider) => {
  res.clearCookie(`oauth_${provider}`, { ...cookieConfig, maxAge: 0 });
};

const getRedirectUri = (provider) => {
  const envKey = `${provider.toUpperCase()}_REDIRECT_URI`;
  return (process.env[envKey] || `${BACKEND_BASE_URL}/auth/${provider}/callback`).replace(/\/$/, '');
};

const buildSuccessRedirect = (token, provider, isNewUser) =>
  `${FRONTEND_URL}${FRONTEND_CALLBACK_PATH}?token=${encodeURIComponent(token)}&provider=${provider}&newUser=${
    isNewUser ? '1' : '0'
  }`;

const buildErrorRedirect = (message, provider) =>
  `${FRONTEND_URL}${FRONTEND_CALLBACK_PATH}?error=${encodeURIComponent(message)}${provider ? `&provider=${provider}` : ''}`;

const splitName = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return { prenom: 'Utilisateur', nom: '' };
  return {
    prenom: parts[0],
    nom: parts.slice(1).join(' '),
  };
};

const upsertOAuthUser = async ({ provider, providerId, email, name, picture }) => {
  const loweredEmail = (email || '').toLowerCase();
  const emailToSave = loweredEmail || `${providerId || crypto.randomBytes(6).toString('hex')}@${provider}.oauth`;

  const query = [
    loweredEmail ? { email: loweredEmail } : null,
    providerId ? { [`${provider}Id`]: providerId } : null,
  ].filter(Boolean);

  const user = query.length ? await User.findOne({ $or: query }) : null;

  const isNew = !user;
  const displayName = name || `${provider} user`.replace(/^([a-z])/, (m) => m.toUpperCase());
  const { prenom, nom } = splitName(displayName);

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const created = new User({
      email: emailToSave,
      name: displayName,
      prenom,
      nom,
      picture,
      role: 'CLIENT',
      provider,
      statut: 'ACTIVE',
      password: randomPassword,
      googleId: provider === 'google' ? providerId : undefined,
      facebookId: provider === 'facebook' ? providerId : undefined,
      appleId: provider === 'apple' ? providerId : undefined,
      githubId: provider === 'github' ? providerId : undefined,
    });
    await created.save();
    return { user: created, isNew };
  }

  if (!user.provider) user.provider = provider;
  if (providerId && !user[`${provider}Id`]) user[`${provider}Id`] = providerId;
  if (!user.name && displayName) user.name = displayName;
  if (!user.prenom && prenom) user.prenom = prenom;
  if (!user.nom && nom) user.nom = nom;
  if (picture && !user.picture) user.picture = picture;
  await user.save();

  return { user, isNew };
};

let googleClient;
const getGoogleClient = async () => {
  if (googleClient) return googleClient;
  const googleIssuer = await Issuer.discover('https://accounts.google.com');
  googleClient = new googleIssuer.Client({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [getRedirectUri('google')],
    response_types: ['code'],
  });
  return googleClient;
};

const generateAppleClientSecret = () => {
  const privateKey = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: process.env.APPLE_TEAM_ID,
      iat: now,
      exp: now + 60 * 60 * 6, // 6h
      aud: 'https://appleid.apple.com',
      sub: process.env.APPLE_CLIENT_ID,
    },
    privateKey,
    {
      algorithm: 'ES256',
      keyid: process.env.APPLE_KEY_ID,
    }
  );
};

const getAppleClient = async () => {
  const appleIssuer = await Issuer.discover('https://appleid.apple.com');
  return new appleIssuer.Client({
    client_id: process.env.APPLE_CLIENT_ID,
    client_secret: generateAppleClientSecret(),
    redirect_uris: [getRedirectUri('apple')],
    response_types: ['code'],
  });
};

exports.startGoogle = async (req, res) => {
  try {
    const client = await getGoogleClient();
    const state = generators.state();
    const nonce = generators.nonce();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    setFlowCookie(res, 'google', { state, nonce, codeVerifier, createdAt: Date.now() });

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
      access_type: 'offline',
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      redirect_uri: getRedirectUri('google'),
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    logger.error('Erreur start Google OAuth', { error: error.message });
    return res.redirect(buildErrorRedirect('OAuth Google indisponible', 'google'));
  }
};

exports.googleCallback = async (req, res) => {
  const stored = readFlowCookie(req, 'google');
  clearFlowCookie(res, 'google');

  if (!stored || stored.state !== req.query.state) {
    return res.redirect(buildErrorRedirect('State invalide ou expiré', 'google'));
  }

  try {
    const client = await getGoogleClient();
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(getRedirectUri('google'), params, {
      state: stored.state,
      nonce: stored.nonce,
      code_verifier: stored.codeVerifier,
    });

    const claims = tokenSet.claims();
    const { user, isNew } = await upsertOAuthUser({
      provider: 'google',
      providerId: claims.sub,
      email: claims.email,
      name: claims.name || `${claims.given_name || ''} ${claims.family_name || ''}`.trim(),
      picture: claims.picture,
    });

    const token = generateAccessToken(user.id);
    attachSessionCookie(res, token);

    return res.redirect(buildSuccessRedirect(token, 'google', isNew));
  } catch (error) {
    logger.error('Erreur callback Google OAuth', { error: error.message });
    return res.redirect(buildErrorRedirect('Connexion Google impossible', 'google'));
  }
};

exports.startFacebook = async (req, res) => {
  try {
    const state = crypto.randomBytes(24).toString('hex');
    setFlowCookie(res, 'facebook', { state, createdAt: Date.now() });

    const redirectUri = getRedirectUri('facebook');
    const facebookUrl =
      'https://www.facebook.com/v19.0/dialog/oauth?' +
      new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: redirectUri,
        state,
        scope: 'email,public_profile',
        auth_type: 'rerequest',
      }).toString();

    return res.redirect(facebookUrl);
  } catch (error) {
    logger.error('Erreur start Facebook OAuth', { error: error.message });
    return res.redirect(buildErrorRedirect('OAuth Facebook indisponible', 'facebook'));
  }
};

exports.facebookCallback = async (req, res) => {
  const stored = readFlowCookie(req, 'facebook');
  clearFlowCookie(res, 'facebook');

  if (!stored || stored.state !== req.query.state) {
    return res.redirect(buildErrorRedirect('State invalide ou expiré', 'facebook'));
  }

  try {
    const { code } = req.query;
    const redirectUri = getRedirectUri('facebook');
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    const profileResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken,
      },
    });

    const profile = profileResponse.data;
    const picture = profile.picture?.data?.url;

    const { user, isNew } = await upsertOAuthUser({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      picture,
    });

    const token = generateAccessToken(user.id);
    attachSessionCookie(res, token);

    return res.redirect(buildSuccessRedirect(token, 'facebook', isNew));
  } catch (error) {
    logger.error('Erreur callback Facebook OAuth', { error: error.response?.data || error.message });
    return res.redirect(buildErrorRedirect('Connexion Facebook impossible', 'facebook'));
  }
};

exports.startGithub = async (req, res) => {
  try {
    const state = crypto.randomBytes(24).toString('hex');
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    setFlowCookie(res, 'github', { state, codeVerifier, createdAt: Date.now() });

    const redirectUri = getRedirectUri('github');
    const githubUrl =
      'https://github.com/login/oauth/authorize?' +
      new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        state,
        scope: 'read:user user:email',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }).toString();

    return res.redirect(githubUrl);
  } catch (error) {
    logger.error('Erreur start GitHub OAuth', { error: error.message });
    return res.redirect(buildErrorRedirect('OAuth GitHub indisponible', 'github'));
  }
};

exports.githubCallback = async (req, res) => {
  const stored = readFlowCookie(req, 'github');
  clearFlowCookie(res, 'github');

  if (!stored || stored.state !== req.query.state) {
    return res.redirect(buildErrorRedirect('State invalide ou expiré', 'github'));
  }

  try {
    const redirectUri = getRedirectUri('github');
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
        redirect_uri: redirectUri,
        code_verifier: stored.codeVerifier,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'chefetoile-app',
    };

    const profileResponse = await axios.get('https://api.github.com/user', { headers });
    let email = profileResponse.data.email;

    if (!email) {
      const emailsResponse = await axios.get('https://api.github.com/user/emails', { headers });
      const primary = emailsResponse.data.find((item) => item.primary && item.verified);
      email = (primary || emailsResponse.data[0] || {}).email;
    }

    const { user, isNew } = await upsertOAuthUser({
      provider: 'github',
      providerId: profileResponse.data.id?.toString(),
      email,
      name: profileResponse.data.name || profileResponse.data.login,
      picture: profileResponse.data.avatar_url,
    });

    const token = generateAccessToken(user.id);
    attachSessionCookie(res, token);

    return res.redirect(buildSuccessRedirect(token, 'github', isNew));
  } catch (error) {
    logger.error('Erreur callback GitHub OAuth', { error: error.response?.data || error.message });
    return res.redirect(buildErrorRedirect('Connexion GitHub impossible', 'github'));
  }
};

exports.startApple = async (req, res) => {
  try {
    const client = await getAppleClient();
    const state = generators.state();
    const nonce = generators.nonce();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    setFlowCookie(res, 'apple', { state, nonce, codeVerifier, createdAt: Date.now() });

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid email name',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_mode: 'form_post',
      redirect_uri: getRedirectUri('apple'),
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    logger.error('Erreur start Apple OAuth', { error: error.message });
    return res.redirect(buildErrorRedirect('OAuth Apple indisponible', 'apple'));
  }
};

exports.appleCallback = async (req, res) => {
  const stored = readFlowCookie(req, 'apple');
  clearFlowCookie(res, 'apple');

  if (!stored || stored.state !== (req.body?.state || req.query.state)) {
    return res.redirect(buildErrorRedirect('State invalide ou expiré', 'apple'));
  }

  try {
    const client = await getAppleClient();
    const params = client.callbackParams(req);

    const tokenSet = await client.callback(getRedirectUri('apple'), params, {
      state: stored.state,
      nonce: stored.nonce,
      code_verifier: stored.codeVerifier,
    });

    const claims = tokenSet.claims();
    let resolvedName = claims.name || `${claims.given_name || ''} ${claims.family_name || ''}`.trim();

    // Apple renvoie le nom complet une seule fois via le paramètre "user"
    const rawUser = params.user || req.body?.user;
    if (!resolvedName && rawUser) {
      try {
        const parsed = typeof rawUser === 'string' ? JSON.parse(rawUser) : rawUser;
        const userName = parsed?.name || {};
        resolvedName = `${userName.firstName || ''} ${userName.lastName || ''}`.trim();
      } catch (error) {
        logger.warn('Nom Apple non parsé', { error: error.message });
      }
    }

    const { user, isNew } = await upsertOAuthUser({
      provider: 'apple',
      providerId: claims.sub,
      email: claims.email,
      name: resolvedName,
    });

    const token = generateAccessToken(user.id);
    attachSessionCookie(res, token);

    return res.redirect(buildSuccessRedirect(token, 'apple', isNew));
  } catch (error) {
    logger.error('Erreur callback Apple OAuth', { error: error.response?.data || error.message });
    return res.redirect(buildErrorRedirect('Connexion Apple impossible', 'apple'));
  }
};
