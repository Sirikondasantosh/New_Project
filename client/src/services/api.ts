import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  verify: () => api.get('/auth/verify'),
};

export const jobsAPI = {
  getJobs: (params: any) => api.get('/jobs', { params }),
  getJob: (id: string) => api.get(`/jobs/${id}`),
  searchJobs: (data: any) => api.post('/jobs/search', data),
  getStats: () => api.get('/jobs/stats/overview'),
  scrapeJobs: (data: any) => api.post('/jobs/scrape', data),
};

export const applicationsAPI = {
  apply: (jobId: string, data: any) => api.post('/applications/apply', { jobId, ...data }),
  getMyApplications: (params: any) => api.get('/applications/my-applications', { params }),
  getApplication: (id: string) => api.get(`/applications/${id}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put(`/applications/${id}/status`, { status, notes }),
  addInterview: (id: string, data: any) =>
    api.put(`/applications/${id}/interview`, data),
  addFollowUp: (id: string, date: string) =>
    api.put(`/applications/${id}/follow-up`, { date }),
  updateSalary: (id: string, data: any) =>
    api.put(`/applications/${id}/salary`, data),
  deleteApplication: (id: string) => api.delete(`/applications/${id}`),
  getStats: () => api.get('/applications/stats/overview'),
  getPendingFollowUps: () => api.get('/applications/follow-ups/pending'),
  bulkUpdateStatus: (applicationIds: string[], status: string) =>
    api.put('/applications/bulk/status', { applicationIds, status }),
};

export const resumeAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getCurrent: () => api.get('/resume/current'),
  download: () => api.get('/resume/download', { responseType: 'blob' }),
  analyze: (jobId: string) => api.post(`/resume/analyze/${jobId}`),
  batchAnalyze: (jobIds: string[]) => api.post('/resume/batch-analyze', { jobIds }),
  updateParsedData: (data: any) => api.put('/resume/update-parsed-data', data),
  delete: () => api.delete('/resume/delete'),
  getStats: () => api.get('/resume/stats'),
};

export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrent: () => api.get('/subscription/current'),
  createCheckoutSession: (planType: string) =>
    api.post('/subscription/create-checkout-session', { planType }),
  handleSuccess: (sessionId: string) =>
    api.post('/subscription/success', { sessionId }),
  cancel: () => api.post('/subscription/cancel'),
  reactivate: () => api.post('/subscription/reactivate'),
  getUsage: () => api.get('/subscription/usage'),
  getBillingHistory: () => api.get('/subscription/billing-history'),
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params: any) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getJobs: (params: any) => api.get('/admin/jobs', { params }),
  scrapeJobs: (data: any) => api.post('/admin/jobs/scrape', data),
  toggleJobActive: (id: string) => api.put(`/admin/jobs/${id}/toggle-active`),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),
  getAnalytics: () => api.get('/admin/analytics'),
  getLogs: (params: any) => api.get('/admin/logs', { params }),
  cleanupOldJobs: () => api.post('/admin/maintenance/cleanup-old-jobs'),
};

export default api;