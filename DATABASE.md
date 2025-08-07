# JobSeeker Pro - Database Documentation

## 🗄️ Database Overview

JobSeeker Pro uses **MongoDB** as its primary database with **Mongoose ODM** for object modeling and schema management. The database is designed to handle a comprehensive job application system with users, jobs, and application tracking.

## 📋 Database Information

- **Database Name**: `job-application-system`
- **Connection URI**: `mongodb://localhost:27017/job-application-system`
- **ODM**: Mongoose v8.17.1
- **Environment**: Development (configurable via `.env`)

## 📊 Collections & Schema

### 1. Users Collection

**Model**: `User` (models/User.js)

```javascript
{
  name: String,                    // Required, user's full name
  email: String,                   // Required, unique, lowercase
  password: String,                // Required, hashed with bcrypt
  role: String,                    // 'user' or 'admin'
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
    plan: String,                  // 'free', 'basic', 'premium'
    status: String,                // 'active', 'inactive', 'cancelled'
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  applicationStats: {
    totalApplications: Number,
    dailyApplications: [{
      date: Date,
      count: Number
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
    uploadDate: Date,
    parsedData: {
      skills: [String],
      experience: [String],
      education: [String],
      summary: String
    }
  },
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  createdAt: Date,                 // Auto-generated
  updatedAt: Date                  // Auto-generated
}
```

**Indexes**:
- `email: 1` (unique)
- `subscription.plan: 1`
- `role: 1`

### 2. Jobs Collection

**Model**: `Job` (models/Job.js)

```javascript
{
  title: String,                   // Required, job title
  company: String,                 // Required, company name
  description: String,             // Required, job description
  requirements: [String],          // Job requirements list
  skills: [String],                // Required skills
  location: String,                // Required, job location
  remote: Boolean,                 // Remote work option
  salary: {
    min: Number,
    max: Number,
    currency: String,              // Default: 'USD'
    period: String                 // 'hour', 'month', 'year'
  },
  jobType: String,                 // 'full-time', 'part-time', etc.
  experienceLevel: String,         // 'entry', 'mid', 'senior', etc.
  source: {
    portal: String,                // 'linkedin', 'indeed', etc.
    url: String,
    jobId: String
  },
  postedDate: Date,
  expiryDate: Date,
  isActive: Boolean,               // Default: true
  companyInfo: {
    size: String,
    industry: String,
    website: String,
    logo: String
  },
  applicationCount: Number,        // Default: 0
  tags: [String],
  matchScore: Number,              // For resume matching
  scrapedAt: Date,
  createdAt: Date,                 // Auto-generated
  updatedAt: Date                  // Auto-generated
}
```

**Indexes**:
- Text search: `title`, `description`, `company`
- `location: 1`
- `skills: 1`
- `source.portal: 1`
- `postedDate: -1`
- `isActive: 1`
- `experienceLevel: 1`
- `jobType: 1`
- Compound: `{isActive: 1, postedDate: -1}`
- Compound: `{location: 1, isActive: 1}`

### 3. Job Applications Collection

**Model**: `JobApplication` (models/Job.js)

```javascript
{
  userId: ObjectId,                // Reference to User
  jobId: ObjectId,                 // Reference to Job
  status: String,                  // 'applied', 'viewed', 'interview', etc.
  appliedDate: Date,               // Default: now
  coverLetter: String,
  notes: String,
  resumeUsed: {
    filename: String,
    path: String
  },
  matchScore: Number,              // Resume-job match percentage
  applicationMethod: String,       // 'direct', 'portal', 'email'
  followUpDates: [Date],
  interviewDates: [{
    date: Date,
    type: String,                  // 'phone', 'video', 'in-person', etc.
    notes: String
  }],
  feedback: String,
  salary: {
    offered: Number,
    negotiated: Number,
    final: Number
  },
  createdAt: Date,                 // Auto-generated
  updatedAt: Date                  // Auto-generated
}
```

**Indexes**:
- `userId: 1`
- `jobId: 1`
- `status: 1`
- `appliedDate: -1`
- Compound: `{userId: 1, appliedDate: -1}`
- Unique compound: `{userId: 1, jobId: 1}` (prevents duplicate applications)

## 🚀 Database Setup

### Prerequisites
- Node.js v16+
- MongoDB v5+
- npm or yarn

### Installation Steps

