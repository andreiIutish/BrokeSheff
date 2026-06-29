const jwt = require('jsonwebtoken');

/**
 * verifyToken – Express middleware that validates the Bearer JWT in the
 * Authorization header and attaches the decoded payload to req.user.
 *
 * Usage: add `verifyToken` before any route handler that requires auth.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp, ... }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };
