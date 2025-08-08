import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  EyeIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface DashboardStats {
  totalApplications: number;
  todayApplications: number;
  interviewsScheduled: number;
  pendingApplications: number;
  subscriptionLimit: number;
  subscriptionUsed: number;
}

interface RecentApplication {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedDate: string;
  matchScore?: number;
}

interface UpcomingInterview {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  type: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    todayApplications: 0,
    interviewsScheduled: 0,
    pendingApplications: 0,
    subscriptionLimit: 5,
    subscriptionUsed: 0
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await api.applications.getStats();
      setStats(statsResponse.data.stats);

      // Fetch recent applications
      const applicationsResponse = await api.applications.getMyApplications({ limit: 5 });
      setRecentApplications(applicationsResponse.data.applications);

      // Fetch upcoming interviews (mock data for now)
      setUpcomingInterviews([
        {
          id: '1',
          jobTitle: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          date: '2024-01-20T14:00:00Z',
          type: 'Video Call'
        },
        {
          id: '2',
          jobTitle: 'Full Stack Engineer',
          company: 'StartupXYZ',
          date: '2024-01-22T10:30:00Z',
          type: 'Phone Screen'
        }
      ]);
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-yellow-100 text-yellow-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return <ClockIcon className="h-4 w-4" />;
      case 'interview':
        return <CalendarDaysIcon className="h-4 w-4" />;
      case 'offer':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubscriptionLimitColor = () => {
    const percentage = (stats.subscriptionUsed / stats.subscriptionLimit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="mt-2 text-blue-100">
              Ready to take the next step in your career? Let's find your dream job.
            </p>
          </div>
          <div className="hidden md:block">
            <Link
              to="/jobs"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center"
            >
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Applications */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>+{stats.todayApplications} today</span>
          </div>
        </div>

        {/* Pending Applications */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-700">
              View all applications →
            </Link>
          </div>
        </div>

        {/* Interviews */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-3xl font-bold text-gray-900">{stats.interviewsScheduled}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Upcoming this week</span>
          </div>
        </div>

        {/* Daily Limit */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Limit</p>
              <p className={`text-3xl font-bold ${getSubscriptionLimitColor()}`}>
                {stats.subscriptionUsed}/{stats.subscriptionLimit}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/subscription" className="text-sm text-blue-600 hover:text-blue-700">
              Upgrade plan →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <Link 
              to="/applications" 
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              View all
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {recentApplications.length > 0 ? (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{application.jobTitle}</h3>
                    <p className="text-sm text-gray-600">{application.company}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Applied {formatDate(application.appliedDate)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {application.matchScore && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {application.matchScore}% match
                        </p>
                      </div>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span className="ml-1 capitalize">{application.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start applying to jobs to see them here.</p>
              <div className="mt-4">
                <Link to="/jobs" className="btn-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Find Jobs
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
            <Link 
              to="/applications?tab=interviews" 
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              View all
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {upcomingInterviews.length > 0 ? (
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{interview.jobTitle}</h3>
                    <p className="text-sm text-gray-600">{interview.company}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(interview.date)} • {interview.type}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews scheduled</h3>
              <p className="mt-1 text-sm text-gray-500">Keep applying to schedule interviews!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/jobs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <BriefcaseIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Browse Jobs</p>
              <p className="text-sm text-gray-600">Find your next opportunity</p>
            </div>
          </Link>

          <Link
            to="/resume"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Update Resume</p>
              <p className="text-sm text-gray-600">Keep your profile current</p>
            </div>
          </Link>

          <Link
            to="/applications"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <EyeIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Track Applications</p>
              <p className="text-sm text-gray-600">Monitor your progress</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}