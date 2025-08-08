import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserPlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  subscription: {
    plan: 'free' | 'basic' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
  };
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  stats: {
    totalApplications: number;
    resumeUploaded: boolean;
  };
}

export default function AdminUsers() {
  const { addToast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortBy, sortOrder, searchTerm, selectedRole, selectedPlan, selectedStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole }),
        ...(selectedPlan && { plan: selectedPlan }),
        ...(selectedStatus && { status: selectedStatus })
      });

      const response = await api.admin.getUsers(params.toString());
      setUsers(response.data.users);
      setTotalPages(Math.ceil(response.data.total / 20));
    } catch (error: any) {
      console.error('Error fetching users:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load users.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      await api.admin.deleteUser(userToDelete._id);
      setUsers(prev => prev.filter(user => user._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      addToast({
        type: 'success',
        title: 'User Deleted',
        message: 'User has been deleted successfully.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error.response?.data?.message || 'Failed to delete user.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await api.admin.updateUser(user._id, {
        isActive: !user.isActive
      });
      
      setUsers(prev => prev.map(u => 
        u._id === user._id ? { ...u, isActive: !u.isActive } : u
      ));
      
      addToast({
        type: 'success',
        title: 'User Updated',
        message: `User ${user.isActive ? 'deactivated' : 'activated'} successfully.`
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update user status.'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor user accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary flex items-center">
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Invite User
          </button>
          <button
            onClick={() => fetchUsers()}
            className="btn-primary flex items-center"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input-field"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="input-field"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        User
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? 
                            <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                            <ArrowDownIcon className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Joined
                        {sortBy === 'createdAt' && (
                          sortOrder === 'asc' ? 
                            <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                            <ArrowDownIcon className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? (
                              <>
                                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              'User'
                            )}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.subscription.plan)}`}>
                            {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.subscription.status)}`}>
                            {user.subscription.status.charAt(0).toUpperCase() + user.subscription.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.stats.totalApplications} applications
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.lastLogin ? `Last login: ${formatDate(user.lastLogin)}` : 'Never logged in'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View User"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.isActive ? (
                              <XCircleIcon className="h-4 w-4" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
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
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Account Info</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Role: </span>
                      <span className="font-medium">{selectedUser.role}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status: </span>
                      <span className={`font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Joined: </span>
                      <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Login: </span>
                      <span className="font-medium">
                        {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Subscription</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Plan: </span>
                      <span className="font-medium capitalize">{selectedUser.subscription.plan}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status: </span>
                      <span className="font-medium capitalize">{selectedUser.subscription.status}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Activity</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Applications: </span>
                      <span className="font-medium">{selectedUser.stats.totalApplications}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Resume: </span>
                      <span className="font-medium">
                        {selectedUser.stats.resumeUploaded ? 'Uploaded' : 'Not uploaded'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <TrashIcon className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{userToDelete.name}</strong>? This action cannot be undone and will permanently remove all user data.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex-1"
              >
                {deleting ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}