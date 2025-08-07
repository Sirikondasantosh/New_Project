const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Job, JobApplication } = require('../models/Job');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const JobScraper = require('../services/jobScraper');
const router = express.Router();

// Initialize job scraper
const jobScraper = new JobScraper();

// Get all jobs with filters and pagination
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('location').optional().trim(),
  query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
  query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead', 'executive']),
  query('remote').optional().isBoolean(),
  query('skills').optional().trim(),
  query('sortBy').optional().isIn(['postedDate', 'title', 'company', 'matchScore']),
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
      location,
      jobType,
      experienceLevel,
      remote,
      skills,
      sortBy = 'postedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    if (remote === 'true') {
      query.remote = true;
    }

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await Job.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // If user is authenticated, check which jobs they've applied to
    let appliedJobIds = [];
    if (req.user) {
      const applications = await JobApplication.find({ userId: req.user._id })
        .select('jobId')
        .lean();
      appliedJobIds = applications.map(app => app.jobId.toString());
    }

    // Add applied status to jobs
    const jobsWithStatus = jobs.map(job => ({
      ...job.toObject(),
      hasApplied: appliedJobIds.includes(job._id.toString())
    }));

    res.json({
      success: true,
      jobs: jobsWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalJobs: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching jobs'
    });
  }
});

// Get job by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user has applied to this job
    let hasApplied = false;
    if (req.user) {
      const application = await JobApplication.findOne({
        userId: req.user._id,
        jobId: job._id
      });
      hasApplied = !!application;
    }

    res.json({
      success: true,
      job: {
        ...job.toObject(),
        hasApplied
      }
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching job'
    });
  }
});

// Scrape jobs from external sources
router.post('/scrape', authenticateToken, [
  body('searchTerm').notEmpty().trim().withMessage('Search term is required'),
  body('location').optional().trim(),
  body('sources').optional().isArray().withMessage('Sources must be an array'),
  body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    // Only allow admins to scrape jobs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const {
      searchTerm,
      location = 'Remote',
      sources = ['indeed'],
      limit = 10
    } = req.body;

    const jobs = await jobScraper.scrapeJobs(searchTerm, location, {
      sources,
      limit,
      saveToDatabase: true
    });

    res.json({
      success: true,
      message: `Successfully scraped ${jobs.length} jobs`,
      jobs: jobs.slice(0, 5) // Return first 5 jobs as preview
    });
  } catch (error) {
    console.error('Job scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error scraping jobs'
    });
  }
});

// Search jobs with advanced filters
router.post('/search', optionalAuth, [
  body('query').optional().trim(),
  body('filters').optional().isObject(),
  body('page').optional().isInt({ min: 1 }),
  body('limit').optional().isInt({ min: 1, max: 100 })
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
      query: searchQuery,
      filters = {},
      page = 1,
      limit = 20
    } = req.body;

    // Build MongoDB query
    const dbQuery = { isActive: true };

    if (searchQuery) {
      dbQuery.$or = [
        { $text: { $search: searchQuery } },
        { title: { $regex: searchQuery, $options: 'i' } },
        { company: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Apply filters
    if (filters.location) {
      dbQuery.location = { $regex: filters.location, $options: 'i' };
    }

    if (filters.jobType && filters.jobType.length > 0) {
      dbQuery.jobType = { $in: filters.jobType };
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      dbQuery.experienceLevel = { $in: filters.experienceLevel };
    }

    if (filters.remote === true) {
      dbQuery.remote = true;
    }

    if (filters.skills && filters.skills.length > 0) {
      dbQuery.skills = { $in: filters.skills };
    }

    if (filters.salaryRange) {
      if (filters.salaryRange.min) {
        dbQuery['salary.min'] = { $gte: filters.salaryRange.min };
      }
      if (filters.salaryRange.max) {
        dbQuery['salary.max'] = { $lte: filters.salaryRange.max };
      }
    }

    if (filters.companies && filters.companies.length > 0) {
      dbQuery.company = { $in: filters.companies };
    }

    // Execute search
    const skip = (page - 1) * limit;
    const jobs = await Job.find(dbQuery)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Job.countDocuments(dbQuery);

    // Check applied status if user is authenticated
    let appliedJobIds = [];
    if (req.user) {
      const applications = await JobApplication.find({ userId: req.user._id })
        .select('jobId')
        .lean();
      appliedJobIds = applications.map(app => app.jobId.toString());
    }

    const jobsWithStatus = jobs.map(job => ({
      ...job.toObject(),
      hasApplied: appliedJobIds.includes(job._id.toString())
    }));

    res.json({
      success: true,
      jobs: jobsWithStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      searchQuery,
      filters
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error performing search'
    });
  }
});

// Get job statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          remoteJobs: {
            $sum: { $cond: [{ $eq: ['$remote', true] }, 1, 0] }
          },
          avgSalaryMin: { $avg: '$salary.min' },
          avgSalaryMax: { $avg: '$salary.max' }
        }
      }
    ]);

    const jobsByType = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } }
    ]);

    const jobsByExperience = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$experienceLevel', count: { $sum: 1 } } }
    ]);

    const topSkills = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topCompanies = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        overview: stats[0] || { totalJobs: 0, remoteJobs: 0, avgSalaryMin: 0, avgSalaryMax: 0 },
        jobsByType,
        jobsByExperience,
        topSkills,
        topCompanies
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

module.exports = router;