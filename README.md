# JobSeeker Pro - Comprehensive Job Application System

A full-stack job application management system with AI-powered resume parsing, job scraping from multiple portals, subscription management, and comprehensive analytics.

## Features

### 🔍 **Job Search & Management**
- **Multi-Portal Job Scraping**: Automatically scrape jobs from Indeed, LinkedIn, Glassdoor, and more
- **Advanced Search & Filtering**: Find jobs by location, skills, salary, experience level
- **Real-time Job Updates**: Daily job scraping with automatic database updates
- **Job Match Scoring**: AI-powered matching between your resume and job requirements

### 📄 **Smart Resume Management**
- **AI Resume Parsing**: Extract skills, experience, education, and contact information
- **Resume-Job Matching**: Calculate compatibility scores for each job
- **Resume Suggestions**: Get personalized recommendations to improve your resume
- **Multiple Resume Support**: Upload and manage different versions of your resume

### 📊 **Application Tracking**
- **Comprehensive Dashboard**: Track all applications in one place
- **Status Management**: Update application status (Applied, Interview, Offer, etc.)
- **Interview Scheduling**: Track interview dates and types
- **Follow-up Reminders**: Never miss important follow-up dates
- **Salary Negotiation Tracking**: Record offered, negotiated, and final salaries

### 💳 **Subscription Management**
- **Flexible Plans**: Free (5/day), Basic (25/day), Premium (100/day) application limits
- **Stripe Integration**: Secure payment processing
- **Usage Analytics**: Track daily and monthly application counts
- **Billing History**: View all payment history and invoices

### 👨‍💼 **Admin Dashboard**
- **User Management**: View, edit, and manage user accounts
- **Job Management**: Control job listings and scraping
- **Analytics**: Comprehensive system analytics and reporting
- **System Maintenance**: Database cleanup and system monitoring

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Stripe** for payment processing
- **Puppeteer** for web scraping
- **Natural** for text processing and resume parsing
- **PDF-Parse** for resume extraction
- **Multer** for file uploads

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Headless UI** for components
- **Axios** for API calls

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd job-application-system
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Environment Setup

Create `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-application-system
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Create `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the necessary collections.

### 5. Run the Application

From the root directory:
```bash
# Run both client and server concurrently
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - Get jobs with filters
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs/search` - Advanced job search
- `POST /api/jobs/scrape` - Trigger job scraping (Admin only)

### Applications
- `POST /api/applications/apply` - Apply to a job
- `GET /api/applications/my-applications` - Get user applications
- `PUT /api/applications/:id/status` - Update application status
- `GET /api/applications/stats/overview` - Get application statistics

### Resume
- `POST /api/resume/upload` - Upload and parse resume
- `GET /api/resume/current` - Get current resume
- `POST /api/resume/analyze/:jobId` - Analyze resume against job

### Subscription
- `GET /api/subscription/plans` - Get available plans
- `POST /api/subscription/create-checkout-session` - Create Stripe session
- `GET /api/subscription/usage` - Get usage statistics

### Admin
- `GET /api/admin/dashboard/stats` - Admin dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/jobs` - Get all jobs
- `GET /api/admin/analytics` - System analytics

## Features in Detail

### Job Scraping
The system automatically scrapes jobs from multiple portals:
- **Indeed**: Uses Cheerio for HTML parsing
- **LinkedIn**: Uses Puppeteer for dynamic content
- **Glassdoor**: Uses Puppeteer with advanced selectors
- **Extensible**: Easy to add new job portals

### Resume Parsing
Advanced AI-powered resume parsing:
- **PDF Text Extraction**: Extract text from PDF resumes
- **Skill Detection**: Identify technical and soft skills
- **Experience Parsing**: Extract work experience and roles
- **Education Extraction**: Parse educational background
- **Contact Information**: Extract email, phone, LinkedIn, GitHub

### Match Scoring Algorithm
Sophisticated matching between resumes and jobs:
- **Skill Matching**: Compare resume skills with job requirements
- **Experience Relevance**: Analyze experience level compatibility
- **Text Similarity**: Use TF-IDF for content similarity
- **Weighted Scoring**: Combine multiple factors for final score

### Subscription System
Flexible subscription management:
- **Daily Limits**: Enforce application limits based on plan
- **Stripe Integration**: Secure payment processing
- **Webhook Handling**: Real-time subscription updates
- **Usage Tracking**: Monitor daily and monthly usage

## User Roles

### Regular User
- Search and apply to jobs
- Upload and manage resume
- Track applications and interviews
- View personal analytics
- Manage subscription

### Admin User
- Manage all users and applications
- Control job scraping and listings
- View system-wide analytics
- Perform system maintenance
- Monitor usage and revenue

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for production security
- **Helmet.js**: Security headers and protection

## Deployment

### Production Environment Variables
Update environment variables for production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobseeker
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
CLIENT_URL=https://yourdomain.com
```

### Build for Production
```bash
# Build client
cd client && npm run build

# Start production server
cd ../server && npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@jobseekerpro.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Chrome extension for job applications
- [ ] Integration with more job portals
- [ ] Advanced AI recommendations
- [ ] Team/company accounts
- [ ] Interview preparation tools
- [ ] Salary negotiation assistance

---

**JobSeeker Pro** - Streamline your job search with intelligent automation and tracking.