1. **Install MongoDB** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt install mongodb-org
   
   # macOS
   brew install mongodb-community
   
   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB**:
   ```bash
   # Linux (manual start)
   sudo -u mongodb mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /data/db
   
   # macOS
   brew services start mongodb-community
   
   # Windows
   # Start as Windows Service or run mongod.exe
   ```

3. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

4. **Configure Environment**:
   ```bash
   # Copy and edit .env file
   cp .env.example .env
   # Edit MONGODB_URI if needed
   ```

5. **Seed Database**:
   ```bash
   npm run seed
   ```

## 🛠️ Database Management

### Available Scripts

```bash
# Seed database with sample data
npm run seed

# Interactive database management tool
npm run db:manage

# Show database statistics
npm run db:stats

# Start development server
npm run dev
```

### Management Tool Features

The interactive management tool (`npm run db:manage`) provides:

1. **Database Statistics** - View counts and breakdowns
2. **List Users** - See all users with details
3. **List Jobs** - Browse all job listings
4. **List Applications** - View application status
5. **Re-seed Database** - Clear and repopulate with fresh data
6. **Clear Data** - Remove all or specific collections
7. **Collection Management** - Target specific collections

### Direct MongoDB Commands

```bash
# Connect to MongoDB shell
mongosh job-application-system

# Basic queries
db.users.countDocuments()
db.jobs.find({remote: true})
db.jobapplications.find({status: "interview"})

# Aggregation examples
db.jobapplications.aggregate([
  {$group: {_id: "$status", count: {$sum: 1}}}
])
```

## 📝 Sample Data

The seeded database includes:

### Users (4 total)
- **Admin User**: `admin@jobseeker.com` / `admin123` (admin role)
- **John Doe**: `john.doe@email.com` / `password123` (basic plan)
- **Jane Smith**: `jane.smith@email.com` / `password123` (premium plan)
- **Mike Johnson**: `mike.johnson@email.com` / `password123` (free plan)

### Jobs (6 total)
- Senior Full Stack Developer at TechCorp Inc. (San Francisco, CA) - Remote
- Frontend Developer at StartupXYZ (New York, NY)
- Backend Python Developer at DataFlow Solutions (Austin, TX) - Remote
- DevOps Engineer at CloudTech Systems (Seattle, WA) - Remote
- Junior React Developer at WebDev Agency (Denver, CO)
- Lead Software Engineer at Enterprise Solutions Ltd (Boston, MA) - Remote

### Applications (6 total)
- Various statuses: applied, interview, offer, viewed, rejected
- Different match scores and application methods
- Sample interview schedules and salary negotiations

## 🔧 Configuration

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/job-application-system

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Stripe (for subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Production Configuration

For production deployment:

1. **Use MongoDB Atlas** or dedicated MongoDB instance
2. **Update connection string** with authentication
3. **Enable SSL/TLS** for secure connections
4. **Set up backups** and monitoring
5. **Configure replica sets** for high availability

Example production connection:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobseeker-pro?retryWrites=true&w=majority
```

## 🔒 Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with salt
2. **Input Validation**: Mongoose schema validation and express-validator
3. **Indexes**: Proper indexing for performance and uniqueness
4. **Environment Variables**: Sensitive data stored in environment variables
5. **Connection Security**: Use SSL/TLS in production

## 📈 Performance Optimization

1. **Strategic Indexing**: Optimized for common queries
2. **Aggregation Pipelines**: Efficient data processing
3. **Connection Pooling**: Mongoose handles connection pooling
4. **Query Optimization**: Selective field projection
5. **Pagination**: Built-in support for large datasets

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**:
   ```bash
   # Check if MongoDB is running
   pgrep -f mongod
   
   # Check connection string
   echo $MONGODB_URI
   ```

2. **Permission Errors**:
   ```bash
   # Fix MongoDB data directory permissions
   sudo chown -R mongodb:mongodb /data/db
   ```

3. **Port Conflicts**:
   ```bash
   # Check if port 27017 is in use
   netstat -tulpn | grep 27017
   ```

4. **Memory Issues**:
   ```bash
   # Monitor MongoDB memory usage
   db.serverStatus().mem
   ```

### Backup and Recovery

```bash
# Create backup
mongodump --db job-application-system --out ./backup

# Restore from backup
mongorestore --db job-application-system ./backup/job-application-system
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Schema Design Patterns](https://docs.mongodb.com/manual/applications/data-models/)

---

**Last Updated**: January 2025  
**Database Version**: MongoDB 7.0+  
**Mongoose Version**: 8.17.1+