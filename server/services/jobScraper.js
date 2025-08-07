const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { Job } = require('../models/Job');

class JobScraper {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // LinkedIn Jobs Scraper (Note: LinkedIn has strict anti-scraping measures)
  async scrapeLinkedInJobs(searchTerm, location, limit = 10) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);

      const jobs = await page.evaluate(() => {
        const jobCards = document.querySelectorAll('.job-search-card');
        return Array.from(jobCards).slice(0, 10).map(card => {
          const titleElement = card.querySelector('.base-search-card__title');
          const companyElement = card.querySelector('.base-search-card__subtitle');
          const locationElement = card.querySelector('.job-search-card__location');
          const linkElement = card.querySelector('.base-card__full-link');
          
          return {
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            url: linkElement?.href || '',
            portal: 'linkedin'
          };
        });
      });

      return jobs.filter(job => job.title && job.company);
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return [];
    }
  }

  // Indeed Jobs Scraper
  async scrapeIndeedJobs(searchTerm, location, limit = 10) {
    try {
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(searchTerm)}&l=${encodeURIComponent(location)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      $('.job_seen_beacon').each((index, element) => {
        if (index >= limit) return false;

        const $element = $(element);
        const title = $element.find('[data-jk] h2 a span').text().trim();
        const company = $element.find('[data-testid="company-name"]').text().trim();
        const location = $element.find('[data-testid="job-location"]').text().trim();
        const salary = $element.find('.metadata.salary-snippet-container').text().trim();
        const snippet = $element.find('.job-snippet').text().trim();
        const jobKey = $element.find('[data-jk]').attr('data-jk');
        const url = jobKey ? `https://www.indeed.com/viewjob?jk=${jobKey}` : '';

        if (title && company) {
          jobs.push({
            title,
            company,
            location,
            description: snippet,
            salary: salary || null,
            url,
            portal: 'indeed',
            jobId: jobKey
          });
        }
      });

      return jobs;
    } catch (error) {
      console.error('Indeed scraping error:', error);
      return [];
    }
  }

  // Glassdoor Jobs Scraper
  async scrapeGlassdoorJobs(searchTerm, location, limit = 10) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(searchTerm)}&locT=C&locId=${encodeURIComponent(location)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      const jobs = await page.evaluate(() => {
        const jobCards = document.querySelectorAll('[data-test="job-listing"]');
        return Array.from(jobCards).slice(0, 10).map(card => {
          const titleElement = card.querySelector('[data-test="job-title"]');
          const companyElement = card.querySelector('[data-test="employer-name"]');
          const locationElement = card.querySelector('[data-test="job-location"]');
          const salaryElement = card.querySelector('[data-test="detailSalary"]');
          
          return {
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || null,
            portal: 'glassdoor'
          };
        });
      });

      return jobs.filter(job => job.title && job.company);
    } catch (error) {
      console.error('Glassdoor scraping error:', error);
      return [];
    }
  }

  // Generic job scraper that combines multiple sources
  async scrapeJobs(searchTerm, location = 'Remote', options = {}) {
    const { 
      sources = ['indeed'], // Default to Indeed as it's more reliable
      limit = 10,
      saveToDatabase = true 
    } = options;

    const allJobs = [];

    try {
      for (const source of sources) {
        console.log(`Scraping ${source} for: ${searchTerm} in ${location}`);
        
        let jobs = [];
        switch (source) {
          case 'indeed':
            jobs = await this.scrapeIndeedJobs(searchTerm, location, limit);
            break;
          case 'linkedin':
            jobs = await this.scrapeLinkedInJobs(searchTerm, location, limit);
            break;
          case 'glassdoor':
            jobs = await this.scrapeGlassdoorJobs(searchTerm, location, limit);
            break;
          default:
            console.log(`Unknown source: ${source}`);
            continue;
        }

        // Process and standardize job data
        const processedJobs = jobs.map(job => ({
          title: job.title,
          company: job.company,
          description: job.description || `${job.title} position at ${job.company}`,
          location: job.location,
          remote: job.location?.toLowerCase().includes('remote') || false,
          source: {
            portal: job.portal,
            url: job.url,
            jobId: job.jobId
          },
          skills: this.extractSkills(job.description || job.title),
          requirements: this.extractRequirements(job.description || ''),
          postedDate: new Date(),
          scrapedAt: new Date()
        }));

        allJobs.push(...processedJobs);

        // Add delay between sources to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Save to database if requested
      if (saveToDatabase && allJobs.length > 0) {
        await this.saveJobsToDatabase(allJobs);
      }

      console.log(`Successfully scraped ${allJobs.length} jobs`);
      return allJobs;

    } catch (error) {
      console.error('Job scraping error:', error);
      return [];
    }
  }

  // Extract skills from job description
  extractSkills(text) {
    if (!text) return [];
    
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
      'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
      'Git', 'TypeScript', 'Express', 'Django', 'Flask', 'Spring', 'REST API',
      'GraphQL', 'Redis', 'Elasticsearch', 'Jenkins', 'CI/CD', 'Agile', 'Scrum'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  // Extract requirements from job description
  extractRequirements(text) {
    if (!text) return [];
    
    const requirements = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (lowerSentence.includes('require') || 
          lowerSentence.includes('must have') || 
          lowerSentence.includes('experience with')) {
        requirements.push(sentence.trim());
      }
    });

    return requirements.slice(0, 5); // Limit to 5 requirements
  }

  // Save jobs to database
  async saveJobsToDatabase(jobs) {
    try {
      const savedJobs = [];
      
      for (const jobData of jobs) {
        // Check if job already exists (by title, company, and source)
        const existingJob = await Job.findOne({
          title: jobData.title,
          company: jobData.company,
          'source.portal': jobData.source.portal
        });

        if (!existingJob) {
          const job = new Job(jobData);
          await job.save();
          savedJobs.push(job);
        }
      }

      console.log(`Saved ${savedJobs.length} new jobs to database`);
      return savedJobs;
    } catch (error) {
      console.error('Error saving jobs to database:', error);
      throw error;
    }
  }

  // Clean up old jobs (older than 30 days)
  async cleanupOldJobs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Job.deleteMany({
        scrapedAt: { $lt: thirtyDaysAgo }
      });

      console.log(`Cleaned up ${result.deletedCount} old jobs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      throw error;
    }
  }
}

module.exports = JobScraper;