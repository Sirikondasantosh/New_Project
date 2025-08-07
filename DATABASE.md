# JobSeeker Pro - Database Documentation

This document provides comprehensive information about the database structure, setup, and management for the JobSeeker Pro application.

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [Installation & Setup](#installation--setup)
3. [Database Schema](#database-schema)
4. [Collections](#collections)
5. [Indexes](#indexes)
6. [Database Management](#database-management)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

## 🗄️ Database Overview

**Database Type**: MongoDB (NoSQL Document Database)  
**Database Name**: `job-application-system`  
**ODM**: Mongoose (Object Document Mapping)  
**Connection**: MongoDB URI with connection pooling

### Key Features
- **Document-based storage** for flexible job and user data
- **Automatic indexing** for fast queries
- **Built-in validation** through Mongoose schemas
- **Aggregation pipeline** for complex analytics
- **GridFS support** for file storage (resumes)
- **Automatic cleanup** of old data

## 🚀 Installation & Setup

### Prerequisites
- MongoDB 5.0 or higher
- Node.js 16+ with npm

### Local Development Setup

1. **Install MongoDB**
   ```bash
   # macOS (using Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community

   # Ubuntu/Debian
   sudo apt-get install mongodb

   # Windows - Download from MongoDB website
   ```

2. **Start MongoDB Service**
   ```bash
   # macOS/Linux
   sudo systemctl start mongod
   # or
   brew services start mongodb-community

   # Windows
   net start MongoDB
   ```

3. **Configure Environment Variables**
   ```bash
   # In server/.env
   MONGODB_URI=mongodb://localhost:27017/job-application-system
   ```

4. **Initialize Database**
   ```bash
   cd server
   node scripts/db-setup.js setup
   ```

### Production Setup

1. **MongoDB Atlas (Recommended)**
   ```bash
   # Replace with your Atlas connection string
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job-application-system
   ```

2. **Self-Hosted MongoDB**
   ```bash
   # With authentication
   MONGODB_URI=mongodb://username:password@host:port/job-application-system
   
   # Replica set
   MONGODB_URI=mongodb://host1:port1,host2:port2,host3:port3/job-application-system?replicaSet=myReplicaSet
   ```

## 📊 Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │       │    Jobs     │       │JobApplication│
│             │       │             │       │             │
│ _id         │       │ _id         │       │ _id         │
│ name        │       │ title       │       │ userId      │──┐
│ email       │       │ company     │       │ jobId       │──┼──┐
│ password    │       │ description │       │ status      │  │  │
│ role        │       │ skills      │       │ appliedDate │  │  │
│ profile     │       │ location    │       │ coverLetter │  │  │
│ subscription│       │ salary      │       │ matchScore  │  │  │
│ resume      │       │ source      │       └─────────────┘  │  │
│ appStats    │       │ isActive    │                        │  │
└─────────────┘       └─────────────┘                        │  │
       │                     │                               │  │
       └─────────────────────┼───────────────────────────────┘  │
                             └──────────────────────────────────┘
```

## 📁 Collections

### 1. Users Collection

Stores user account information, profiles, subscriptions, and application statistics.

```javascript
{
  _id: ObjectId,
  name: String,                    // Full name
  email: String,                   // Unique email address
  password: String,                // Hashed password (bcrypt)
  role: String,                    // 'user' | 'admin'
  
  profile: {
    phone: String,
    location: String,
    bio: String,
    skills: [String],              // Array of skills
    experience: String,
    education: String,
    linkedinUrl: String,
    githubUrl: String,
    portfolioUrl: String
  },
  
  subscription: {
    plan: String,                  // 'free' | 'basic' | 'premium'
    status: String,                // 'active' | 'inactive' | 'cancelled'
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
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Jobs Collection

Stores job listings scraped from various job portals.

```javascript
{
  _id: ObjectId,
  title: String,                   // Job title
  company: String,                 // Company name
  description: String,             // Job description
  requirements: [String],          // Array of requirements
  skills: [String],               // Required skills
  location: String,               // Job location
  remote: Boolean,                // Remote work option
  
  salary: {
    min: Number,
    max: Number,
    currency: String,              // 'USD', 'EUR', etc.
    period: String                 // 'hour', 'month', 'year'
  },
  
  jobType: String,                // 'full-time', 'part-time', 'contract', etc.
  experienceLevel: String,        // 'entry', 'mid', 'senior', 'lead', 'executive'
  
  source: {
    portal: String,               // 'linkedin', 'indeed', 'glassdoor', etc.
    url: String,                  // Original job URL
    jobId: String                 // External job ID
  },
  
  companyInfo: {
    size: String,                 // Company size
    industry: String,             // Industry type
    website: String,              // Company website
    logo: String                  // Company logo URL
  },
  
  postedDate: Date,               // When job was posted
  expiryDate: Date,               // Job expiry date
  isActive: Boolean,              // Is job still active
  applicationCount: Number,       // Number of applications
  tags: [String],                 // Job tags
  matchScore: Number,             // For resume matching
  scrapedAt: Date,                // When job was scraped
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. JobApplications Collection

Tracks user applications to jobs with detailed status and history.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,               // Reference to Users collection
  jobId: ObjectId,                // Reference to Jobs collection
  
  status: String,                 // 'applied', 'viewed', 'interview', 'rejected', 'offer', 'accepted'
  appliedDate: Date,              // When application was submitted
  coverLetter: String,            // Cover letter content
  notes: String,                  // User notes
  
  resumeUsed: {
    filename: String,
    path: String
  },
  
  matchScore: Number,             // Resume-job match score
  applicationMethod: String,      // 'direct', 'portal', 'email'
  
  followUpDates: [Date],          // Follow-up reminder dates
  
  interviewDates: [{
    date: Date,
    type: String,                 // 'phone', 'video', 'in-person', 'technical'
    notes: String
  }],
  
  feedback: String,               // Interview feedback
  
  salary: {
    offered: Number,
    negotiated: Number,
    final: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 Indexes

### Automatic Indexes

The following indexes are automatically created for optimal query performance:

#### Users Collection
```javascript
// Unique index on email
{ email: 1 }

// Compound indexes
{ 'subscription.plan': 1 }
{ role: 1 }
{ createdAt: -1 }
{ lastLogin: -1 }
```

#### Jobs Collection
```javascript
// Text index for search
{ title: 'text', description: 'text', company: 'text' }

// Single field indexes
{ location: 1 }
{ skills: 1 }
{ 'source.portal': 1 }
{ postedDate: -1 }
{ isActive: 1 }
{ experienceLevel: 1 }
{ jobType: 1 }
{ scrapedAt: -1 }

// Compound indexes
{ isActive: 1, postedDate: -1 }
{ location: 1, isActive: 1 }
{ skills: 1, isActive: 1 }
```

#### JobApplications Collection
```javascript
// Single field indexes
{ userId: 1 }
{ jobId: 1 }
{ status: 1 }
{ appliedDate: -1 }

// Compound indexes
{ userId: 1, appliedDate: -1 }
{ userId: 1, status: 1 }
{ jobId: 1, status: 1 }

// Unique compound index (prevent duplicate applications)
{ userId: 1, jobId: 1 }
```

### Creating Indexes Manually

```bash
# Using the database setup script
node scripts/db-setup.js indexes

# Or programmatically
const dbManager = new DatabaseManager();
await dbManager.createIndexes();
```

## 🛠️ Database Management

### Available Commands

The system includes a comprehensive database management script:

```bash
# Full database setup (indexes + sample data)
node scripts/db-setup.js setup

# Add sample data only
node scripts/db-setup.js seed

# View database statistics
node scripts/db-setup.js stats

# Clean up old data
node scripts/db-setup.js clean

# Create backup
node scripts/db-setup.js backup

# Check database health
node scripts/db-setup.js health

# Create indexes only
node scripts/db-setup.js indexes

# Drop entire database (DANGEROUS!)
node scripts/db-setup.js drop
```

### Sample Data

The seeding process creates:
- **Admin user**: `admin@demo.com` / `admin123`
- **Demo user**: `user@demo.com` / `demo123`
- **5 sample jobs** from various companies
- **3 sample applications** for the demo user

### Database Statistics

```bash
node scripts/db-setup.js stats
```

Output:
```
📊 Database Statistics:
   Users: 2 (1 admins)
   Active Subscriptions: 1
   Jobs: 5 (5 active)
   Applications: 3
   Database Size: 2.45 MB
```

## 💾 Backup & Recovery

### Automated Backups

- **Weekly backups** via cron job (Sundays at 3 AM)
- **Manual backups** via admin dashboard
- **JSON format** for easy restoration

### Creating Backups

```bash
# Manual backup
node scripts/db-setup.js backup

# Programmatic backup
const dbManager = new DatabaseManager();
const backupPath = await dbManager.backup();
```

### Backup Location

```
server/backups/
├── backup_2024-01-15.json
├── backup_2024-01-22.json
└── backup_2024-01-29.json
```

### Restoring from Backup

```bash
# Using mongoimport (for collections)
mongoimport --db job-application-system --collection users --file backup_users.json --jsonArray

# Using mongorestore (for complete database)
mongorestore --db job-application-system /path/to/backup/
```

## ⚡ Performance Optimization

### Query Optimization

1. **Use Indexes Effectively**
   ```javascript
   // Good: Uses index on isActive and postedDate
   Job.find({ isActive: true }).sort({ postedDate: -1 })
   
   // Bad: Full collection scan
   Job.find({ description: /javascript/i })
   ```

2. **Projection (Select Only Needed Fields)**
   ```javascript
   // Good: Only select needed fields
   User.find({}).select('name email subscription.plan')
   
   // Bad: Select all fields
   User.find({})
   ```

3. **Pagination**
   ```javascript
   // Good: Limit results with pagination
   Job.find({ isActive: true })
      .skip((page - 1) * limit)
      .limit(limit)
   ```

### Connection Optimization

```javascript
// Connection pooling (in production)
mongoose.connect(uri, {
  maxPoolSize: 10,        // Maximum connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

### Aggregation Pipeline Optimization

```javascript
// Efficient aggregation for statistics
const stats = await JobApplication.aggregate([
  { $match: { userId: ObjectId(userId) } },
  { $group: { 
    _id: '$status', 
    count: { $sum: 1 } 
  }},
  { $sort: { count: -1 } }
]);
```

## 📊 Monitoring

### Database Health Check

```bash
# Check database health
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "database": {
    "status": "healthy",
    "connected": true,
    "database": "job-application-system",
    "host": "localhost",
    "port": 27017,
    "stats": {
      "users": 150,
      "jobs": 1250,
      "applications": 3500
    }
  }
}
```

### Performance Metrics

Monitor these key metrics:

1. **Connection Pool Usage**
2. **Query Response Times**
3. **Index Hit Ratios**
4. **Memory Usage**
5. **Disk I/O**

### MongoDB Compass

Use MongoDB Compass for visual monitoring:
- Query performance
- Index usage
- Real-time metrics
- Schema analysis

## 🔧 Maintenance Tasks

### Automated Maintenance (Cron Jobs)

1. **Daily Cleanup** (2 AM)
   - Remove jobs older than 60 days with no applications
   - Clean up old daily application statistics

2. **Weekly Backup** (Sunday 3 AM)
   - Create database backup
   - Store in `/backups` directory

3. **Monthly Subscription Cleanup** (1st of month, 1 AM)
   - Mark expired subscriptions as inactive
   - Update subscription statuses

### Manual Maintenance

```bash
# Clean up old data
node scripts/db-setup.js clean

# Create backup
node scripts/db-setup.js backup

# View database statistics
node scripts/db-setup.js stats
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Timeout

**Problem**: `MongoServerSelectionError: connection timed out`

**Solutions**:
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Verify connection string
echo $MONGODB_URI

# Check firewall settings
sudo ufw status
```

#### 2. Authentication Failed

**Problem**: `MongoServerError: Authentication failed`

**Solutions**:
```bash
# Verify credentials in connection string
MONGODB_URI=mongodb://username:password@host:port/database

# Check user permissions
use admin
db.auth("username", "password")
```

#### 3. Index Creation Fails

**Problem**: Index creation errors during setup

**Solutions**:
```bash
# Drop existing indexes
db.collection.dropIndexes()

# Recreate indexes
node scripts/db-setup.js indexes
```

#### 4. Out of Memory

**Problem**: MongoDB running out of memory

**Solutions**:
```bash
# Check memory usage
free -h

# Restart MongoDB
sudo systemctl restart mongod

# Optimize queries and add indexes
```

### Debug Mode

Enable debug logging:

```javascript
// In development
mongoose.set('debug', true);

// Or via environment
DEBUG=mongoose:* node server/index.js
```

### Log Files

Check MongoDB logs:
```bash
# Ubuntu/Debian
tail -f /var/log/mongodb/mongod.log

# macOS (Homebrew)
tail -f /usr/local/var/log/mongodb/mongo.log
```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Sharding**
   - Shard by `userId` for user data
   - Shard by `location` for job data

2. **Read Replicas**
   - Use read replicas for analytics
   - Separate read/write operations

### Vertical Scaling

1. **Memory**: Increase RAM for better caching
2. **CPU**: More cores for concurrent operations
3. **Storage**: SSD for faster I/O

### Caching Strategy

1. **Redis**: Cache frequently accessed data
2. **Application-level**: Cache query results
3. **CDN**: Cache static content

---

## 📞 Support

For database-related issues:

1. Check this documentation
2. Review MongoDB logs
3. Run health check: `node scripts/db-setup.js health`
4. Contact system administrator

---

**Last Updated**: January 2024  
**Version**: 1.0.0