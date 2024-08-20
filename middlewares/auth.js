/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const AuthError = require('./errors/AuthError');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.auth = (req, res, next) => {
  if (!req.cookies.jwt) {
    next(new AuthError('Необходима авторизация'));
  } else {
    const token = req.cookies.jwt;
    let payload;

    try {
      payload = jwt.verify(token, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');
    } catch (err) {
      next(new AuthError('Необходима авторизация'));
    }

    req.user = payload;

    next();
  }
};
