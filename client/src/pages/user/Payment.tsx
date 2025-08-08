import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
  plan: string;
  period: {
    start: string;
    end: string;
  };
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingSuccess, setProcessingSuccess] = useState(false);
  
  const paymentStatus = searchParams.get('status');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (paymentStatus === 'success' && sessionId) {
      handlePaymentSuccess();
    } else if (paymentStatus === 'cancel') {
      handlePaymentCancel();
    }
    
    fetchBillingHistory();
  }, [paymentStatus, sessionId]);

  const handlePaymentSuccess = async () => {
    setProcessingSuccess(true);
    
    try {
      const response = await api.subscription.success({ sessionId });
      
      // Update user context with new subscription info
      if (response.data.user) {
        updateUser(response.data.user);
      }
      
      addToast({
        type: 'success',
        title: 'Payment Successful!',
        message: 'Your subscription has been activated. Welcome to premium features!'
      });
      
      // Clear URL parameters after processing
      navigate('/payment', { replace: true });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Payment Processing Error',
        message: error.response?.data?.message || 'There was an issue processing your payment.'
      });
    } finally {
      setProcessingSuccess(false);
    }
  };

  const handlePaymentCancel = () => {
    addToast({
      type: 'info',
      title: 'Payment Cancelled',
      message: 'Your payment was cancelled. You can try again anytime from the subscription page.'
    });
    
    // Clear URL parameters
    navigate('/payment', { replace: true });
  };

  const fetchBillingHistory = async () => {
    try {
      setLoading(true);
      const response = await api.subscription.getBillingHistory();
      setBillingHistory(response.data.billingHistory || []);
    } catch (error: any) {
      console.error('Error fetching billing history:', error);
      if (error.response?.status !== 404) {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load billing history.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceUrl: string, description: string) => {
    try {
      const response = await fetch(invoiceUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${description.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download invoice.'
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  if (processingSuccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">Processing Payment...</h2>
          <p className="text-gray-600">Please wait while we activate your subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and view billing history</p>
        </div>
        <Link to="/subscription" className="btn-secondary flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Subscription
        </Link>
      </div>

      {/* Payment Success/Cancel Messages */}
      {paymentStatus === 'success' && (
        <div className="card p-6 border-green-200 bg-green-50">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
              <p className="text-green-700 mt-1">
                Your subscription has been activated. You now have access to all premium features.
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentStatus === 'cancel' && (
        <div className="card p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Payment Cancelled</h3>
              <p className="text-yellow-700 mt-1">
                Your payment was cancelled. You can try again from the subscription page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Subscription Summary */}
      {user?.subscription && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Plan</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {user.subscription.plan}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {user.subscription.status}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Next Billing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user.subscription.plan === 'free' 
                    ? 'N/A' 
                    : user.subscription.endDate 
                      ? formatDate(user.subscription.endDate)
                      : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
          {billingHistory.length > 0 && (
            <p className="text-sm text-gray-600">
              {billingHistory.length} transaction{billingHistory.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : billingHistory.length > 0 ? (
          <div className="space-y-4">
            {billingHistory.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    transaction.status === 'paid' ? 'bg-green-100' :
                    transaction.status === 'pending' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    {getStatusIcon(transaction.status)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">
                        {transaction.description}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{formatDate(transaction.date)}</span>
                      <span>•</span>
                      <span>{transaction.plan.charAt(0).toUpperCase() + transaction.plan.slice(1)} Plan</span>
                      <span>•</span>
                      <span>
                        {formatDate(transaction.period.start)} - {formatDate(transaction.period.end)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatAmount(transaction.amount)}
                    </p>
                  </div>
                  
                  {transaction.invoiceUrl && transaction.status === 'paid' && (
                    <button
                      onClick={() => handleDownloadInvoice(transaction.invoiceUrl!, transaction.description)}
                      className="btn-secondary text-sm px-3 py-1 flex items-center"
                      title="Download Invoice"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Invoice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No billing history</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your billing transactions will appear here once you subscribe to a paid plan.
            </p>
            <div className="mt-6">
              <Link to="/subscription" className="btn-primary">
                View Subscription Plans
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
        </div>
        
        <div className="text-center py-8">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Secure Payment Processing</h3>
          <p className="mt-1 text-sm text-gray-500">
            We use Stripe for secure payment processing. Your payment information is encrypted and never stored on our servers.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-12 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div className="h-8 w-12 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              <div className="h-8 w-12 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">AMEX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Billing Questions</h3>
            <p className="text-sm text-gray-600 mb-3">
              Have questions about your subscription or billing? We're here to help.
            </p>
            <button className="btn-secondary text-sm">
              Contact Support
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Refund Policy</h3>
            <p className="text-sm text-gray-600 mb-3">
              Learn about our refund policy and how to request a refund if needed.
            </p>
            <button className="btn-secondary text-sm">
              View Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}