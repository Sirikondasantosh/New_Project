const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const DatabaseManager = require('./utils/database');
const CronManager = require('./utils/cronJobs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database and cron managers
const dbManager = new DatabaseManager();
const cronManager = new CronManager();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded resumes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection and initialization
async function initializeDatabase() {
  try {
    await dbManager.connect();
    
    // Create indexes on startup
    await dbManager.createIndexes();
    
    console.log('🎉 Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Initialize cron jobs
function initializeCronJobs() {
  if (process.env.NODE_ENV === 'production') {
    cronManager.init();
    cronManager.startAll();
    console.log('⏰ Cron jobs initialized for production');
  } else {
    console.log('⏰ Cron jobs disabled in development mode');
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/resume', require('./routes/resume'));

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await dbManager.healthCheck();
    const cronStatus = cronManager.getStatus();
    
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      cronJobs: cronStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Database management endpoints (admin only)
app.get('/api/admin/database/stats', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, async (req, res) => {
  try {
    const stats = await dbManager.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching database stats',
      error: error.message
    });
  }
});

app.post('/api/admin/database/backup', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, async (req, res) => {
  try {
    const backupPath = await dbManager.backup();
    res.json({
      success: true,
      message: 'Backup created successfully',
      backupPath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating backup',
      error: error.message
    });
  }
});

app.post('/api/admin/database/cleanup', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, async (req, res) => {
  try {
    await dbManager.cleanup();
    res.json({
      success: true,
      message: 'Database cleanup completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during cleanup',
      error: error.message
    });
  }
});

// Cron job management endpoints (admin only)
app.get('/api/admin/cron/status', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, (req, res) => {
  try {
    const status = cronManager.getStatus();
    res.json({
      success: true,
      cronJobs: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cron status',
      error: error.message
    });
  }
});

app.post('/api/admin/cron/run/:jobName', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, async (req, res) => {
  try {
    const { jobName } = req.params;
    await cronManager.runJob(jobName);
    res.json({
      success: true,
      message: `Cron job ${jobName} executed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error running cron job',
      error: error.message
    });
  }
});

app.post('/api/admin/jobs/manual-scrape', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, async (req, res) => {
  try {
    const { searchTerms = [], locations = [], options = {} } = req.body;
    const totalScraped = await cronManager.manualJobScraping(searchTerms, locations, options);
    res.json({
      success: true,
      message: 'Manual job scraping completed',
      totalScraped
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during manual scraping',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Initialize cron jobs
    initializeCronJobs();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🛠️  Development Commands:');
        console.log('   Database setup: node scripts/db-setup.js setup');
        console.log('   Database stats: node scripts/db-setup.js stats');
        console.log('   Database backup: node scripts/db-setup.js backup');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n👋 SIGTERM received. Shutting down gracefully...');
  
  try {
    // Stop cron jobs
    cronManager.stopAll();
    
    // Close database connection
    await dbManager.disconnect();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  
  try {
    // Stop cron jobs
    cronManager.stopAll();
    
    // Close database connection
    await dbManager.disconnect();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();

module.exports = app;