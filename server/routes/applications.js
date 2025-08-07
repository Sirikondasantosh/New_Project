const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Job, JobApplication } = require('../models/Job');
const User = require('../models/User');
const { authenticateToken, checkSubscriptionLimits } = require('../middleware/auth');
const router = express.Router();

// Apply to a job
router.post('/apply', authenticateToken, checkSubscriptionLimits, [
  body('jobId').isMongoId().withMessage('Invalid job ID'),
  body('coverLetter').optional().trim(),
  body('notes').optional().trim()
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

    const { jobId, coverLetter, notes } = req.body;
    const userId = req.user._id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({ userId, jobId });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Get user's resume info
    const user = await User.findById(userId);
    const resumeUsed = user.resume.filename ? {
      filename: user.resume.filename,
      path: user.resume.path
    } : null;

    // Calculate match score if resume is available
    let matchScore = null;
    if (user.resume.parsedData && user.resume.parsedData.skills) {
      const ResumeParser = require('../services/resumeParser');
      const resumeParser = new ResumeParser();
      matchScore = resumeParser.calculateMatchScore(
        user.resume.parsedData,
        job.description + ' ' + job.requirements.join(' ')
      );
    }

    // Create application
    const application = new JobApplication({
      userId,
      jobId,
      coverLetter,
      notes,
      resumeUsed,
      matchScore,
      appliedDate: new Date()
    });

    await application.save();

    // Update user's application statistics
    user.incrementDailyApplications();
    await user.save();

    // Update job application count
    job.applicationCount = (job.applicationCount || 0) + 1;
    await job.save();

    // Populate job details for response
    await application.populate('jobId', 'title company location salary jobType');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application._id,
        job: application.jobId,
        status: application.status,
        appliedDate: application.appliedDate,
        matchScore: application.matchScore,
        coverLetter: application.coverLetter
      }
    });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application'
    });
  }
});

// Get user's applications
router.get('/my-applications', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['applied', 'viewed', 'interview', 'rejected', 'offer', 'accepted']),
  query('sortBy').optional().isIn(['appliedDate', 'status', 'matchScore']),
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
      status,
      sortBy = 'appliedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const applications = await JobApplication.find(query)
      .populate('jobId', 'title company location salary jobType remote source')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await JobApplication.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalApplications: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

// Get application by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('jobId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Application fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application'
    });
  }
});

// Update application status
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['applied', 'viewed', 'interview', 'rejected', 'offer', 'accepted']).withMessage('Invalid status'),
  body('notes').optional().trim()
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

    const { status, notes } = req.body;
    
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    if (notes) {
      application.notes = notes;
    }

    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Application update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application'
    });
  }
});

// Add interview details
router.put('/:id/interview', authenticateToken, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type').isIn(['phone', 'video', 'in-person', 'technical']).withMessage('Invalid interview type'),
  body('notes').optional().trim()
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

    const { date, type, notes } = req.body;
    
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.interviewDates.push({
      date: new Date(date),
      type,
      notes
    });

    // Update status to interview if not already
    if (application.status === 'applied' || application.status === 'viewed') {
      application.status = 'interview';
    }

    await application.save();

    res.json({
      success: true,
      message: 'Interview details added successfully',
      application
    });
  } catch (error) {
    console.error('Interview update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding interview details'
    });
  }
});

// Add follow-up date
router.put('/:id/follow-up', authenticateToken, [
  body('date').isISO8601().withMessage('Valid date is required')
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

    const { date } = req.body;
    
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.followUpDates.push(new Date(date));
    await application.save();

    res.json({
      success: true,
      message: 'Follow-up date added successfully',
      application
    });
  } catch (error) {
    console.error('Follow-up update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding follow-up date'
    });
  }
});

// Update salary information
router.put('/:id/salary', authenticateToken, [
  body('offered').optional().isNumeric().withMessage('Offered salary must be a number'),
  body('negotiated').optional().isNumeric().withMessage('Negotiated salary must be a number'),
  body('final').optional().isNumeric().withMessage('Final salary must be a number')
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

    const { offered, negotiated, final } = req.body;
    
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (offered !== undefined) application.salary.offered = offered;
    if (negotiated !== undefined) application.salary.negotiated = negotiated;
    if (final !== undefined) application.salary.final = final;

    await application.save();

    res.json({
      success: true,
      message: 'Salary information updated successfully',
      application
    });
  } catch (error) {
    console.error('Salary update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating salary information'
    });
  }
});

// Delete application
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const application = await JobApplication.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update job application count
    await Job.findByIdAndUpdate(application.jobId, {
      $inc: { applicationCount: -1 }
    });

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Application deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application'
    });
  }
});

// Get application statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get overall stats
    const totalApplications = await JobApplication.countDocuments({ userId });
    
    // Get applications by status
    const statusStats = await JobApplication.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get applications by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await JobApplication.aggregate([
      { $match: { userId, appliedDate: { $gte: sixMonthsAgo } } },
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

    // Get applications with match scores
    const matchScoreStats = await JobApplication.aggregate([
      { $match: { userId, matchScore: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgMatchScore: { $avg: '$matchScore' },
          maxMatchScore: { $max: '$matchScore' },
          minMatchScore: { $min: '$matchScore' }
        }
      }
    ]);

    // Get recent applications
    const recentApplications = await JobApplication.find({ userId })
      .populate('jobId', 'title company')
      .sort({ appliedDate: -1 })
      .limit(5)
      .select('status appliedDate matchScore jobId');

    res.json({
      success: true,
      stats: {
        totalApplications,
        statusBreakdown: statusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        monthlyApplications: monthlyStats,
        matchScoreStats: matchScoreStats[0] || { avgMatchScore: 0, maxMatchScore: 0, minMatchScore: 0 },
        recentApplications
      }
    });
  } catch (error) {
    console.error('Application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics'
    });
  }
});

// Get applications that need follow-up
router.get('/follow-ups/pending', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const applications = await JobApplication.find({
      userId: req.user._id,
      status: { $in: ['applied', 'viewed', 'interview'] },
      followUpDates: {
        $elemMatch: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next 24 hours
        }
      }
    })
    .populate('jobId', 'title company')
    .sort({ appliedDate: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Follow-ups fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending follow-ups'
    });
  }
});

// Bulk update application statuses
router.put('/bulk/status', authenticateToken, [
  body('applicationIds').isArray().withMessage('Application IDs must be an array'),
  body('applicationIds.*').isMongoId().withMessage('Invalid application ID'),
  body('status').isIn(['applied', 'viewed', 'interview', 'rejected', 'offer', 'accepted']).withMessage('Invalid status')
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

    const { applicationIds, status } = req.body;

    const result = await JobApplication.updateMany(
      {
        _id: { $in: applicationIds },
        userId: req.user._id
      },
      { status }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} applications`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating applications'
    });
  }
});

module.exports = router;