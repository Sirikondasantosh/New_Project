import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPinIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BookmarkIcon,
  ShareIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface JobDetails {
  _id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  requirements: string[];
  skills: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  jobType: string;
  experienceLevel: string;
  postedDate: string;
  source: {
    portal: string;
    url: string;
  };
  companyInfo?: {
    size?: string;
    industry?: string;
    website?: string;
    logo?: string;
  };
  isBookmarked?: boolean;
  matchScore?: number;
  hasApplied?: boolean;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (id) {
      fetchJobDetails(id);
    }
  }, [id]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setLoading(true);
      const response = await api.jobs.getJob(jobId);
      setJob(response.data.job);
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load job details.'
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!job) return;
    
    try {
      // This would call the bookmark API
      setJob(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
      
      addToast({
        type: 'success',
        title: 'Bookmark Updated',
        message: job.isBookmarked ? 'Job removed from bookmarks' : 'Job added to bookmarks'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update bookmark.'
      });
    }
  };

  const handleApply = async () => {
    if (!job || !id) return;

    // Check if user has reached daily limit
    if (user?.subscription?.plan === 'free' && user?.applicationStats?.dailyApplications?.[0]?.count >= 5) {
      addToast({
        type: 'warning',
        title: 'Daily Limit Reached',
        message: 'You have reached your daily application limit. Upgrade to apply to more jobs.'
      });
      navigate('/subscription');
      return;
    }

    setApplying(true);

    try {
      await api.applications.apply({
        jobId: id,
        coverLetter: coverLetter.trim() || undefined
      });

      setJob(prev => prev ? { ...prev, hasApplied: true } : null);
      setShowApplicationModal(false);
      setCoverLetter('');

      addToast({
        type: 'success',
        title: 'Application Submitted!',
        message: 'Your application has been submitted successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Application Failed',
        message: error.response?.data?.message || 'Failed to submit application.'
      });
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (salary: JobDetails['salary']) => {
    if (!salary) return null;
    const { min, max, currency, period } = salary;
    const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
    
    if (min && max) {
      return `${currency}${formatNumber(min)} - ${currency}${formatNumber(max)}/${period}`;
    } else if (min) {
      return `${currency}${formatNumber(min)}+/${period}`;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareJob = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job?.title} at ${job?.company}`,
          text: `Check out this job opportunity: ${job?.title} at ${job?.company}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Job link copied to clipboard!'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to share job.'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="card p-6 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Job not found</h3>
        <p className="mt-1 text-sm text-gray-500">The job you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/jobs" className="btn-primary">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link 
        to="/jobs" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              {job.matchScore && (
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {job.matchScore}% match
                </span>
              )}
            </div>
            <p className="text-xl text-gray-600 font-medium mb-3">{job.company}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {job.location}
                {job.remote && <span className="ml-2 text-green-600">• Remote</span>}
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-1" />
                <span className="capitalize">{job.jobType}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Posted {formatDate(job.postedDate)}
              </div>
              {job.salary && (
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  {formatSalary(job.salary)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleBookmark}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              {job.isBookmarked ? (
                <BookmarkSolidIcon className="h-6 w-6 text-blue-600" />
              ) : (
                <BookmarkIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={shareJob}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <ShareIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {job.hasApplied ? (
            <div className="flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Applied</span>
            </div>
          ) : (
            <button
              onClick={() => setShowApplicationModal(true)}
              className="btn-primary px-6 py-3 flex items-center justify-center"
            >
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              Apply Now
            </button>
          )}
          
          <a
            href={job.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-6 py-3 flex items-center justify-center"
          >
            View on {job.source.portal}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          {job.companyInfo && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.company}</h3>
              <div className="space-y-3">
                {job.companyInfo.industry && (
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">{job.companyInfo.industry}</span>
                  </div>
                )}
                {job.companyInfo.size && (
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">{job.companyInfo.size}</span>
                  </div>
                )}
                {job.companyInfo.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <a
                      href={job.companyInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Company Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Experience Level</span>
                <p className="text-gray-900 capitalize">{job.experienceLevel}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Job Type</span>
                <p className="text-gray-900 capitalize">{job.jobType.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Source</span>
                <p className="text-gray-900 capitalize">{job.source.portal}</p>
              </div>
            </div>
          </div>

          {/* Similar Jobs */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h3>
            <div className="space-y-3">
              <Link to="/jobs" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h4 className="font-medium text-gray-900">Frontend Developer</h4>
                <p className="text-sm text-gray-600">TechCorp Inc.</p>
                <p className="text-xs text-gray-500">San Francisco, CA</p>
              </Link>
              <Link to="/jobs" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h4 className="font-medium text-gray-900">React Developer</h4>
                <p className="text-sm text-gray-600">StartupXYZ</p>
                <p className="text-xs text-gray-500">Remote</p>
              </Link>
            </div>
            <Link to="/jobs" className="block mt-4 text-center text-blue-600 hover:text-blue-700 font-medium">
              View More Similar Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Apply to {job.title}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder="Tell the employer why you're interested in this role..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="btn-secondary flex-1"
                disabled={applying}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="btn-primary flex-1"
              >
                {applying ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Applying...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}