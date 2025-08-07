const cron = require('cron');
const DatabaseManager = require('./database');
const JobScraper = require('../services/jobScraper');

class CronManager {
  constructor() {
    this.jobs = [];
    this.db = new DatabaseManager();
    this.jobScraper = new JobScraper();
  }

  // Initialize all cron jobs
  init() {
    console.log('⏰ Initializing cron jobs...');

    // Daily database cleanup (runs at 2 AM every day)
    this.addJob('database-cleanup', '0 2 * * *', async () => {
      console.log('🧹 Running daily database cleanup...');
      try {
        await this.db.cleanup();
        console.log('✅ Database cleanup completed');
      } catch (error) {
        console.error('❌ Database cleanup failed:', error);
      }
    });

    // Daily job scraping (runs at 6 AM every day)
    this.addJob('job-scraping', '0 6 * * *', async () => {
      console.log('🔍 Running daily job scraping...');
      try {
        const searchTerms = ['javascript developer', 'react developer', 'node.js developer', 'python developer', 'full stack developer'];
        const locations = ['Remote', 'San Francisco', 'New York', 'Austin', 'Seattle'];
        
        for (const term of searchTerms) {
          for (const location of locations) {
            try {
              await this.jobScraper.scrapeJobs(term, location, {
                sources: ['indeed'],
                limit: 10,
                saveToDatabase: true
              });
              
              // Add delay between requests to be respectful
              await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
              console.error(`❌ Failed to scrape ${term} in ${location}:`, error.message);
            }
          }
        }
        
        console.log('✅ Daily job scraping completed');
      } catch (error) {
        console.error('❌ Job scraping failed:', error);
      } finally {
        await this.jobScraper.closeBrowser();
      }
    });

    // Weekly database backup (runs at 3 AM every Sunday)
    this.addJob('database-backup', '0 3 * * 0', async () => {
      console.log('💾 Running weekly database backup...');
      try {
        await this.db.backup();
        console.log('✅ Database backup completed');
      } catch (error) {
        console.error('❌ Database backup failed:', error);
      }
    });

    // Monthly subscription cleanup (runs at 1 AM on the 1st of every month)
    this.addJob('subscription-cleanup', '0 1 1 * *', async () => {
      console.log('💳 Running monthly subscription cleanup...');
      try {
        const User = require('../models/User');
        
        // Mark expired subscriptions as inactive
        const now = new Date();
        const result = await User.updateMany(
          {
            'subscription.endDate': { $lt: now },
            'subscription.status': 'active'
          },
          {
            $set: { 'subscription.status': 'inactive' }
          }
        );
        
        console.log(`✅ Updated ${result.modifiedCount} expired subscriptions`);
      } catch (error) {
        console.error('❌ Subscription cleanup failed:', error);
      }
    });

    // Daily application stats reset (runs at midnight)
    this.addJob('reset-daily-stats', '0 0 * * *', async () => {
      console.log('📊 Resetting daily application counters...');
      try {
        const User = require('../models/User');
        
        // This is handled automatically by the incrementDailyApplications method
        // But we can use this job for other daily maintenance tasks
        
        console.log('✅ Daily stats maintenance completed');
      } catch (error) {
        console.error('❌ Daily stats maintenance failed:', error);
      }
    });

    console.log(`✅ Initialized ${this.jobs.length} cron jobs`);
  }

  // Add a new cron job
  addJob(name, schedule, task) {
    const job = new cron.CronJob({
      cronTime: schedule,
      onTick: async () => {
        console.log(`🔄 Running cron job: ${name}`);
        const startTime = Date.now();
        
        try {
          await task();
          const duration = Date.now() - startTime;
          console.log(`✅ Cron job ${name} completed in ${duration}ms`);
        } catch (error) {
          console.error(`❌ Cron job ${name} failed:`, error);
        }
      },
      start: false,
      timeZone: 'America/Los_Angeles'
    });

    this.jobs.push({ name, schedule, job });
    return job;
  }

  // Start all cron jobs
  startAll() {
    console.log('▶️  Starting all cron jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.start();
      console.log(`✅ Started cron job: ${name}`);
    });
    console.log(`🎉 All ${this.jobs.length} cron jobs are now running`);
  }

  // Stop all cron jobs
  stopAll() {
    console.log('⏹️  Stopping all cron jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`⏹️  Stopped cron job: ${name}`);
    });
    console.log('🛑 All cron jobs stopped');
  }

  // Get status of all cron jobs
  getStatus() {
    return this.jobs.map(({ name, schedule, job }) => ({
      name,
      schedule,
      running: job.running,
      lastDate: job.lastDate(),
      nextDate: job.nextDate()
    }));
  }

  // Run a specific job manually
  async runJob(jobName) {
    const job = this.jobs.find(j => j.name === jobName);
    if (!job) {
      throw new Error(`Job ${jobName} not found`);
    }

    console.log(`🔄 Manually running job: ${jobName}`);
    job.job.fireOnTick();
  }

  // Manual job scraping with custom parameters
  async manualJobScraping(searchTerms = [], locations = [], options = {}) {
    console.log('🔍 Running manual job scraping...');
    
    const defaultSearchTerms = ['software developer', 'web developer', 'full stack developer'];
    const defaultLocations = ['Remote', 'San Francisco', 'New York'];
    
    const terms = searchTerms.length > 0 ? searchTerms : defaultSearchTerms;
    const locs = locations.length > 0 ? locations : defaultLocations;
    
    const {
      sources = ['indeed'],
      limit = 10,
      saveToDatabase = true
    } = options;

    let totalScraped = 0;

    try {
      for (const term of terms) {
        for (const location of locs) {
          try {
            const jobs = await this.jobScraper.scrapeJobs(term, location, {
              sources,
              limit,
              saveToDatabase
            });
            
            totalScraped += jobs.length;
            console.log(`✅ Scraped ${jobs.length} jobs for "${term}" in "${location}"`);
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`❌ Failed to scrape "${term}" in "${location}":`, error.message);
          }
        }
      }
      
      console.log(`🎉 Manual scraping completed. Total jobs scraped: ${totalScraped}`);
      return totalScraped;
    } catch (error) {
      console.error('❌ Manual job scraping failed:', error);
      throw error;
    } finally {
      await this.jobScraper.closeBrowser();
    }
  }

  // Cleanup old jobs based on age and application count
  async cleanupOldJobs(maxAge = 60, minApplications = 1) {
    console.log(`🧹 Cleaning up jobs older than ${maxAge} days with less than ${minApplications} applications...`);
    
    try {
      const { Job } = require('../models/Job');
      const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
      
      const result = await Job.deleteMany({
        scrapedAt: { $lt: cutoffDate },
        applicationCount: { $lt: minApplications }
      });
      
      console.log(`✅ Cleaned up ${result.deletedCount} old jobs`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Job cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = CronManager;