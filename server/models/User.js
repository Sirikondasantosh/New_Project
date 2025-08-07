const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    phone: String,
    location: String,
    bio: String,
    skills: [String],
    experience: String,
    education: String,
    linkedinUrl: String,
    githubUrl: String,
    portfolioUrl: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'inactive'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  applicationStats: {
    totalApplications: {
      type: Number,
      default: 0
    },
    dailyApplications: [{
      date: {
        type: Date,
        default: Date.now
      },
      count: {
        type: Number,
        default: 0
      }
    }],
    monthlyApplications: [{
      month: String,
      year: Number,
      count: Number
    }]
  },
  resume: {
    filename: String,
    originalName: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    parsedData: {
      skills: [String],
      experience: [String],
      education: [String],
      summary: String
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update daily application count
userSchema.methods.incrementDailyApplications = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEntry = this.applicationStats.dailyApplications.find(
    entry => entry.date.toDateString() === today.toDateString()
  );
  
  if (todayEntry) {
    todayEntry.count += 1;
  } else {
    this.applicationStats.dailyApplications.push({
      date: today,
      count: 1
    });
  }
  
  this.applicationStats.totalApplications += 1;
  
  // Keep only last 30 days
  this.applicationStats.dailyApplications = this.applicationStats.dailyApplications
    .filter(entry => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return entry.date >= thirtyDaysAgo;
    })
    .sort((a, b) => b.date - a.date);
};

module.exports = mongoose.model('User', userSchema);