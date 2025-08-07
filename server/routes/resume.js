const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const { Job } = require('../models/Job');
const ResumeParser = require('../services/resumeParser');
const router = express.Router();

// Initialize resume parser
const resumeParser = new ResumeParser();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload and parse resume
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or invalid file type'
      });
    }

    const filePath = req.file.path;
    
    // Parse the resume
    const parsedData = await resumeParser.parseResume(filePath);
    
    // Update user's resume data
    const user = await User.findById(req.user._id);
    
    // Remove old resume file if exists
    if (user.resume.path && fs.existsSync(user.resume.path)) {
      fs.unlinkSync(user.resume.path);
    }

    user.resume = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: filePath,
      uploadDate: new Date(),
      parsedData
    };

    // Update profile skills if not already set
    if (!user.profile.skills || user.profile.skills.length === 0) {
      user.profile.skills = parsedData.skills;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      resume: {
        filename: user.resume.filename,
        originalName: user.resume.originalName,
        uploadDate: user.resume.uploadDate,
        parsedData: user.resume.parsedData
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading and parsing resume'
    });
  }
});

// Get user's current resume
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('resume');
    
    if (!user.resume.filename) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    res.json({
      success: true,
      resume: {
        filename: user.resume.filename,
        originalName: user.resume.originalName,
        uploadDate: user.resume.uploadDate,
        parsedData: user.resume.parsedData
      }
    });
  } catch (error) {
    console.error('Resume fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resume'
    });
  }
});

// Download resume file
router.get('/download', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('resume');
    
    if (!user.resume.filename || !user.resume.path) {
      return res.status(404).json({
        success: false,
        message: 'No resume file found'
      });
    }

    if (!fs.existsSync(user.resume.path)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server'
      });
    }

    res.download(user.resume.path, user.resume.originalName);
  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading resume'
    });
  }
});

// Analyze resume against a job description
router.post('/analyze/:jobId', authenticateToken, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const user = await User.findById(req.user._id).select('resume');
    
    if (!user.resume.parsedData) {
      return res.status(400).json({
        success: false,
        message: 'No resume uploaded or parsed'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Calculate match score
    const matchScore = resumeParser.calculateMatchScore(
      user.resume.parsedData,
      job.description + ' ' + job.requirements.join(' ')
    );

    // Generate suggestions
    const suggestions = resumeParser.generateSuggestions(
      user.resume.parsedData,
      job.description + ' ' + job.requirements.join(' ')
    );

    // Find matching and missing skills
    const jobSkills = resumeParser.extractSkills(job.description);
    const resumeSkills = user.resume.parsedData.skills || [];
    
    const matchingSkills = resumeSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase() === skill.toLowerCase()
      )
    );

    const missingSkills = jobSkills.filter(skill => 
      !resumeSkills.some(resumeSkill => 
        resumeSkill.toLowerCase() === skill.toLowerCase()
      )
    );

    res.json({
      success: true,
      analysis: {
        matchScore,
        matchingSkills,
        missingSkills: missingSkills.slice(0, 10),
        suggestions,
        jobTitle: job.title,
        company: job.company
      }
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing resume'
    });
  }
});

// Get resume match scores for multiple jobs
router.post('/batch-analyze', authenticateToken, [
  body('jobIds').isArray().withMessage('Job IDs must be an array'),
  body('jobIds.*').isMongoId().withMessage('Invalid job ID format')
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

    const { jobIds } = req.body;
    const user = await User.findById(req.user._id).select('resume');
    
    if (!user.resume.parsedData) {
      return res.status(400).json({
        success: false,
        message: 'No resume uploaded or parsed'
      });
    }

    const jobs = await Job.find({ _id: { $in: jobIds } })
      .select('title company description requirements skills');

    const analyses = jobs.map(job => {
      const matchScore = resumeParser.calculateMatchScore(
        user.resume.parsedData,
        job.description + ' ' + job.requirements.join(' ')
      );

      return {
        jobId: job._id,
        title: job.title,
        company: job.company,
        matchScore
      };
    });

    // Sort by match score (highest first)
    analyses.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      analyses
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing batch analysis'
    });
  }
});

// Update parsed resume data manually
router.put('/update-parsed-data', authenticateToken, [
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('summary').optional().isString().withMessage('Summary must be a string'),
  body('experience').optional().isArray().withMessage('Experience must be an array'),
  body('education').optional().isArray().withMessage('Education must be an array')
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

    const user = await User.findById(req.user._id);
    
    if (!user.resume.parsedData) {
      return res.status(400).json({
        success: false,
        message: 'No resume data to update'
      });
    }

    const updates = req.body;
    
    // Update parsed data fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user.resume.parsedData[key] = updates[key];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Resume data updated successfully',
      parsedData: user.resume.parsedData
    });
  } catch (error) {
    console.error('Resume update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resume data'
    });
  }
});

// Delete resume
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.resume.filename) {
      return res.status(404).json({
        success: false,
        message: 'No resume to delete'
      });
    }

    // Delete file from filesystem
    if (user.resume.path && fs.existsSync(user.resume.path)) {
      fs.unlinkSync(user.resume.path);
    }

    // Clear resume data from user
    user.resume = {
      filename: null,
      originalName: null,
      path: null,
      uploadDate: null,
      parsedData: {}
    };

    await user.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Resume deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resume'
    });
  }
});

// Get resume statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('resume');
    
    if (!user.resume.parsedData) {
      return res.status(400).json({
        success: false,
        message: 'No resume data available'
      });
    }

    const stats = {
      skillsCount: user.resume.parsedData.skills?.length || 0,
      experienceCount: user.resume.parsedData.experience?.length || 0,
      educationCount: user.resume.parsedData.education?.length || 0,
      projectsCount: user.resume.parsedData.projects?.length || 0,
      hasSummary: !!(user.resume.parsedData.summary && user.resume.parsedData.summary.length > 0),
      hasContact: !!(user.resume.parsedData.contact && Object.keys(user.resume.parsedData.contact).length > 0),
      uploadDate: user.resume.uploadDate,
      originalName: user.resume.originalName
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Resume stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resume statistics'
    });
  }
});

module.exports = router;