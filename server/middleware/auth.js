const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
};

// Check subscription limits
const checkSubscriptionLimits = async (req, res, next) => {
  try {
    const user = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's application count
    const todayEntry = user.applicationStats.dailyApplications.find(
      entry => entry.date.toDateString() === today.toDateString()
    );
    const todayCount = todayEntry ? todayEntry.count : 0;

    // Define limits based on subscription plan
    const limits = {
      free: 5,
      basic: 25,
      premium: 100
    };

    const userLimit = limits[user.subscription.plan] || limits.free;

    if (todayCount >= userLimit) {
      return res.status(429).json({
        success: false,
        message: `Daily application limit reached (${userLimit}). Please upgrade your subscription.`,
        currentCount: todayCount,
        limit: userLimit,
        plan: user.subscription.plan
      });
    }

    req.dailyCount = todayCount;
    req.dailyLimit = userLimit;
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking subscription limits' 
    });
  }
};

// Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  checkSubscriptionLimits,
  optionalAuth
};