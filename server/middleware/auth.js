// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Authenticate middleware
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user ID to request
    req.userId = decoded.userId;
    
    // Check if user is admin (optional)
    const user = await User.findById(decoded.userId);
    req.isAdmin = user && user.isAdmin === true;
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    return res.status(500).json({ error: err.message });
  }
};

// Admin only middleware (must be used after authenticate)
exports.adminOnly = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
