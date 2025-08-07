const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import models
const User = require('./models/User');
const { Job, JobApplication } = require('./models/Job');
const { seedDatabase } = require('./seedDatabase');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-system');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Database statistics
const showStats = async () => {
  try {
    const userCount = await User.countDocuments();
    const jobCount = await Job.countDocuments();
    const applicationCount = await JobApplication.countDocuments();
    
    console.log('\n📊 Database Statistics:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`💼 Jobs: ${jobCount}`);
    console.log(`📝 Applications: ${applicationCount}`);
    
    // User breakdown
    const adminCount = await User.countDocuments({ role: 'admin' });
    const regularUserCount = await User.countDocuments({ role: 'user' });
    console.log(`   - Admins: ${adminCount}`);
    console.log(`   - Regular Users: ${regularUserCount}`);
    
    // Application status breakdown
    const statusCounts = await JobApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📋 Application Status Breakdown:');
    statusCounts.forEach(status => {
      console.log(`   - ${status._id}: ${status.count}`);
    });
    
    // Recent jobs
    const recentJobs = await Job.find({}).sort({ postedDate: -1 }).limit(3).select('title company postedDate');
    console.log('\n🆕 Recent Jobs:');
    recentJobs.forEach(job => {
      const daysAgo = Math.floor((Date.now() - job.postedDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   - ${job.title} at ${job.company} (${daysAgo} days ago)`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
  }
};

// List all users
const listUsers = async () => {
  try {
    const users = await User.find({}).select('name email role subscription.plan isEmailVerified createdAt');
    
    console.log('\n👥 All Users:');
    console.log('─'.repeat(80));
    users.forEach(user => {
      const verified = user.isEmailVerified ? '✅' : '❌';
      const plan = user.subscription?.plan || 'free';
      console.log(`${verified} ${user.name.padEnd(20)} ${user.email.padEnd(25)} ${user.role.padEnd(8)} ${plan.padEnd(8)} ${user.createdAt.toDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
};

// List all jobs
const listJobs = async () => {
  try {
    const jobs = await Job.find({}).select('title company location remote salary experienceLevel postedDate');
    
    console.log('\n💼 All Jobs:');
    console.log('─'.repeat(100));
    jobs.forEach(job => {
      const remote = job.remote ? '🌐' : '🏢';
      const salary = job.salary?.min && job.salary?.max ? 
        `$${job.salary.min.toLocaleString()}-${job.salary.max.toLocaleString()}` : 'Not specified';
      const daysAgo = Math.floor((Date.now() - job.postedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`${remote} ${job.title.padEnd(25)} ${job.company.padEnd(20)} ${job.location.padEnd(15)} ${job.experienceLevel.padEnd(8)} ${salary.padEnd(15)} ${daysAgo}d ago`);
    });
    
  } catch (error) {
    console.error('❌ Error listing jobs:', error);
  }
};

// List all applications
const listApplications = async () => {
  try {
    const applications = await JobApplication.find({})
      .populate('userId', 'name email')
      .populate('jobId', 'title company')
      .select('status appliedDate matchScore applicationMethod')
      .sort({ appliedDate: -1 });
    
    console.log('\n📝 All Applications:');
    console.log('─'.repeat(120));
    applications.forEach(app => {
      const daysAgo = Math.floor((Date.now() - app.appliedDate.getTime()) / (1000 * 60 * 60 * 24));
      const matchScore = app.matchScore ? `${app.matchScore}%` : 'N/A';
      
      console.log(`${app.status.padEnd(10)} ${app.userId.name.padEnd(15)} ${app.jobId.title.padEnd(25)} ${app.jobId.company.padEnd(20)} ${matchScore.padEnd(6)} ${app.applicationMethod.padEnd(8)} ${daysAgo}d ago`);
    });
    
  } catch (error) {
    console.error('❌ Error listing applications:', error);
  }
};

// Clear all data
const clearAllData = async () => {
  try {
    await User.deleteMany({});
    await Job.deleteMany({});
    await JobApplication.deleteMany({});
    console.log('🗑️  All data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
};

// Clear specific collection
const clearCollection = async (collectionName) => {
  try {
    switch (collectionName.toLowerCase()) {
      case 'users':
        await User.deleteMany({});
        console.log('🗑️  Users cleared');
        break;
      case 'jobs':
        await Job.deleteMany({});
        console.log('🗑️  Jobs cleared');
        break;
      case 'applications':
        await JobApplication.deleteMany({});
        console.log('🗑️  Applications cleared');
        break;
      default:
        console.log('❌ Invalid collection name. Use: users, jobs, or applications');
    }
  } catch (error) {
    console.error('❌ Error clearing collection:', error);
  }
};

// Main menu
const showMenu = () => {
  console.log('\n🗄️  Database Management Tool');
  console.log('═'.repeat(40));
  console.log('1. Show Database Statistics');
  console.log('2. List All Users');
  console.log('3. List All Jobs');
  console.log('4. List All Applications');
  console.log('5. Re-seed Database (Clear & Populate)');
  console.log('6. Clear All Data');
  console.log('7. Clear Specific Collection');
  console.log('8. Exit');
  console.log('═'.repeat(40));
};

// Handle user input
const handleInput = async (choice) => {
  switch (choice) {
    case '1':
      await showStats();
      break;
    case '2':
      await listUsers();
      break;
    case '3':
      await listJobs();
      break;
    case '4':
      await listApplications();
      break;
    case '5':
      console.log('🌱 Re-seeding database...');
      await seedDatabase();
      return;
    case '6':
      rl.question('⚠️  Are you sure you want to clear ALL data? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          await clearAllData();
        } else {
          console.log('❌ Operation cancelled');
        }
        promptUser();
      });
      return;
    case '7':
      rl.question('Which collection to clear? (users/jobs/applications): ', async (collection) => {
        await clearCollection(collection);
        promptUser();
      });
      return;
    case '8':
      console.log('👋 Goodbye!');
      process.exit(0);
    default:
      console.log('❌ Invalid choice. Please try again.');
  }
  promptUser();
};

// Prompt user for input
const promptUser = () => {
  rl.question('\nEnter your choice (1-8): ', handleInput);
};

// Main function
const main = async () => {
  await connectDB();
  
  console.log('🎉 Welcome to JobSeeker Pro Database Management!');
  console.log(`📍 Connected to: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-system'}`);
  
  showMenu();
  promptUser();
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('🔌 Database connection closed');
    process.exit(0);
  });
});

// Run the tool
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error starting database management tool:', error);
    process.exit(1);
  });
}

module.exports = {
  showStats,
  listUsers,
  listJobs,
  listApplications,
  clearAllData,
  clearCollection
};