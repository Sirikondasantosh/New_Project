import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface Job {
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
    logo?: string;
  };
  isBookmarked?: boolean;
  matchScore?: number;
}

interface Filters {
  location: string;
  jobType: string;
  experienceLevel: string;
  remote: boolean | null;
  salaryMin: string;
  skills: string[];
}

const jobTypes = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];
const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
const popularSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'];

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    location: searchParams.get('location') || '',
    jobType: searchParams.get('type') || '',
    experienceLevel: searchParams.get('level') || '',
    remote: searchParams.get('remote') === 'true' ? true : searchParams.get('remote') === 'false' ? false : null,
    salaryMin: searchParams.get('salary') || '',
    skills: searchParams.get('skills')?.split(',').filter(Boolean) || []
  });

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, filters, currentPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.location) params.append('location', filters.location);
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
      if (filters.remote !== null) params.append('remote', filters.remote.toString());
      if (filters.salaryMin) params.append('salaryMin', filters.salaryMin);
      if (filters.skills.length > 0) params.append('skills', filters.skills.join(','));
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const response = await api.jobs.getJobs(params.toString());
      setJobs(response.data.jobs);
      setTotalJobs(response.data.total);
      
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load jobs. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (filters.location) params.append('location', filters.location);
    if (filters.jobType) params.append('type', filters.jobType);
    if (filters.experienceLevel) params.append('level', filters.experienceLevel);
    if (filters.remote !== null) params.append('remote', filters.remote.toString());
    if (filters.salaryMin) params.append('salary', filters.salaryMin);
    if (filters.skills.length > 0) params.append('skills', filters.skills.join(','));
    
    setSearchParams(params);
  };

  const toggleSkillFilter = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      jobType: '',
      experienceLevel: '',
      remote: null,
      salaryMin: '',
      skills: []
    });
    setSearchQuery('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const formatSalary = (salary: Job['salary']) => {
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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const toggleBookmark = async (jobId: string) => {
    try {
      // This would call the bookmark API
      setJobs(prev => prev.map(job => 
        job._id === jobId 
          ? { ...job, isBookmarked: !job.isBookmarked }
          : job
      ));
      
      addToast({
        type: 'success',
        title: 'Bookmark Updated',
        message: 'Job bookmark status updated successfully.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update bookmark.'
      });
    }
  };

  const totalPages = Math.ceil(totalJobs / 12);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center px-4 py-2"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                Filters
                {(filters.location || filters.jobType || filters.experienceLevel || filters.remote !== null || filters.salaryMin || filters.skills.length > 0) && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {[filters.location, filters.jobType, filters.experienceLevel, filters.remote !== null ? 1 : 0, filters.salaryMin, filters.skills.length].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button type="submit" className="btn-primary px-6 py-2">
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State, or Remote"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="input-field"
                />
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <select
                  value={filters.jobType}
                  onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Types</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>
                      {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Levels</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Salary</label>
                <select
                  value={filters.salaryMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Any Salary</option>
                  <option value="40000">$40,000+</option>
                  <option value="60000">$60,000+</option>
                  <option value="80000">$80,000+</option>
                  <option value="100000">$100,000+</option>
                  <option value="120000">$120,000+</option>
                  <option value="150000">$150,000+</option>
                </select>
              </div>
            </div>

            {/* Remote Work */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="remote"
                    checked={filters.remote === null}
                    onChange={() => setFilters(prev => ({ ...prev, remote: null }))}
                    className="mr-2"
                  />
                  All
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="remote"
                    checked={filters.remote === true}
                    onChange={() => setFilters(prev => ({ ...prev, remote: true }))}
                    className="mr-2"
                  />
                  Remote
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="remote"
                    checked={filters.remote === false}
                    onChange={() => setFilters(prev => ({ ...prev, remote: false }))}
                    className="mr-2"
                  />
                  On-site
                </label>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkillFilter(skill)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.skills.includes(skill)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                    {filters.skills.includes(skill) && (
                      <XMarkIcon className="inline h-4 w-4 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear all filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  updateSearchParams();
                  setShowFilters(false);
                }}
                className="btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {totalJobs > 0 ? `${totalJobs.toLocaleString()} jobs found` : 'No jobs found'}
          </h2>
          {searchQuery && (
            <p className="text-sm text-gray-600">for "{searchQuery}"</p>
          )}
        </div>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-6 bg-gray-200 rounded w-16"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job._id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                    {job.matchScore && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {job.matchScore}% match
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 font-medium">{job.company}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {job.location}
                    {job.remote && <span className="ml-2 text-green-600">• Remote</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleBookmark(job._id)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {job.isBookmarked ? (
                    <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
                  ) : (
                    <BookmarkIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {job.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{job.skills.length - 4} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-1" />
                    <span className="capitalize">{job.jobType}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDate(job.postedDate)}
                  </div>
                  {job.salary && (
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      {formatSalary(job.salary)}
                    </div>
                  )}
                </div>
                <Link
                  to={`/jobs/${job._id}`}
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
          <div className="mt-6">
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}