const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const { Job, JobApplication } = require('./models/Job');

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

// Sample Users Data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@jobseeker.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      phone: '+1-555-0101',
      location: 'San Francisco, CA',
      bio: 'System Administrator',
      skills: ['System Administration', 'Database Management', 'User Management'],
      experience: '5+ years',
      education: 'Bachelor in Computer Science',
      linkedinUrl: 'https://linkedin.com/in/admin-user',
      githubUrl: 'https://github.com/admin-user'
    },
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    },
    isEmailVerified: true
  },
  {
    name: 'John Doe',
    email: 'john.doe@email.com',
    password: 'password123',
    role: 'user',
    profile: {
      phone: '+1-555-0102',
      location: 'New York, NY',
      bio: 'Full Stack Developer with 3 years of experience in React and Node.js',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express.js', 'TypeScript'],
      experience: '3 years',
      education: 'Bachelor in Software Engineering',
      linkedinUrl: 'https://linkedin.com/in/john-doe',
      githubUrl: 'https://github.com/johndoe',
      portfolioUrl: 'https://johndoe.dev'
    },
    subscription: {
      plan: 'basic',
      status: 'active',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000) // 11 months from now
    },
    applicationStats: {
      totalApplications: 15,
      dailyApplications: [
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), count: 3 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), count: 2 },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), count: 4 }
      ]
    },
    isEmailVerified: true
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    password: 'password123',
    role: 'user',
    profile: {
      phone: '+1-555-0103',
      location: 'Austin, TX',
      bio: 'Senior Frontend Developer specializing in React and Vue.js',
      skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'HTML', 'Webpack', 'Jest'],
      experience: '5 years',
      education: 'Master in Computer Science',
      linkedinUrl: 'https://linkedin.com/in/jane-smith',
      githubUrl: 'https://github.com/janesmith',
      portfolioUrl: 'https://janesmith.dev'
    },
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      endDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000) // 10 months from now
    },
    applicationStats: {
      totalApplications: 28,
      dailyApplications: [
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), count: 5 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), count: 3 },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), count: 2 }
      ]
    },
    isEmailVerified: true
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@email.com',
    password: 'password123',
    role: 'user',
    profile: {
      phone: '+1-555-0104',
      location: 'Seattle, WA',
      bio: 'Backend Developer with expertise in Python and Django',
      skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
      experience: '4 years',
      education: 'Bachelor in Information Technology',
      linkedinUrl: 'https://linkedin.com/in/mike-johnson',
      githubUrl: 'https://github.com/mikejohnson'
    },
    subscription: {
      plan: 'free',
      status: 'inactive'
    },
    applicationStats: {
      totalApplications: 8,
      dailyApplications: [
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), count: 2 },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), count: 1 }
      ]
    },
    isEmailVerified: true
  }
];

