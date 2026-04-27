import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Navbar() {
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (token) {
        // Call backend logout endpoint to delete session
        await authAPI.logout();
      }
      // Clear frontend session
      logout();
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear frontend session even if backend call fails
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold">SmartColdMailer</div>
          <div className="flex space-x-4 items-center">
            <a href="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded">Dashboard</a>
            <a href="/contacts" className="hover:bg-blue-700 px-3 py-2 rounded">Contacts</a>
            <a href="/send-emails" className="bg-white text-blue-600 hover:bg-gray-100 px-3 py-2 rounded font-bold">Send Emails</a>
            <a href="/email-history" className="hover:bg-blue-700 px-3 py-2 rounded">📧 History</a>
            <a href="/settings" className="hover:bg-blue-700 px-3 py-2 rounded">Settings</a>
            {token && (
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold transition"
              >
                🚪 Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
