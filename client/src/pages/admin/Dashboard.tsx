import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  CogIcon,
  ServerIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  jobs: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  applications: {
    total: number;
    today: number;
    thisWeek: number;
    growth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  system: {
    uptime: number;
    dbSize: string;
    apiCalls: number;
    errors: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'job_applied' | 'subscription_upgraded' | 'job_scraped';
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { addToast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        api.admin.getDashboardStats(),
        api.admin.getRecentActivity()
      ]);
      
      setStats(statsResponse.data.stats);
      setRecentActivity(activityResponse.data.activities || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load dashboard data.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    
    addToast({
      type: 'success',
      title: 'Refreshed',
      message: 'Dashboard data has been updated.'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <UsersIcon className="h-5 w-5 text-green-500" />;
      case 'job_applied':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'subscription_upgraded':
        return <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />;
      case 'job_scraped':
        return <BriefcaseIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowTrendingUpIcon className="h-4 w-4" />;
    if (growth < 0) return <ArrowTrendingDownIcon className="h-4 w-4" />;
    return null;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center"
          >
            {refreshing ? (
              <>
                <div className="spinner mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </button>
          <Link to="/admin/analytics" className="btn-primary flex items-center">
            <EyeIcon className="h-4 w-4 mr-2" />
            View Analytics
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.users.total)}</p>
                <div className={`flex items-center mt-1 ${getGrowthColor(stats.users.growth)}`}>
                  {getGrowthIcon(stats.users.growth)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(stats.users.growth)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Active</p>
                <p className="font-semibold text-gray-900">{formatNumber(stats.users.active)}</p>
              </div>
              <div>
                <p className="text-gray-600">New</p>
                <p className="font-semibold text-gray-900">{formatNumber(stats.users.new)}</p>
              </div>
            </div>
          </div>

          {/* Jobs */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.jobs.total)}</p>
                <div className={`flex items-center mt-1 ${getGrowthColor(stats.jobs.growth)}`}>
                  {getGrowthIcon(stats.jobs.growth)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(stats.jobs.growth)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Active</p>
                <p className="font-semibold text-gray-900">{formatNumber(stats.jobs.active)}</p>
              </div>
              <div>
                <p className="text-gray-600">New</p>
                <p className="font-semibold text-gray-900">{formatNumber(stats.jobs.new)}</p>
              </div>
            </div>
          </div>

          {/* Applications */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.applications.total)}</p>
                <div className={`flex items-center mt-1 ${getGrowthColor(stats.applications.growth)}`}>
                  {getGrowthIcon(stats.applications.growth)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(stats.applications.growth)}% from last week
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Today</p>
                <p className="font-semibold text-gray-900">{formatNumber(stats.applications.today)}</p>
              </div>
              <div>
                <p className="text-gray-600">This Week</p>
                <p className="font-semibold text-gray-900">{formatNumber(stats.applications.thisWeek)}</p>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue.total)}</p>
                <div className={`flex items-center mt-1 ${getGrowthColor(stats.revenue.growth)}`}>
                  {getGrowthIcon(stats.revenue.growth)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(stats.revenue.growth)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">This Month</p>
                <p className="font-semibold text-gray-900">{formatCurrency(stats.revenue.thisMonth)}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Month</p>
                <p className="font-semibold text-gray-900">{formatCurrency(stats.revenue.lastMonth)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Status */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-600">All Systems Operational</span>
              </div>
            </div>

            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <ServerIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Server Uptime</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {Math.floor(stats.system.uptime / 24)}d {stats.system.uptime % 24}h
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CircleStackIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Database Size</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats.system.dbSize}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">API Calls Today</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(stats.system.apiCalls)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Errors (24h)</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    stats.system.errors > 10 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stats.system.errors}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Link to="/admin/system" className="btn-secondary w-full flex items-center justify-center">
                <CogIcon className="h-4 w-4 mr-2" />
                System Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Link to="/admin/logs" className="text-sm text-blue-600 hover:text-blue-700">
                View All Logs
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      {activity.user && (
                        <p className="text-xs text-gray-600 mt-1">
                          {activity.user.name} ({activity.user.email})
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600 mt-2">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/users" className="btn-secondary flex items-center justify-center p-4 h-20">
            <div className="text-center">
              <UsersIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
              <span className="text-sm font-medium">Manage Users</span>
            </div>
          </Link>
          
          <Link to="/admin/jobs" className="btn-secondary flex items-center justify-center p-4 h-20">
            <div className="text-center">
              <BriefcaseIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
              <span className="text-sm font-medium">Manage Jobs</span>
            </div>
          </Link>
          
          <Link to="/admin/analytics" className="btn-secondary flex items-center justify-center p-4 h-20">
            <div className="text-center">
              <ChartBarIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
              <span className="text-sm font-medium">View Analytics</span>
            </div>
          </Link>
          
          <button className="btn-secondary flex items-center justify-center p-4 h-20">
            <div className="text-center">
              <CogIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
              <span className="text-sm font-medium">System Settings</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}