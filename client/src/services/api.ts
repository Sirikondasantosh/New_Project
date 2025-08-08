import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  verifyToken: () => api.get('/auth/verify'),
};

// Jobs API
const jobsAPI = {
  getJobs: (params?: string) => api.get(`/jobs${params ? `?${params}` : ''}`),
  getJob: (id: string) => api.get(`/jobs/${id}`),
  searchJobs: (data: any) => api.post('/jobs/search', data),
  getJobStats: () => api.get('/jobs/stats/overview'),
  scrapeJobs: (data: any) => api.post('/jobs/scrape', data),
};

// Applications API
const applicationsAPI = {
  apply: (data: any) => api.post('/applications/apply', data),
  getMyApplications: (params?: string) => api.get(`/applications/my-applications${params ? `?${params}` : ''}`),
  getApplication: (id: string) => api.get(`/applications/${id}`),
  updateStatus: (id: string, data: any) => api.put(`/applications/${id}/status`, data),
  updateApplication: (id: string, data: any) => api.put(`/applications/${id}`, data),
  addInterview: (id: string, data: any) => api.put(`/applications/${id}/interview`, data),
  addFollowUp: (id: string, data: any) => api.put(`/applications/${id}/follow-up`, data),
  updateSalary: (id: string, data: any) => api.put(`/applications/${id}/salary`, data),
  deleteApplication: (id: string) => api.delete(`/applications/${id}`),
  getStats: () => api.get('/applications/stats/overview'),
  getPendingFollowUps: () => api.get('/applications/follow-ups/pending'),
  bulkUpdateStatus: (data: any) => api.put('/applications/bulk/status', data),
};

// Resume API
const resumeAPI = {
  upload: (formData: FormData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCurrent: () => api.get('/resume/current'),
  download: () => api.get('/resume/download', { responseType: 'blob' }),
  analyze: (jobId: string) => api.post(`/resume/analyze/${jobId}`),
  batchAnalyze: () => api.post('/resume/batch-analyze'),
  updateParsedData: (data: any) => api.put('/resume/update-parsed-data', data),
  delete: () => api.delete('/resume/delete'),
  getStats: () => api.get('/resume/stats'),
};

// Subscription API
const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrent: () => api.get('/subscription/current'),
  createCheckoutSession: (data: any) => api.post('/subscription/create-checkout-session', data),
  success: (data: any) => api.post('/subscription/success', data),
  cancel: () => api.post('/subscription/cancel'),
  reactivate: () => api.post('/subscription/reactivate'),
  getUsage: () => api.get('/subscription/usage'),
  getBillingHistory: () => api.get('/subscription/billing-history'),
};

// Admin API
const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getRecentActivity: () => api.get('/admin/recent-activity'),
  
  // Users management
  getUsers: (params?: string) => api.get(`/admin/users${params ? `?${params}` : ''}`),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  // Jobs management
  getJobs: (params?: string) => api.get(`/admin/jobs${params ? `?${params}` : ''}`),
  scrapeJobs: (data: any) => api.post('/admin/jobs/scrape', data),
  toggleJobActive: (id: string) => api.put(`/admin/jobs/${id}/toggle-active`),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),
  
  // Analytics
  getAnalytics: (params?: string) => api.get(`/admin/analytics${params ? `?${params}` : ''}`),
  getLogs: (params?: string) => api.get(`/admin/logs${params ? `?${params}` : ''}`),
  
  // System maintenance
  cleanupOldJobs: () => api.post('/admin/maintenance/cleanup-old-jobs'),
};

// Export the API object with proper structure for components
export const apiService = {
  auth: authAPI,
  jobs: jobsAPI,
  applications: applicationsAPI,
  resume: resumeAPI,
  subscription: subscriptionAPI,
  admin: adminAPI,
};

// Export default as the main API instance
export default apiService;

// Named export for convenience
export { apiService as api };