// Sample Jobs Data
const sampleJobs = [
  {
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Inc.',
    description: 'We are looking for a Senior Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.',
    requirements: [
      '5+ years of experience in full stack development',
      'Proficiency in React and Node.js',
      'Experience with MongoDB or PostgreSQL',
      'Knowledge of cloud platforms (AWS/Azure)',
      'Strong problem-solving skills'
    ],
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'TypeScript', 'AWS'],
    location: 'San Francisco, CA',
    remote: true,
    salary: {
      min: 120000,
      max: 160000,
      currency: 'USD',
      period: 'year'
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    source: {
      portal: 'linkedin',
      url: 'https://linkedin.com/jobs/12345',
      jobId: 'LI12345'
    },
    companyInfo: {
      size: '100-500',
      industry: 'Technology',
      website: 'https://techcorp.com'
    },
    tags: ['Remote', 'Full Stack', 'Senior Level'],
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    title: 'Frontend Developer',
    company: 'StartupXYZ',
    description: 'Join our dynamic startup as a Frontend Developer. Work on cutting-edge projects and help shape the future of our product.',
    requirements: [
      '3+ years of React experience',
      'Strong CSS and JavaScript skills',
      'Experience with modern build tools',
      'Knowledge of responsive design',
      'Team collaboration skills'
    ],
    skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Webpack', 'Git'],
    location: 'New York, NY',
    remote: false,
    salary: {
      min: 80000,
      max: 110000,
      currency: 'USD',
      period: 'year'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    source: {
      portal: 'indeed',
      url: 'https://indeed.com/jobs/67890',
      jobId: 'IN67890'
    },
    companyInfo: {
      size: '10-50',
      industry: 'Technology',
      website: 'https://startupxyz.com'
    },
    tags: ['Frontend', 'React', 'Startup'],
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    title: 'Backend Python Developer',
    company: 'DataFlow Solutions',
    description: 'We need a Backend Python Developer to work on our data processing platform. Experience with Django and databases required.',
    requirements: [
      '4+ years of Python development',
      'Experience with Django framework',
      'Knowledge of PostgreSQL or MySQL',
      'Understanding of RESTful APIs',
      'Experience with data processing'
    ],
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'],
    location: 'Austin, TX',
    remote: true,
    salary: {
      min: 95000,
      max: 130000,
      currency: 'USD',
      period: 'year'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    source: {
      portal: 'glassdoor',
      url: 'https://glassdoor.com/jobs/11111',
      jobId: 'GD11111'
    },
    companyInfo: {
      size: '50-100',
      industry: 'Data Analytics',
      website: 'https://dataflow.com'
    },
    tags: ['Backend', 'Python', 'Remote', 'Data'],
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudTech Systems',
    description: 'Looking for a DevOps Engineer to manage our cloud infrastructure and deployment pipelines.',
    requirements: [
      '3+ years of DevOps experience',
      'Strong knowledge of AWS or Azure',
      'Experience with Docker and Kubernetes',
      'CI/CD pipeline management',
      'Infrastructure as Code (Terraform)'
    ],
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux'],
    location: 'Seattle, WA',
    remote: true,
    salary: {
      min: 110000,
      max: 145000,
      currency: 'USD',
      period: 'year'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    source: {
      portal: 'linkedin',
      url: 'https://linkedin.com/jobs/22222',
      jobId: 'LI22222'
    },
    companyInfo: {
      size: '200-500',
      industry: 'Cloud Services',
      website: 'https://cloudtech.com'
    },
    tags: ['DevOps', 'Cloud', 'Remote', 'Infrastructure'],
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    title: 'Junior React Developer',
    company: 'WebDev Agency',
    description: 'Entry-level position for a Junior React Developer. Great opportunity for recent graduates or career changers.',
    requirements: [
      '1+ years of React experience',
      'Basic JavaScript knowledge',
      'Understanding of HTML/CSS',
      'Willingness to learn',
      'Good communication skills'
    ],
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    location: 'Denver, CO',
    remote: false,
    salary: {
      min: 55000,
      max: 75000,
      currency: 'USD',
      period: 'year'
    },
    jobType: 'full-time',
    experienceLevel: 'entry',
    source: {
      portal: 'indeed',
      url: 'https://indeed.com/jobs/33333',
      jobId: 'IN33333'
    },
    companyInfo: {
      size: '10-25',
      industry: 'Web Development',
      website: 'https://webdevagency.com'
    },
    tags: ['Junior', 'React', 'Entry Level'],
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    title: 'Lead Software Engineer',
    company: 'Enterprise Solutions Ltd',
    description: 'We are seeking a Lead Software Engineer to guide our development team and architect scalable solutions.',
    requirements: [
      '7+ years of software development',
      'Leadership and mentoring experience',
      'Strong system design skills',
      'Experience with microservices',
      'Knowledge of multiple programming languages'
    ],
    skills: ['Java', 'Python', 'Microservices', 'System Design', 'Leadership', 'AWS'],
    location: 'Boston, MA',
    remote: true,
    salary: {
      min: 150000,
      max: 190000,
      currency: 'USD',
      period: 'year'
    },
    jobType: 'full-time',
    experienceLevel: 'lead',
    source: {
      portal: 'glassdoor',
      url: 'https://glassdoor.com/jobs/44444',
      jobId: 'GD44444'
    },
    companyInfo: {
      size: '1000+',
      industry: 'Enterprise Software',
      website: 'https://enterprisesolutions.com'
    },
    tags: ['Lead', 'Software Engineer', 'Remote', 'Enterprise'],
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  }
];

// Hash passwords for users
const hashPasswords = async (users) => {
  for (let user of users) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  return users;
};

// Seed Users
const seedUsers = async () => {
  try {
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');
    
    const hashedUsers = await hashPasswords([...sampleUsers]);
    const users = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${users.length} users`);
    return users;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Seed Jobs
const seedJobs = async () => {
  try {
    await Job.deleteMany({});
    console.log('🗑️  Cleared existing jobs');
    
    const jobs = await Job.insertMany(sampleJobs);
    console.log(`✅ Created ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
    throw error;
  }
};

// Seed Job Applications
const seedJobApplications = async (users, jobs) => {
  try {
    await JobApplication.deleteMany({});
    console.log('🗑️  Cleared existing job applications');
    
    const regularUsers = users.filter(user => user.role === 'user');
    const applications = [];
    
    // Create sample applications
    const sampleApplications = [
      {
        userId: regularUsers[0]._id, // John Doe
        jobId: jobs[0]._id, // Senior Full Stack Developer
        status: 'applied',
        appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        coverLetter: 'I am very interested in this position and believe my React and Node.js experience makes me a great fit.',
        notes: 'Applied through LinkedIn',
        matchScore: 85,
        applicationMethod: 'portal'
      },
      {
        userId: regularUsers[0]._id, // John Doe
        jobId: jobs[1]._id, // Frontend Developer
        status: 'interview',
        appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        coverLetter: 'Excited about the startup environment and frontend challenges.',
        notes: 'Initial phone screening completed',
        matchScore: 78,
        applicationMethod: 'direct',
        interviewDates: [{
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          type: 'video',
          notes: 'Technical interview scheduled'
        }]
      },
      {
        userId: regularUsers[1]._id, // Jane Smith
        jobId: jobs[1]._id, // Frontend Developer
        status: 'offer',
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        coverLetter: 'My 5 years of React experience aligns perfectly with your requirements.',
        notes: 'Great interview process',
        matchScore: 92,
        applicationMethod: 'portal',
        interviewDates: [
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            type: 'video',
            notes: 'Technical interview - went well'
          },
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            type: 'in-person',
            notes: 'Final interview with team lead'
          }
        ],
        salary: {
          offered: 105000,
          negotiated: 110000
        }
      },
      {
        userId: regularUsers[1]._id, // Jane Smith
        jobId: jobs[5]._id, // Lead Software Engineer
        status: 'applied',
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        coverLetter: 'I am ready to take on a leadership role and contribute to system architecture.',
        notes: 'Applied directly through company website',
        matchScore: 88,
        applicationMethod: 'direct'
      },
      {
        userId: regularUsers[2]._id, // Mike Johnson
        jobId: jobs[2]._id, // Backend Python Developer
        status: 'viewed',
        appliedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        coverLetter: 'My Django experience and data processing background make me ideal for this role.',
        notes: 'Application viewed by recruiter',
        matchScore: 90,
        applicationMethod: 'portal'
      },
      {
        userId: regularUsers[2]._id, // Mike Johnson
        jobId: jobs[3]._id, // DevOps Engineer
        status: 'rejected',
        appliedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        coverLetter: 'Interested in transitioning to DevOps and leveraging my backend experience.',
        notes: 'Not enough DevOps experience',
        matchScore: 65,
        applicationMethod: 'portal',
        feedback: 'Strong technical background but lacks specific DevOps experience with Kubernetes.'
      }
    ];
    
    const jobApplications = await JobApplication.insertMany(sampleApplications);
    console.log(`✅ Created ${jobApplications.length} job applications`);
    return jobApplications;
  } catch (error) {
    console.error('❌ Error seeding job applications:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    const users = await seedUsers();
    const jobs = await seedJobs();
    const applications = await seedJobApplications(users, jobs);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${users.length} (1 admin, ${users.length - 1} regular users)`);
    console.log(`💼 Jobs: ${jobs.length} from various companies`);
    console.log(`📝 Applications: ${applications.length} with different statuses`);
    
    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@jobseeker.com / admin123');
    console.log('User 1: john.doe@email.com / password123');
    console.log('User 2: jane.smith@email.com / password123');
    console.log('User 3: mike.johnson@email.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };