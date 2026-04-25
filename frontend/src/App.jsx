import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import SendEmails from './pages/SendEmails';
import Settings from './pages/Settings';
import './index.css';

// Protected Route Component that dynamically checks token
function ProtectedRoute({ element }) {
  const { token } = useAuth();
  return token ? element : <Navigate to="/login" replace />;
}

// Main App Content (inside AuthProvider)
function AppContent() {
  const { token } = useAuth();

  return (
    <>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/contacts" element={<ProtectedRoute element={<Contacts />} />} />
        <Route path="/send-emails" element={<ProtectedRoute element={<SendEmails />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
