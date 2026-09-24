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

module.exports = { protect };
