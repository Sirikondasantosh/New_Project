import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">JobSeeker Pro</h1>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={isAdmin ? "/admin/dashboard" : "/app/dashboard"}
                    className="btn-primary"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Land Your Dream Job
            <span className="text-primary-600 block">Faster Than Ever</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automate your job search with AI-powered resume matching, smart application tracking, 
            and real-time job scraping from top job portals.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn-outline text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="card-body">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Resume Parsing</h3>
              <p className="text-gray-600">
                AI-powered resume analysis that extracts skills, experience, and matches you with relevant jobs automatically.
              </p>
            </div>
          </div>

          <div className="card text-center">
            <div className="card-body">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Portal Integration</h3>
              <p className="text-gray-600">
                Automatically scrape jobs from Indeed, LinkedIn, Glassdoor, and more. Never miss an opportunity.
              </p>
            </div>
          </div>

          <div className="card text-center">
            <div className="card-body">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Tracking</h3>
              <p className="text-gray-600">
                Track all your applications, interviews, and follow-ups in one place with detailed analytics.
              </p>
            </div>
          </div>

          <div className="card text-center">
            <div className="card-body">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Daily Limits & Plans</h3>
              <p className="text-gray-600">
                Flexible subscription plans with daily application limits. Scale as your job search intensifies.
              </p>
            </div>
          </div>

          <div className="card text-center">
            <div className="card-body">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Match Scoring</h3>
              <p className="text-gray-600">
                Get match scores for each job based on your skills and experience. Apply to the best fits first.
              </p>
            </div>
          </div>

          <div className="card text-center">
            <div className="card-body">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Secure payment processing with Stripe. Cancel anytime. No hidden fees or long-term commitments.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Start free, upgrade when you need more applications per day</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card">
              <div className="card-body">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-4">$0<span className="text-lg text-gray-500">/month</span></div>
                  <ul className="text-gray-600 space-y-2 mb-6">
                    <li>• 5 applications per day</li>
                    <li>• Basic resume parsing</li>
                    <li>• Job search & filtering</li>
                    <li>• Application tracking</li>
                  </ul>
                  {!isAuthenticated && (
                    <Link to="/register" className="btn-outline w-full">
                      Get Started Free
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Plan */}
            <div className="card border-primary-200 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-primary-600 text-white px-3 py-1 text-sm font-medium rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="card-body">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-4">$9.99<span className="text-lg text-gray-500">/month</span></div>
                  <ul className="text-gray-600 space-y-2 mb-6">
                    <li>• 25 applications per day</li>
                    <li>• Advanced resume analysis</li>
                    <li>• Job recommendations</li>
                    <li>• Email notifications</li>
                    <li>• Priority support</li>
                  </ul>
                  {!isAuthenticated && (
                    <Link to="/register" className="btn-primary w-full">
                      Start Basic Plan
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="card">
              <div className="card-body">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-4">$19.99<span className="text-lg text-gray-500">/month</span></div>
                  <ul className="text-gray-600 space-y-2 mb-6">
                    <li>• 100 applications per day</li>
                    <li>• Priority job scraping</li>
                    <li>• Custom resume suggestions</li>
                    <li>• Interview preparation</li>
                    <li>• Advanced analytics</li>
                    <li>• Data export</li>
                  </ul>
                  {!isAuthenticated && (
                    <Link to="/register" className="btn-outline w-full">
                      Start Premium
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">JobSeeker Pro</h3>
            <p className="text-gray-400 mb-6">
              Streamline your job search with intelligent automation and tracking.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact</a>
            </div>
            <div className="mt-6 text-gray-400">
              © 2024 JobSeeker Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}