const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'it_club_default_access_secret_2024';
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'it_club_default_refresh_secret_2024';
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET || 'it_club_default_access_secret_2024';
  return jwt.verify(token, secret);
};

const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'it_club_default_refresh_secret_2024';
  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
