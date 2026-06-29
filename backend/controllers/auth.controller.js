const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/register
 * Body: { email, password, name }
 */
const register = async (req, res, next) => {
  try {
    // TODO: validate input
    // TODO: check if user already exists in DB
    // TODO: hash password with bcrypt and save user to DB

    res.status(201).json({ success: true, message: 'register – not yet implemented' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    // TODO: find user by email in DB
    // TODO: compare password with bcrypt
    // TODO: sign and return JWT

    res.status(200).json({ success: true, message: 'login – not yet implemented' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me   (requires verifyToken middleware)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by verifyToken middleware
    // TODO: fetch user by req.user.id from DB and return profile

    res.status(200).json({ success: true, message: 'getMe – not yet implemented' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
