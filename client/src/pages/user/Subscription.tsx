import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCardIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  dailyLimit: number;
  popular?: boolean;
  recommended?: boolean;
}

interface CurrentSubscription {
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  usage: {
    dailyApplications: number;
    dailyLimit: number;
  };
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started with job searching',
    dailyLimit: 5,
    features: [
      '5 applications per day',
      'Basic resume parsing',
      'Job search and filtering',
      'Application tracking',
      'Email support'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    period: 'month',
    description: 'Great for active job seekers',
    dailyLimit: 25,
    popular: true,
    features: [
      '25 applications per day',
      'Advanced resume parsing',
      'AI-powered job matching',
      'Resume optimization tips',
      'Interview preparation',
      'Priority email support',
      'Application analytics'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    period: 'month',
    description: 'For serious professionals seeking their dream job',
    dailyLimit: 100,
    recommended: true,
    features: [
      '100 applications per day',
      'Premium resume parsing',
      'Advanced AI job matching',
      'Custom resume optimization',
      'Interview coaching resources',
      'Salary negotiation guides',
      '24/7 priority support',
      'Advanced analytics dashboard',
      'LinkedIn profile optimization',
      'Career path recommendations'
    ]
  }
];

export default function Subscription() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.subscription.getCurrent();
      setCurrentSubscription(response.data.subscription);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription information.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      // Handle downgrade to free
      return;
    }

    setUpgrading(planId);
    
    try {
      const response = await api.subscription.createCheckoutSession({
        planId,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/subscription`
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Upgrade Failed',
        message: error.response?.data?.message || 'Failed to start upgrade process.'
      });
      setUpgrading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    
    try {
      await api.subscription.cancel();
      
      addToast({
        type: 'success',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. You can continue using premium features until the end of your billing period.'
      });
      
      await fetchCurrentSubscription();
      setShowCancelModal(false);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.response?.data?.message || 'Failed to cancel subscription.'
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await api.subscription.reactivate();
      
      addToast({
        type: 'success',
        title: 'Subscription Reactivated',
        message: 'Your subscription has been reactivated successfully.'
      });
      
      await fetchCurrentSubscription();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Reactivation Failed',
        message: error.response?.data?.message || 'Failed to reactivate subscription.'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentPlan = () => {
    return plans.find(plan => plan.id === (currentSubscription?.plan || 'free')) || plans[0];
  };

  const getUsagePercentage = () => {
    if (!currentSubscription) return 0;
    return (currentSubscription.usage.dailyApplications / currentSubscription.usage.dailyLimit) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">Choose the perfect plan for your job search journey</p>
      </div>

      {/* Current Plan Status */}
      {currentSubscription && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                currentPlan.id === 'premium' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                currentPlan.id === 'basic' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                'bg-gray-100'
              }`}>
                {currentPlan.id === 'premium' ? (
                  <StarSolidIcon className="h-6 w-6 text-white" />
                ) : currentPlan.id === 'basic' ? (
                  <BoltIcon className="h-6 w-6 text-white" />
                ) : (
                  <ShieldCheckIcon className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentPlan.name} Plan
                </h2>
                <p className="text-gray-600">
                  {currentSubscription.status === 'active' ? 'Active' : 'Cancelled'} • 
                  {currentPlan.id !== 'free' && (
                    <span> Renews {formatDate(currentSubscription.endDate)}</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}`}
              </div>
              {currentPlan.price > 0 && (
                <div className="text-sm text-gray-600">per {currentPlan.period}</div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentSubscription.usage.dailyApplications} / {currentSubscription.usage.dailyLimit}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUsageColor()}`}>
                  {Math.round(getUsagePercentage())}%
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getUsagePercentage() >= 90 ? 'bg-red-500' :
                    getUsagePercentage() >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Plan Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {currentSubscription.status}
              </p>
              {currentSubscription.status === 'cancelled' && (
                <p className="text-sm text-red-600">
                  Access until {formatDate(currentSubscription.endDate)}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(currentSubscription.startDate)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {currentSubscription.status === 'cancelled' ? (
              <button
                onClick={handleReactivate}
                className="btn-primary flex items-center"
              >
                <ArrowUpIcon className="h-4 w-4 mr-2" />
                Reactivate Subscription
              </button>
            ) : currentPlan.id !== 'premium' ? (
              <button
                onClick={() => handleUpgrade('premium')}
                disabled={upgrading === 'premium'}
                className="btn-primary flex items-center"
              >
                {upgrading === 'premium' ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Upgrading...
                  </>
                ) : (
                  <>
                    <ArrowUpIcon className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </>
                )}
              </button>
            ) : null}
            
            {currentPlan.id !== 'free' && currentSubscription.status === 'active' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel Subscription
              </button>
            )}
            
            <Link to="/payment" className="btn-secondary flex items-center">
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Billing History
            </Link>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan.id === plan.id;
          const canUpgrade = currentPlan.price < plan.price;
          const canDowngrade = currentPlan.price > plan.price;
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'border-blue-500 bg-blue-50'
                  : plan.recommended
                  ? 'border-purple-500 bg-purple-50'
                  : isCurrentPlan
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Plan Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    Recommended
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <CheckSolidIcon className="h-4 w-4 mr-1" />
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                  plan.id === 'premium' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                  plan.id === 'basic' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  'bg-gray-100'
                }`}>
                  {plan.id === 'premium' ? (
                    <StarSolidIcon className="h-8 w-8 text-white" />
                  ) : plan.id === 'basic' ? (
                    <BoltIcon className="h-8 w-8 text-white" />
                  ) : (
                    <ShieldCheckIcon className="h-8 w-8 text-gray-600" />
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-2">{plan.description}</p>
                
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600">/{plan.period}</span>
                  )}
                </div>
                
                <div className="mt-2">
                  <span className="text-lg font-semibold text-blue-600">
                    {plan.dailyLimit} applications/day
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <div className="mt-auto">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full btn-secondary opacity-50 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : canUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                    className="w-full btn-primary"
                  >
                    {upgrading === plan.id ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                ) : canDowngrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full btn-outline"
                  >
                    Downgrade to {plan.name}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full btn-secondary opacity-50 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing cycle for downgrades.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What happens if I exceed my daily limit?</h3>
            <p className="text-gray-600">
              You'll be notified when you approach your limit. If you exceed it, you'll need to wait until the next day or upgrade your plan to continue applying.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial for paid plans?</h3>
            <p className="text-gray-600">
              We offer a generous free plan to try our core features. You can upgrade anytime to unlock advanced features and higher limits.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How secure is my payment information?</h3>
            <p className="text-gray-600">
              We use Stripe for payment processing, which is PCI DSS compliant and used by millions of businesses worldwide. We never store your payment information.
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll continue to have access to premium features until the end of your billing period.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary flex-1"
                disabled={cancelling}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex-1"
              >
                {cancelling ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Cancelling...
                  </div>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}