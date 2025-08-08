import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  CloudArrowUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface ResumeData {
  filename: string;
  originalName: string;
  uploadDate: string;
  parsedData: {
    skills: string[];
    experience: string[];
    education: string[];
    contact: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
    summary?: string;
    projects?: string[];
  };
}

interface MatchAnalysis {
  jobTitle: string;
  company: string;
  matchScore: number;
  missingSkills: string[];
  recommendations: string[];
  strengths: string[];
}

export default function Resume() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  // Edit form states
  const [editData, setEditData] = useState({
    skills: [] as string[],
    experience: [] as string[],
    education: [] as string[],
    contact: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    },
    summary: '',
    projects: [] as string[]
  });

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await api.resume.getCurrent();
      if (response.data.resume) {
        setResume(response.data.resume);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching resume:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load resume.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      addToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please upload a PDF file.'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'File size must be less than 10MB.'
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.resume.upload(formData);
      setResume(response.data.resume);
      setShowUploadModal(false);
      
      addToast({
        type: 'success',
        title: 'Resume Uploaded!',
        message: 'Your resume has been uploaded and parsed successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.message || 'Failed to upload resume.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.resume.download();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume?.originalName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download resume.'
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    try {
      await api.resume.delete();
      setResume(null);
      
      addToast({
        type: 'success',
        title: 'Resume Deleted',
        message: 'Your resume has been deleted successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete resume.'
      });
    }
  };

  const handleAnalyzeJobs = async () => {
    setAnalyzing(true);
    try {
      const response = await api.resume.batchAnalyze();
      setMatchAnalysis(response.data.analyses);
      setShowAnalysisModal(true);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        message: 'Failed to analyze job matches.'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEditResume = () => {
    if (resume) {
      setEditData({
        skills: resume.parsedData.skills || [],
        experience: resume.parsedData.experience || [],
        education: resume.parsedData.education || [],
        contact: resume.parsedData.contact || {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          website: ''
        },
        summary: resume.parsedData.summary || '',
        projects: resume.parsedData.projects || []
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await api.resume.updateParsedData({ parsedData: editData });
      setResume(prev => prev ? { ...prev, parsedData: editData } : null);
      setShowEditModal(false);
      
      addToast({
        type: 'success',
        title: 'Resume Updated',
        message: 'Your resume data has been updated successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update resume data.'
      });
    }
  };

  const addArrayItem = (field: 'skills' | 'experience' | 'education' | 'projects', value: string) => {
    if (value.trim()) {
      setEditData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: 'skills' | 'experience' | 'education' | 'projects', index: number) => {
    setEditData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume Manager</h1>
          <p className="text-gray-600 mt-1">Upload, manage, and optimize your resume for job applications</p>
        </div>
        {!resume && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Resume
          </button>
        )}
      </div>

      {resume ? (
        <div className="space-y-6">
          {/* Resume Overview */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{resume.originalName}</h2>
                  <p className="text-sm text-gray-600">Uploaded {formatDate(resume.uploadDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownload}
                  className="btn-secondary flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={handleEditResume}
                  className="btn-secondary flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Data
                </button>
                <button
                  onClick={handleAnalyzeJobs}
                  disabled={analyzing}
                  className="btn-primary flex items-center"
                >
                  {analyzing ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Analyze Jobs
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-secondary flex items-center"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Replace
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </div>
              <div className="space-y-3">
                {resume.parsedData.contact.name && (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{resume.parsedData.contact.name}</span>
                  </div>
                )}
                {resume.parsedData.contact.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{resume.parsedData.contact.email}</span>
                  </div>
                )}
                {resume.parsedData.contact.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{resume.parsedData.contact.phone}</span>
                  </div>
                )}
                {resume.parsedData.contact.linkedin && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-3" />
                    <a 
                      href={resume.parsedData.contact.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {resume.parsedData.skills.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.parsedData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {resume.parsedData.experience.length}
                </span>
              </div>
              <div className="space-y-3">
                {resume.parsedData.experience.map((exp, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{exp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                  {resume.parsedData.education.length}
                </span>
              </div>
              <div className="space-y-3">
                {resume.parsedData.education.map((edu, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{edu}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {resume.parsedData.summary && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h3>
              <p className="text-gray-700 leading-relaxed">{resume.parsedData.summary}</p>
            </div>
          )}

          {/* Projects */}
          {resume.parsedData.projects && resume.parsedData.projects.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
              <div className="space-y-3">
                {resume.parsedData.projects.map((project, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{project}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No Resume State */
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No resume uploaded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload your resume to get started with AI-powered job matching and application tracking.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Upload Resume
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {resume ? 'Replace Resume' : 'Upload Resume'}
            </h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your resume here
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or click to browse files
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
                disabled={uploading}
              />
              <label
                htmlFor="resume-upload"
                className="btn-primary cursor-pointer inline-block"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Uploading...
                  </div>
                ) : (
                  'Select PDF File'
                )}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PDF files only, max 10MB
              </p>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Resume Data</h3>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Contact Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={editData.contact.name}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, name: e.target.value }
                    }))}
                    className="input-field"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editData.contact.email}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value }
                    }))}
                    className="input-field"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={editData.contact.phone}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={editData.contact.location}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, location: e.target.value }
                    }))}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Professional Summary</h4>
                <textarea
                  rows={3}
                  placeholder="Brief professional summary"
                  value={editData.summary}
                  onChange={(e) => setEditData(prev => ({ ...prev, summary: e.target.value }))}
                  className="input-field resize-none"
                />
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full flex items-center"
                    >
                      {skill}
                      <button
                        onClick={() => removeArrayItem('skills', index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Add a skill"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('skills', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="input-field flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-primary flex-1"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Match Analysis</h3>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {matchAnalysis.map((analysis, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{analysis.jobTitle}</h4>
                      <p className="text-sm text-gray-600">{analysis.company}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        analysis.matchScore >= 80 ? 'text-green-600' :
                        analysis.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analysis.matchScore}%
                      </div>
                      <p className="text-xs text-gray-500">Match Score</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-800 mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {analysis.strengths.map((strength, i) => (
                          <li key={i} className="text-green-600">• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-medium text-red-800 mb-2">Missing Skills</p>
                      <ul className="space-y-1">
                        {analysis.missingSkills.map((skill, i) => (
                          <li key={i} className="text-red-600">• {skill}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-medium text-blue-800 mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((rec, i) => (
                          <li key={i} className="text-blue-600">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Link to="/jobs" className="btn-primary">
                Browse More Jobs
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}