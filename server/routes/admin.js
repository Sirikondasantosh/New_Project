const express = require('express');
const { query, body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const { Job, JobApplication } = require('../models/Job');
const JobScraper = require('../services/jobScraper');
const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    const premiumUsers = await User.countDocuments({
      'subscription.plan': { $in: ['basic', 'premium'] },
      'subscription.status': 'active'
    });

    // Job statistics
    const totalJobs = await Job.countDocuments({ isActive: true });
    const totalApplications = await JobApplication.countDocuments();
    
    // Applications in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentApplications = await JobApplication.countDocuments({
      appliedDate: { $gte: thirtyDaysAgo }
    });

    // Revenue statistics (mock for now)
    const monthlyRevenue = await User.aggregate([
      {
        $match: {
          'subscription.plan': { $in: ['basic', 'premium'] },
          'subscription.status': 'active'
        }
      },
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    const revenue = monthlyRevenue.reduce((total, plan) => {
      const price = plan._id === 'basic' ? 9.99 : 19.99;
      return total + (plan.count * price);
    }, 0);

    // Growth statistics
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          premium: premiumUsers,
          growth: lastMonthUsers
        },
        jobs: {
          total: totalJobs,
          applications: totalApplications,
          recentApplications
        },
        revenue: {
          monthly: Math.round(revenue * 100) / 100,
          basic: monthlyRevenue.find(p => p._id === 'basic')?.count || 0,
          premium: monthlyRevenue.find(p => p._id === 'premium')?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// Get all users with pagination and filters
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('role').optional().isIn(['user', 'admin']),
  query('subscriptionPlan').optional().isIn(['free', 'basic', 'premium']),
  query('subscriptionStatus').optional().isIn(['active', 'inactive', 'cancelled']),
  query('sortBy').optional().isIn(['createdAt', 'lastLogin', 'name', 'email']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      role,
      subscriptionPlan,
      subscriptionStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (subscriptionPlan) {
      query['subscription.plan'] = subscriptionPlan;
    }

    if (subscriptionStatus) {
      query['subscription.status'] = subscriptionStatus;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Get user details by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's application statistics
    const applicationStats = await JobApplication.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await JobApplication.countDocuments({ userId: user._id });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        applicationStats: {
          total: totalApplications,
          byStatus: applicationStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('Admin user fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

// Update user role or subscription
router.put('/users/:id', [
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  body('subscription.plan').optional().isIn(['free', 'basic', 'premium']).withMessage('Invalid subscription plan'),
  body('subscription.status').optional().isIn(['active', 'inactive', 'cancelled']).withMessage('Invalid subscription status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const updates = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update role if provided
    if (updates.role) {
      user.role = updates.role;
    }

    // Update subscription if provided
    if (updates.subscription) {
      Object.keys(updates.subscription).forEach(key => {
        if (updates.subscription[key] !== undefined) {
          user.subscription[key] = updates.subscription[key];
        }
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: await User.findById(user._id).select('-password')
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting other admins
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete other admin users'
      });
    }

    // Delete user's applications
    await JobApplication.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Get job management data
router.get('/jobs', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('source').optional().trim(),
  query('isActive').optional().isBoolean(),
  query('sortBy').optional().isIn(['scrapedAt', 'postedDate', 'applicationCount', 'title']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      source,
      isActive,
      sortBy = 'scrapedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (source) {
      query['source.portal'] = source;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await Job.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalJobs: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Admin jobs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
});

// Trigger job scraping
router.post('/jobs/scrape', [
  body('searchTerm').notEmpty().trim().withMessage('Search term is required'),
  body('location').optional().trim(),
  body('sources').optional().isArray().withMessage('Sources must be an array'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      searchTerm,
      location = 'Remote',
      sources = ['indeed'],
      limit = 20
    } = req.body;

    const jobScraper = new JobScraper();
    const jobs = await jobScraper.scrapeJobs(searchTerm, location, {
      sources,
      limit,
      saveToDatabase: true
    });

    res.json({
      success: true,
      message: `Successfully scraped ${jobs.length} jobs`,
      scrapedCount: jobs.length
    });
  } catch (error) {
    console.error('Admin job scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping jobs'
    });
  }
});

// Toggle job active status
router.put('/jobs/:id/toggle-active', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.isActive = !job.isActive;
    await job.save();

    res.json({
      success: true,
      message: `Job ${job.isActive ? 'activated' : 'deactivated'} successfully`,
      job
    });
  } catch (error) {
    console.error('Admin job toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling job status'
    });
  }
});

// Delete job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Delete associated applications
    await JobApplication.deleteMany({ jobId: job._id });

    // Delete job
    await Job.findByIdAndDelete(job._id);

    res.json({
      success: true,
      message: 'Job and associated applications deleted successfully'
    });
  } catch (error) {
    console.error('Admin job deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job'
    });
  }
});

// Get system analytics
router.get('/analytics', async (req, res) => {
  try {
    // User growth over time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Application trends
    const applicationTrends = await JobApplication.aggregate([
      { $match: { appliedDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$appliedDate' },
            month: { $month: '$appliedDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top job sources
    const topSources = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source.portal', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Application success rates
    const successRates = await JobApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Subscription conversion rates
    const conversionRates = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        userGrowth,
        applicationTrends,
        topSources,
        successRates,
        conversionRates
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// Get system logs (simplified version)
router.get('/logs', [
  query('level').optional().isIn(['info', 'warn', 'error']),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
], async (req, res) => {
  try {
    const { level, limit = 100 } = req.query;
    
    // This is a simplified version - in production, you'd integrate with a proper logging system
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'System operational',
        service: 'api'
      },
      {
        timestamp: new Date(Date.now() - 60000),
        level: 'info',
        message: 'Job scraping completed successfully',
        service: 'scraper'
      }
    ];

    const filteredLogs = level ? logs.filter(log => log.level === level) : logs;

    res.json({
      success: true,
      logs: filteredLogs.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs'
    });
  }
});

// System maintenance endpoints
router.post('/maintenance/cleanup-old-jobs', async (req, res) => {
  try {
    const jobScraper = new JobScraper();
    const deletedCount = await jobScraper.cleanupOldJobs();

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old jobs`,
      deletedCount
    });
  } catch (error) {
    console.error('Admin cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up old jobs'
    });
  }
});

module.exports = router;