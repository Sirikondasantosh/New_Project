import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    jobType: string;
  };
  status: 'applied' | 'viewed' | 'interview' | 'rejected' | 'offer' | 'accepted';
  appliedDate: string;
  coverLetter?: string;
  notes?: string;
  matchScore?: number;
  interviewDates?: Array<{
    date: string;
    type: string;
    notes?: string;
  }>;
  followUpDates?: string[];
  salary?: {
    offered?: number;
    negotiated?: number;
    final?: number;
  };
}

interface ApplicationStats {
  total: number;
  applied: number;
  viewed: number;
  interview: number;
  rejected: number;
  offer: number;
  accepted: number;
}

const statusConfig = {
  applied: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, label: 'Applied' },
  viewed: { color: 'bg-yellow-100 text-yellow-800', icon: EyeIcon, label: 'Viewed' },
  interview: { color: 'bg-purple-100 text-purple-800', icon: CalendarDaysIcon, label: 'Interview' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Rejected' },
  offer: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Offer' },
  accepted: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircleIcon, label: 'Accepted' }
};

export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    viewed: 0,
    interview: 0,
    rejected: 0,
    offer: 0,
    accepted: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(searchParams.get('tab') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  
  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [salaryOffered, setSalaryOffered] = useState('');
  const [salaryNegotiated, setSalaryNegotiated] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [selectedTab]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTab !== 'all') {
        params.append('status', selectedTab);
      }
      
      const response = await api.applications.getMyApplications(params.toString());
      setApplications(response.data.applications);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load applications.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.applications.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedApplication || !newStatus) return;

    try {
      await api.applications.updateStatus(selectedApplication._id, { status: newStatus });
      
      setApplications(prev => prev.map(app => 
        app._id === selectedApplication._id 
          ? { ...app, status: newStatus as any }
          : app
      ));
      
      setShowStatusModal(false);
      setNewStatus('');
      setSelectedApplication(null);
      
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'Application status updated successfully.'
      });
      
      fetchStats();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update status.'
      });
    }
  };

  const handleAddNotes = async () => {
    if (!selectedApplication || !notes.trim()) return;

    try {
      await api.applications.updateApplication(selectedApplication._id, { notes: notes.trim() });
      
      setApplications(prev => prev.map(app => 
        app._id === selectedApplication._id 
          ? { ...app, notes: notes.trim() }
          : app
      ));
      
      setShowNotesModal(false);
      setNotes('');
      setSelectedApplication(null);
      
      addToast({
        type: 'success',
        title: 'Notes Updated',
        message: 'Application notes updated successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update notes.'
      });
    }
  };

  const handleAddInterview = async () => {
    if (!selectedApplication || !interviewDate || !interviewType) return;

    try {
      await api.applications.addInterview(selectedApplication._id, {
        date: interviewDate,
        type: interviewType,
        notes: interviewNotes.trim() || undefined
      });
      
      const newInterview = {
        date: interviewDate,
        type: interviewType,
        notes: interviewNotes.trim() || undefined
      };
      
      setApplications(prev => prev.map(app => 
        app._id === selectedApplication._id 
          ? { 
              ...app, 
              interviewDates: [...(app.interviewDates || []), newInterview]
            }
          : app
      ));
      
      setShowInterviewModal(false);
      setInterviewDate('');
      setInterviewType('');
      setInterviewNotes('');
      setSelectedApplication(null);
      
      addToast({
        type: 'success',
        title: 'Interview Added',
        message: 'Interview details added successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to add interview.'
      });
    }
  };

  const handleUpdateSalary = async () => {
    if (!selectedApplication) return;

    try {
      const salaryData: any = {};
      if (salaryOffered) salaryData.offered = parseInt(salaryOffered);
      if (salaryNegotiated) salaryData.negotiated = parseInt(salaryNegotiated);
      
      await api.applications.updateSalary(selectedApplication._id, salaryData);
      
      setApplications(prev => prev.map(app => 
        app._id === selectedApplication._id 
          ? { 
              ...app, 
              salary: { ...app.salary, ...salaryData }
            }
          : app
      ));
      
      setShowSalaryModal(false);
      setSalaryOffered('');
      setSalaryNegotiated('');
      setSelectedApplication(null);
      
      addToast({
        type: 'success',
        title: 'Salary Updated',
        message: 'Salary information updated successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update salary.'
      });
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await api.applications.deleteApplication(applicationId);
      setApplications(prev => prev.filter(app => app._id !== applicationId));
      
      addToast({
        type: 'success',
        title: 'Application Deleted',
        message: 'Application deleted successfully.'
      });
      
      fetchStats();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete application.'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const tabs = [
    { id: 'all', name: 'All Applications', count: stats.total },
    { id: 'applied', name: 'Applied', count: stats.applied },
    { id: 'viewed', name: 'Viewed', count: stats.viewed },
    { id: 'interview', name: 'Interview', count: stats.interview },
    { id: 'offer', name: 'Offers', count: stats.offer },
    { id: 'rejected', name: 'Rejected', count: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Track and manage your job applications</p>
        </div>
        <Link to="/jobs" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Apply to More Jobs
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="card p-4 text-center">
            <config.icon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {stats[status as keyof ApplicationStats]}
            </p>
            <p className="text-sm text-gray-600">{config.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(tab.id);
                const params = new URLSearchParams(searchParams);
                if (tab.id === 'all') {
                  params.delete('tab');
                } else {
                  params.set('tab', tab.id);
                }
                setSearchParams(params);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="flex space-x-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-8 bg-gray-200 rounded w-16"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => {
            const statusInfo = statusConfig[application.status];
            return (
              <div key={application._id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/jobs/${application.jobId._id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {application.jobId.title}
                      </Link>
                      {application.matchScore && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          {application.matchScore}% match
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 font-medium mb-1">{application.jobId.company}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {application.jobId.location}
                        {application.jobId.remote && <span className="ml-1">• Remote</span>}
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1" />
                        <span className="capitalize">{application.jobId.jobType.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Applied {formatDate(application.appliedDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      <statusInfo.icon className="h-4 w-4 mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  {application.interviewDates && application.interviewDates.length > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="font-medium text-purple-800">Interviews</p>
                      <p className="text-purple-600">{application.interviewDates.length} scheduled</p>
                    </div>
                  )}
                  
                  {application.salary && (application.salary.offered || application.salary.negotiated) && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="font-medium text-green-800">Salary</p>
                      <p className="text-green-600">
                        {application.salary.negotiated 
                          ? formatSalary(application.salary.negotiated)
                          : formatSalary(application.salary.offered!)
                        }
                      </p>
                    </div>
                  )}
                  
                  {application.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-800">Notes</p>
                      <p className="text-gray-600 truncate">{application.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setNewStatus(application.status);
                      setShowStatusModal(true);
                    }}
                    className="btn-secondary text-sm px-3 py-1 flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Update Status
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setNotes(application.notes || '');
                      setShowNotesModal(true);
                    }}
                    className="btn-secondary text-sm px-3 py-1 flex items-center"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                    {application.notes ? 'Edit Notes' : 'Add Notes'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setShowInterviewModal(true);
                    }}
                    className="btn-secondary text-sm px-3 py-1 flex items-center"
                  >
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    Add Interview
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setSalaryOffered(application.salary?.offered?.toString() || '');
                      setSalaryNegotiated(application.salary?.negotiated?.toString() || '');
                      setShowSalaryModal(true);
                    }}
                    className="btn-secondary text-sm px-3 py-1 flex items-center"
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Salary Info
                  </button>
                  
                  <button
                    onClick={() => handleDeleteApplication(application._id)}
                    className="btn-outline text-red-600 border-red-300 hover:bg-red-50 text-sm px-3 py-1 flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {selectedTab === 'all' ? 'No applications yet' : `No ${selectedTab} applications`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTab === 'all' 
              ? 'Start applying to jobs to see them here.'
              : `You don't have any ${selectedTab} applications.`
            }
          </p>
          <div className="mt-6">
            <Link to="/jobs" className="btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Browse Jobs
            </Link>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input-field"
              >
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowStatusModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleStatusChange} className="btn-primary flex-1">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedApplication.notes ? 'Edit Notes' : 'Add Notes'}
            </h3>
            <div className="mb-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder="Add your notes about this application..."
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowNotesModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleAddNotes} className="btn-primary flex-1">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Interview</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select type</option>
                  <option value="phone">Phone Screen</option>
                  <option value="video">Video Call</option>
                  <option value="in-person">In Person</option>
                  <option value="technical">Technical</option>
                  <option value="final">Final Round</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Interview details, preparation notes..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowInterviewModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleAddInterview} className="btn-primary flex-1">
                Add Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offered Salary</label>
                <input
                  type="number"
                  value={salaryOffered}
                  onChange={(e) => setSalaryOffered(e.target.value)}
                  className="input-field"
                  placeholder="Annual salary offered"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Negotiated Salary</label>
                <input
                  type="number"
                  value={salaryNegotiated}
                  onChange={(e) => setSalaryNegotiated(e.target.value)}
                  className="input-field"
                  placeholder="Negotiated salary amount"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowSalaryModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleUpdateSalary} className="btn-primary flex-1">
                Save Salary Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}