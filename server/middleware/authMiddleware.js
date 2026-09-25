const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      token = authHeader.split(' ')[1]?.trim();

      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token format',
        });
      }

      const secret = process.env.JWT_SECRET || 'problempool_jwt_secret_key_2026_secure_local';
      // Verify token
      const decoded = jwt.verify(token, secret);

      // Find user by decoded ID without password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized, no token provided',
  });
};

/**
 * Optional authentication: extracts user if valid token exists,
 * but does not reject unauthenticated requests.
 */
const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1]?.trim();
      if (token && token !== 'null' && token !== 'undefined') {
        const secret = process.env.JWT_SECRET || 'problempool_jwt_secret_key_2026_secure_local';
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      }
    } catch {
      // Ignore token verification errors for public endpoints
      req.user = null;
    }
  }
  return next();
};

module.exports = { protect, optionalProtect };
