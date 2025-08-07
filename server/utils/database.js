const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { Job, JobApplication } = require('../models/Job');

class DatabaseManager {
  constructor() {
    this.connection = null;
  }

  // Connect to MongoDB
  async connect(uri = process.env.MONGODB_URI) {
    try {
      this.connection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ MongoDB connected: ${this.connection.connection.host}`);
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  // Disconnect from MongoDB
  async disconnect() {
    if (this.connection) {
      await mongoose.connection.close();
      console.log('📴 MongoDB disconnected');
    }
  }

  // Drop all collections (use with caution!)
  async dropDatabase() {
    try {
      await mongoose.connection.db.dropDatabase();
      console.log('🗑️ Database dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database:', error);
      throw error;
    }
  }

  // Create indexes for better performance
  async createIndexes() {
    try {
      console.log('📊 Creating database indexes...');

      // User indexes
      await User.createIndexes();
      console.log('✅ User indexes created');

      // Job indexes
      await Job.createIndexes();
      console.log('✅ Job indexes created');

      // JobApplication indexes
      await JobApplication.createIndexes();
      console.log('✅ JobApplication indexes created');

      console.log('🎉 All indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  // Seed database with sample data
  async seedDatabase() {
    try {
      console.log('🌱 Seeding database with sample data...');

      // Create admin user
      const adminExists = await User.findOne({ email: 'admin@demo.com' });
      if (!adminExists) {
        const adminUser = new User({
          name: 'Admin User',
          email: 'admin@demo.com',
          password: 'admin123',
          role: 'admin',
          profile: {
            skills: ['Management', 'Leadership', 'Analytics'],
            bio: 'System administrator with full access to manage users and jobs.'
          }
        });
        await adminUser.save();
        console.log('✅ Admin user created (admin@demo.com / admin123)');
      }

      // Create demo user
      const userExists = await User.findOne({ email: 'user@demo.com' });
      if (!userExists) {
        const demoUser = new User({
          name: 'Demo User',
          email: 'user@demo.com',
          password: 'demo123',
          role: 'user',
          profile: {
            phone: '+1-555-0123',
            location: 'San Francisco, CA',
            bio: 'Full-stack developer passionate about creating amazing web applications.',
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'AWS'],
            experience: '3 years of experience in web development',
            education: 'Bachelor of Science in Computer Science',
            linkedinUrl: 'https://linkedin.com/in/demouser',
            githubUrl: 'https://github.com/demouser'
          },
          subscription: {
            plan: 'basic',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        });
        await demoUser.save();
        console.log('✅ Demo user created (user@demo.com / demo123)');
      }

      // Create sample jobs
      const jobCount = await Job.countDocuments();
      if (jobCount === 0) {
        const sampleJobs = [
          {
            title: 'Senior Full Stack Developer',
            company: 'TechCorp Inc.',
            description: 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies like React, Node.js, and MongoDB.',
            requirements: [
              '5+ years of experience in web development',
              'Proficiency in JavaScript, React, and Node.js',
              'Experience with databases (MongoDB, PostgreSQL)',
              'Knowledge of cloud platforms (AWS, Azure)',
              'Strong problem-solving skills'
            ],
            skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
            location: 'San Francisco, CA',
            remote: false,
            salary: {
              min: 120000,
              max: 160000,
              currency: 'USD',
              period: 'year'
            },
            jobType: 'full-time',
            experienceLevel: 'senior',
            source: {
              portal: 'indeed',
              url: 'https://indeed.com/job/12345',
              jobId: 'indeed_12345'
            },
            companyInfo: {
              size: '100-500 employees',
              industry: 'Technology',
              website: 'https://techcorp.com'
            },
            postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isActive: true
          },
          {
            title: 'Frontend React Developer',
            company: 'StartupXYZ',
            description: 'Join our fast-growing startup as a Frontend Developer. You will work on building beautiful and responsive user interfaces using React and modern CSS frameworks.',
            requirements: [
              '3+ years of React development experience',
              'Strong CSS and HTML skills',
              'Experience with state management (Redux, Context API)',
              'Knowledge of testing frameworks (Jest, React Testing Library)',
              'Familiarity with design systems'
            ],
            skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Redux', 'Jest'],
            location: 'Remote',
            remote: true,
            salary: {
              min: 80000,
              max: 110000,
              currency: 'USD',
              period: 'year'
            },
            jobType: 'full-time',
            experienceLevel: 'mid',
            source: {
              portal: 'linkedin',
              url: 'https://linkedin.com/jobs/67890',
              jobId: 'linkedin_67890'
            },
            companyInfo: {
              size: '10-50 employees',
              industry: 'Technology',
              website: 'https://startupxyz.com'
            },
            postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            isActive: true
          },
          {
            title: 'Python Backend Developer',
            company: 'DataFlow Solutions',
            description: 'We are seeking a skilled Python Backend Developer to build and maintain our data processing pipelines and APIs. Experience with Django, FastAPI, and cloud services is highly valued.',
            requirements: [
              '4+ years of Python development experience',
              'Experience with Django or FastAPI',
              'Knowledge of database design and optimization',
              'Familiarity with containerization (Docker)',
              'Experience with message queues (Redis, RabbitMQ)'
            ],
            skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis'],
            location: 'New York, NY',
            remote: false,
            salary: {
              min: 100000,
              max: 140000,
              currency: 'USD',
              period: 'year'
            },
            jobType: 'full-time',
            experienceLevel: 'mid',
            source: {
              portal: 'glassdoor',
              url: 'https://glassdoor.com/job/54321',
              jobId: 'glassdoor_54321'
            },
            companyInfo: {
              size: '200-1000 employees',
              industry: 'Data Analytics',
              website: 'https://dataflowsolutions.com'
            },
            postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            isActive: true
          },
          {
            title: 'DevOps Engineer',
            company: 'CloudTech Systems',
            description: 'Looking for a DevOps Engineer to help us scale our infrastructure and improve our deployment processes. You will work with Kubernetes, AWS, and various CI/CD tools.',
            requirements: [
              '3+ years of DevOps experience',
              'Strong knowledge of AWS services',
              'Experience with Kubernetes and Docker',
              'Proficiency in Infrastructure as Code (Terraform)',
              'Knowledge of monitoring and logging tools'
            ],
            skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins', 'Monitoring'],
            location: 'Austin, TX',
            remote: true,
            salary: {
              min: 110000,
              max: 150000,
              currency: 'USD',
              period: 'year'
            },
            jobType: 'full-time',
            experienceLevel: 'mid',
            source: {
              portal: 'indeed',
              url: 'https://indeed.com/job/98765',
              jobId: 'indeed_98765'
            },
            companyInfo: {
              size: '50-200 employees',
              industry: 'Cloud Services',
              website: 'https://cloudtechsystems.com'
            },
            postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            isActive: true
          },
          {
            title: 'Junior Web Developer',
            company: 'WebCrafters Agency',
            description: 'Great opportunity for a junior developer to join our creative agency. You will work on various client projects using HTML, CSS, JavaScript, and popular frameworks.',
            requirements: [
              '1-2 years of web development experience',
              'Strong HTML, CSS, and JavaScript fundamentals',
              'Basic knowledge of React or Vue.js',
              'Understanding of responsive design principles',
              'Eagerness to learn and grow'
            ],
            skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design'],
            location: 'Los Angeles, CA',
            remote: false,
            salary: {
              min: 60000,
              max: 80000,
              currency: 'USD',
              period: 'year'
            },
            jobType: 'full-time',
            experienceLevel: 'entry',
            source: {
              portal: 'ziprecruiter',
              url: 'https://ziprecruiter.com/job/11111',
              jobId: 'ziprecruiter_11111'
            },
            companyInfo: {
              size: '10-50 employees',
              industry: 'Digital Agency',
              website: 'https://webcraftersagency.com'
            },
            postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            isActive: true
          }
        ];

        await Job.insertMany(sampleJobs);
        console.log(`✅ Created ${sampleJobs.length} sample jobs`);
      }

      // Create sample applications for demo user
      const demoUser = await User.findOne({ email: 'user@demo.com' });
      if (demoUser) {
        const applicationCount = await JobApplication.countDocuments({ userId: demoUser._id });
        if (applicationCount === 0) {
          const jobs = await Job.find().limit(3);
          const sampleApplications = jobs.map((job, index) => ({
            userId: demoUser._id,
            jobId: job._id,
            status: ['applied', 'interview', 'offer'][index] || 'applied',
            appliedDate: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
            coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} position at ${job.company}. With my background in web development and passion for technology, I believe I would be a great fit for this role.\n\nBest regards,\nDemo User`,
            notes: `Applied through ${job.source.portal}`,
            matchScore: Math.floor(Math.random() * 40) + 60 // Random score between 60-100
          }));

          await JobApplication.insertMany(sampleApplications);
          
          // Update user's application stats
          demoUser.applicationStats.totalApplications = sampleApplications.length;
          demoUser.applicationStats.dailyApplications = [
            { date: new Date(), count: 1 },
            { date: new Date(Date.now() - 24 * 60 * 60 * 1000), count: 2 }
          ];
          await demoUser.save();
          
          console.log(`✅ Created ${sampleApplications.length} sample applications for demo user`);
        }
      }

      console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  // Get database statistics
  async getStats() {
    try {
      const stats = {
        users: await User.countDocuments(),
        admins: await User.countDocuments({ role: 'admin' }),
        activeSubscriptions: await User.countDocuments({ 
          'subscription.status': 'active',
          'subscription.plan': { $in: ['basic', 'premium'] }
        }),
        jobs: await Job.countDocuments(),
        activeJobs: await Job.countDocuments({ isActive: true }),
        applications: await JobApplication.countDocuments(),
        databaseSize: await this.getDatabaseSize()
      };

      console.log('📊 Database Statistics:');
      console.log(`   Users: ${stats.users} (${stats.admins} admins)`);
      console.log(`   Active Subscriptions: ${stats.activeSubscriptions}`);
      console.log(`   Jobs: ${stats.jobs} (${stats.activeJobs} active)`);
      console.log(`   Applications: ${stats.applications}`);
      console.log(`   Database Size: ${stats.databaseSize}`);

      return stats;
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      throw error;
    }
  }

  // Get database size
  async getDatabaseSize() {
    try {
      const stats = await mongoose.connection.db.stats();
      const sizeInMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
      return `${sizeInMB} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  // Clean up old data
  async cleanup() {
    try {
      console.log('🧹 Starting database cleanup...');

      // Remove jobs older than 60 days
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const oldJobsResult = await Job.deleteMany({
        scrapedAt: { $lt: sixtyDaysAgo },
        applicationCount: 0 // Only delete jobs with no applications
      });
      console.log(`🗑️ Removed ${oldJobsResult.deletedCount} old jobs`);

      // Clean up old daily application stats (keep only last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await User.updateMany(
        {},
        {
          $pull: {
            'applicationStats.dailyApplications': {
              date: { $lt: ninetyDaysAgo }
            }
          }
        }
      );
      console.log('🗑️ Cleaned up old application statistics');

      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  // Backup database (export to JSON)
  async backup() {
    try {
      console.log('💾 Creating database backup...');
      
      const users = await User.find({}).select('-password').lean();
      const jobs = await Job.find({}).lean();
      const applications = await JobApplication.find({}).lean();

      const backup = {
        timestamp: new Date().toISOString(),
        users,
        jobs,
        applications
      };

      const fs = require('fs');
      const backupDir = './backups';
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }

      const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
      const filepath = `${backupDir}/${filename}`;
      
      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
      console.log(`✅ Backup created: ${filepath}`);
      
      return filepath;
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const isConnected = mongoose.connection.readyState === 1;
      const stats = await this.getStats();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        connected: isConnected,
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        stats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = DatabaseManager;