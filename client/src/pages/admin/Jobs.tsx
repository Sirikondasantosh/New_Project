import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { adminAPI } from '../../services/api';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  salary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits?: string[];
  skills: string[];
  experience: string;
  education?: string;
  isActive: boolean;
  source: string;
  sourceUrl: string;
  postedDate: string;
  scrapedDate: string;
  applicationCount: number;
  viewCount: number;
}

interface JobFilters {
  search: string;
  location: string;
  type: string;
  experience: string;
  isActive: string;
  source: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ScrapeJobData {
  keywords: string;
  location: string;
  source: string;
  maxJobs: number;
}

export default function AdminJobs() {
  const { addToast } = useToast();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    location: '',
    type: '',
    experience: '',
    isActive: '',
    source: '',
    sortBy: 'scrapedDate',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeData, setScrapeData] = useState<ScrapeJobData>({
    keywords: '',
    location: '',
    source: 'indeed',
    maxJobs: 50
  });

  useEffect(() => {
    fetchJobs();
  }, [filters, currentPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: currentPage,
        limit: 20
      };
      
      const response = await adminAPI.getJobs(params);
      setJobs(response.data.jobs);
      setTotalPages(response.data.totalPages);
      setTotalJobs(response.data.totalJobs);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load jobs.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job._id));
    }
  };

  const handleToggleJobActive = async (jobId: string, isActive: boolean) => {
    try {
      await adminAPI.toggleJobActive(jobId);
      setJobs(prev => prev.map(job => 
        job._id === jobId ? { ...job, isActive: !isActive } : job
      ));
      
      addToast({
        type: 'success',
        title: 'Success',
        message: `Job ${!isActive ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error: any) {
      console.error('Error toggling job status:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update job status.'
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteJob(jobId);
      setJobs(prev => prev.filter(job => job._id !== jobId));
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
      
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Job deleted successfully.'
      });
    } catch (error: any) {
      console.error('Error deleting job:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete job.'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedJobs.length} jobs? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(selectedJobs.map(jobId => adminAPI.deleteJob(jobId)));
      setJobs(prev => prev.filter(job => !selectedJobs.includes(job._id)));
      setSelectedJobs([]);
      
      addToast({
        type: 'success',
        title: 'Success',
        message: `${selectedJobs.length} jobs deleted successfully.`
      });
    } catch (error: any) {
      console.error('Error deleting jobs:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete some jobs.'
      });
    }
  };

  const handleBulkToggleActive = async (activate: boolean) => {
    if (selectedJobs.length === 0) return;

    try {
      await Promise.all(selectedJobs.map(jobId => adminAPI.toggleJobActive(jobId)));
      setJobs(prev => prev.map(job => 
        selectedJobs.includes(job._id) ? { ...job, isActive: activate } : job
      ));
      setSelectedJobs([]);
      
      addToast({
        type: 'success',
        title: 'Success',
        message: `${selectedJobs.length} jobs ${activate ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error: any) {
      console.error('Error updating job status:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update some job statuses.'
      });
    }
  };

  const handleScrapeJobs = async () => {
    if (!scrapeData.keywords.trim()) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please enter keywords to search for jobs.'
      });
      return;
    }

    try {
      setScraping(true);
      const response = await adminAPI.scrapeJobs(scrapeData);
      
      addToast({
        type: 'success',
        title: 'Success',
        message: `Job scraping initiated. ${response.data.jobsFound} jobs will be processed.`
      });
      
      setShowScrapeModal(false);
      setScrapeData({
        keywords: '',
        location: '',
        source: 'indeed',
        maxJobs: 50
      });
      
      // Refresh the job list after a delay
      setTimeout(() => {
        fetchJobs();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error scraping jobs:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to start job scraping.'
      });
    } finally {
      setScraping(false);
    }
  };

  const formatSalary = (salary?: { min?: number; max?: number; currency: string }) => {
    if (!salary) return 'Not specified';
    
    const format = (amount: number) => 
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: salary.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);

    if (salary.min && salary.max) {
      return `${format(salary.min)} - ${format(salary.max)}`;
    } else if (salary.min) {
      return `From ${format(salary.min)}`;
    } else if (salary.max) {
      return `Up to ${format(salary.max)}`;
    }
    
    return 'Not specified';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getJobTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-purple-100 text-purple-800',
      'freelance': 'bg-orange-100 text-orange-800',
      'internship': 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSourceColor = (source: string) => {
    const colors = {
      'indeed': 'bg-blue-100 text-blue-800',
      'linkedin': 'bg-blue-100 text-blue-800',
      'glassdoor': 'bg-green-100 text-green-800',
      'monster': 'bg-purple-100 text-purple-800',
      'ziprecruiter': 'bg-orange-100 text-orange-800'
    };
    return colors[source.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600 mt-1">Manage job listings and scraping operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowScrapeModal(true)}
            className="btn-secondary flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Scrape Jobs
          </button>
          <button
            onClick={fetchJobs}
            className="btn-primary flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter(job => job.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <PauseIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter(job => !job.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <EyeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.reduce((sum, job) => sum + job.viewCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              placeholder="Any location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="input-field"
            >
              <option value="">All Jobs</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input-field"
              >
                <option value="scrapedDate">Date Added</option>
                <option value="postedDate">Date Posted</option>
                <option value="title">Job Title</option>
                <option value="company">Company</option>
                <option value="applicationCount">Applications</option>
                <option value="viewCount">Views</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                className="input-field"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
          
          {selectedJobs.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedJobs.length} selected</span>
              <button
                onClick={() => handleBulkToggleActive(true)}
                className="btn-secondary text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkToggleActive(false)}
                className="btn-secondary text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn-danger text-sm"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or scrape new jobs.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedJobs.length === jobs.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company & Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job._id)}
                          onChange={() => handleSelectJob(job._id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {job.title}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(job.source)}`}>
                              {job.source}
                            </span>
                            <span className="text-xs text-gray-500">
                              Posted {formatDate(job.postedDate)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{job.company}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {job.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(job.type)}`}>
                          {job.type.replace('-', ' ')}
                        </span>
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                          {formatSalary(job.salary)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{job.applicationCount} applications</div>
                        <div className="text-sm text-gray-500">{job.viewCount} views</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(job.sourceUrl, '_blank')}
                            className="text-gray-400 hover:text-gray-600"
                            title="View Original"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleJobActive(job._id, job.isActive)}
                            className={`${job.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                            title={job.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {job.isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job._id)}
                            className="text-red-400 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 20, totalJobs)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalJobs}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scrape Jobs Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Scrape New Jobs</h3>
                <button
                  onClick={() => setShowScrapeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., React Developer, Data Scientist"
                    value={scrapeData.keywords}
                    onChange={(e) => setScrapeData(prev => ({ ...prev, keywords: e.target.value }))}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., San Francisco, CA"
                    value={scrapeData.location}
                    onChange={(e) => setScrapeData(prev => ({ ...prev, location: e.target.value }))}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <select
                    value={scrapeData.source}
                    onChange={(e) => setScrapeData(prev => ({ ...prev, source: e.target.value }))}
                    className="input-field"
                  >
                    <option value="indeed">Indeed</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="glassdoor">Glassdoor</option>
                    <option value="monster">Monster</option>
                    <option value="ziprecruiter">ZipRecruiter</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Jobs
                  </label>
                  <select
                    value={scrapeData.maxJobs}
                    onChange={(e) => setScrapeData(prev => ({ ...prev, maxJobs: parseInt(e.target.value) }))}
                    className="input-field"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowScrapeModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScrapeJobs}
                  disabled={scraping || !scrapeData.keywords.trim()}
                  className="btn-primary flex items-center"
                >
                  {scraping ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Scraping...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Start Scraping
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}