const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  skills: [String],
  location: {
    type: String,
    required: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hour', 'month', 'year'],
      default: 'year'
    }
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
    default: 'full-time'
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    default: 'mid'
  },
  source: {
    portal: {
      type: String,
      required: true,
      enum: ['linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 'custom']
    },
    url: String,
    jobId: String
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  companyInfo: {
    size: String,
    industry: String,
    website: String,
    logo: String
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  matchScore: Number, // For resume matching
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ 'source.portal': 1 });
jobSchema.index({ postedDate: -1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ jobType: 1 });

// Compound indexes
jobSchema.index({ isActive: 1, postedDate: -1 });
jobSchema.index({ location: 1, isActive: 1 });

const Job = mongoose.model('Job', jobSchema);

// Job Application Schema
const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'viewed', 'interview', 'rejected', 'offer', 'accepted'],
    default: 'applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  coverLetter: String,
  notes: String,
  resumeUsed: {
    filename: String,
    path: String
  },
  matchScore: Number, // How well the user's profile matches the job
  applicationMethod: {
    type: String,
    enum: ['direct', 'portal', 'email'],
    default: 'portal'
  },
  followUpDates: [Date],
  interviewDates: [{
    date: Date,
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical']
    },
    notes: String
  }],
  feedback: String,
  salary: {
    offered: Number,
    negotiated: Number,
    final: Number
  }
}, {
  timestamps: true
});

// Indexes for job applications
jobApplicationSchema.index({ userId: 1 });
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedDate: -1 });
jobApplicationSchema.index({ userId: 1, appliedDate: -1 });

// Compound unique index to prevent duplicate applications
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = {
  Job,
  JobApplication
};