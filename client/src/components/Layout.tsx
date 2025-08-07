import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">User Dashboard Layout</h1>
        <p className="text-gray-600 mt-2">This is a placeholder for the user layout component</p>
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}