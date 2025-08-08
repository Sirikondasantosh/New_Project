import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useToast } from '../../contexts/ToastContext';
import { adminAPI } from '../../services/api';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
    totalRevenue: number;
    userGrowth: number;
    jobGrowth: number;
    applicationGrowth: number;
    revenueGrowth: number;
  };
  userMetrics: {
    registrations: Array<{ date: string; count: number }>;
    activeUsers: Array<{ date: string; count: number }>;
    subscriptionDistribution: Array<{ name: string; value: number; color: string }>;
    userRetention: Array<{ period: string; rate: number }>;
  };
  jobMetrics: {
    jobPostings: Array<{ date: string; count: number }>;
    jobsByCategory: Array<{ category: string; count: number }>;
    jobsByLocation: Array<{ location: string; count: number }>;
    scrapeSuccess: Array<{ date: string; success: number; failed: number }>;
  };
  applicationMetrics: {
    applicationsOverTime: Array<{ date: string; applications: number }>;
    statusDistribution: Array<{ status: string; count: number; color: string }>;
    conversionFunnel: Array<{ stage: string; count: number; rate: number }>;
    avgTimeToHire: Array<{ month: string; days: number }>;
  };
  revenueMetrics: {
    monthlyRevenue: Array<{ month: string; revenue: number; subscriptions: number }>;
    planDistribution: Array<{ plan: string; revenue: number; users: number }>;
    churnRate: Array<{ month: string; rate: number }>;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AdminAnalytics() {
  const { addToast } = useToast();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load analytics data.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    
    addToast({
      type: 'success',
      title: 'Refreshed',
      message: 'Analytics data has been updated.'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500">Analytics data is not available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive system analytics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
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
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.totalUsers)}</p>
              <div className={`flex items-center mt-1 ${getGrowthColor(analytics.overview.userGrowth)}`}>
                {getGrowthIcon(analytics.overview.userGrowth)}
                <span className="text-sm font-medium ml-1">
                  {Math.abs(analytics.overview.userGrowth)}% from last period
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.totalJobs)}</p>
              <div className={`flex items-center mt-1 ${getGrowthColor(analytics.overview.jobGrowth)}`}>
                {getGrowthIcon(analytics.overview.jobGrowth)}
                <span className="text-sm font-medium ml-1">
                  {Math.abs(analytics.overview.jobGrowth)}% from last period
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.totalApplications)}</p>
              <div className={`flex items-center mt-1 ${getGrowthColor(analytics.overview.applicationGrowth)}`}>
                {getGrowthIcon(analytics.overview.applicationGrowth)}
                <span className="text-sm font-medium ml-1">
                  {Math.abs(analytics.overview.applicationGrowth)}% from last period
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.overview.totalRevenue)}</p>
              <div className={`flex items-center mt-1 ${getGrowthColor(analytics.overview.revenueGrowth)}`}>
                {getGrowthIcon(analytics.overview.revenueGrowth)}
                <span className="text-sm font-medium ml-1">
                  {Math.abs(analytics.overview.revenueGrowth)}% from last period
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Registrations Over Time */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Registrations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.userMetrics.registrations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Job Applications Over Time */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Applications Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.applicationMetrics.applicationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.userMetrics.subscriptionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.userMetrics.subscriptionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Application Status Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.applicationMetrics.statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueMetrics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Jobs by Category */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Jobs by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.jobMetrics.jobsByCategory.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Conversion Funnel</h3>
        <div className="space-y-4">
          {analytics.applicationMetrics.conversionFunnel.map((stage, index) => (
            <div key={stage.stage} className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{formatNumber(stage.count)}</span>
                    <span className="text-sm text-gray-500">({stage.rate.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${stage.rate}%` }}
                  ></div>
                </div>
              </div>
              {index < analytics.applicationMetrics.conversionFunnel.length - 1 && (
                <div className="ml-4">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Metrics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Job Locations */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Job Locations</h3>
          <div className="space-y-3">
            {analytics.jobMetrics.jobsByLocation.slice(0, 10).map((location, index) => (
              <div key={location.location} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-900 ml-2">{location.location}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{location.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Retention Rates */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Retention Rates</h3>
          <div className="space-y-3">
            {analytics.userMetrics.userRetention.map((retention) => (
              <div key={retention.period} className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{retention.period}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${retention.rate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{retention.rate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}