import React, { useState, useEffect } from 'react';
import { smtpAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [smtpData, setSmtpData] = useState({ email: '', appPassword: '' });
  const [userData, setUserData] = useState({ 
    name: '', phone: '', 
    githubLink: '', linkedinLink: '', leetcodeLink: '', resumeLink: '',
    techSkill: '', keySkill: '', specificArea: '', relevantProject: ''
  });
  
  const [loading, setLoading] = useState(true);
  
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  
  const [smtpError, setSmtpError] = useState('');
  const [smtpSuccess, setSmtpSuccess] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const [smtpExists, setSmtpExists] = useState(false);
  const [isSmtpEditing, setIsSmtpEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch User Details
      try {
        const uRes = await userAPI.getMe();
          setUserData({
          name: uRes.data.name || '',
          phone: uRes.data.phone || '',
          githubLink: uRes.data.githubLink || '',
          linkedinLink: uRes.data.linkedinLink || '',
          leetcodeLink: uRes.data.leetcodeLink || '',
          resumeLink: uRes.data.resumeLink || '',
          techSkill: uRes.data.techSkill || '',
          keySkill: uRes.data.keySkill || '',
          specificArea: uRes.data.specificArea || '',
          relevantProject: uRes.data.relevantProject || ''
        });
      } catch (err) {
        console.error("Failed to fetch user details", err);
      }

      // Fetch SMTP
      try {
        const sRes = await smtpAPI.get();
        if (sRes.data && sRes.data.email) {
          setSmtpData({ email: sRes.data.email, appPassword: '' });
          setSmtpExists(true);
        }
      } catch (err) {
        setSmtpExists(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- SMTP Handlers ---
  const handleSmtpChange = (e) => {
    setSmtpData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSmtpSubmit = async (e) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpError('');
    setSmtpSuccess('');

    if (isSmtpEditing && !smtpData.appPassword) {
      setSmtpError('Please enter your Gmail App Password to update');
      setSmtpSaving(false);
      return;
    }

    try {
      await smtpAPI.save(smtpData);
      setSmtpSuccess(smtpExists && isSmtpEditing ? '✅ SMTP configuration updated!' : '✅ SMTP configuration saved!');
      setIsSmtpEditing(false);
      setSmtpData(prev => ({ ...prev, appPassword: '' }));
      setSmtpExists(true);
    } catch (err) {
      setSmtpError(err.response?.data?.message || 'Failed to save SMTP config');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleDeleteSmtp = async () => {
    if (confirm('Are you sure you want to delete your SMTP configuration? You will not be able to send emails until you add it again.')) {
      try {
        await smtpAPI.delete();
        setSmtpExists(false);
        setSmtpData({ email: '', appPassword: '' });
        setIsSmtpEditing(false);
        setSmtpSuccess('✅ SMTP configuration deleted successfully.');
      } catch (err) {
        setSmtpError('Failed to delete SMTP configuration.');
      }
    }
  };

  // --- User Handlers ---
  const handleUserChange = (e) => {
    setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserSaving(true);
    setUserError('');
    setUserSuccess('');

    try {
      await userAPI.updateMe(userData);
      setUserSuccess('✅ User profile updated successfully!');
      
      // Update local storage user data partially
      if (user) {
         const updatedUser = { ...user, name: userData.name, phone: userData.phone };
         localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setUserError('Failed to update user profile');
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('WARNING: Are you absolutely sure you want to delete your account? All your data, contacts, and logs will be permanently lost!')) {
      try {
        await userAPI.deleteMe();
        logout();
        navigate('/signup');
      } catch (err) {
        setUserError('Failed to delete account');
      }
    }
  };

  if (loading) return <div className="text-center py-10">Loading settings...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      {/* Profile Section */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Profile Details</h2>
        {userError && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{userError}</div>}
        {userSuccess && <div className="bg-green-100 text-green-600 p-3 rounded mb-4">{userSuccess}</div>}
        
        <form onSubmit={handleUserSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Name</label>
              <input type="text" name="name" value={userData.name} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Phone</label>
              <input type="tel" name="phone" value={userData.phone} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">GitHub Profile Link</label>
              <input type="url" name="githubLink" value={userData.githubLink} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="https://github.com/username" />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">LinkedIn Profile Link</label>
              <input type="url" name="linkedinLink" value={userData.linkedinLink} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="https://linkedin.com/in/username" />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">LeetCode Profile Link</label>
            <input type="url" name="leetcodeLink" value={userData.leetcodeLink} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="https://leetcode.com/username" />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Resume Link</label>
            <input type="url" name="resumeLink" value={userData.resumeLink} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="https://drive.google.com/file/d/..." />
            <p className="text-sm text-gray-600 mt-2">
              <strong>How to get your resume link:</strong>
              <br />
              1. Upload your resume to Google Drive
              <br />
              2. Right-click the file → Share
              <br />
              3. Set to "Anyone with the link can view"
              <br />
              4. Copy the shareable link and paste it here
            </p>
          </div>

          <h3 className="text-xl font-bold mt-6 mb-4 border-b pb-2">Experience & Skills</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Primary Tech Skill</label>
              <input type="text" name="techSkill" value={userData.techSkill} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="e.g. React & Node.js" />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Key Skill</label>
              <input type="text" name="keySkill" value={userData.keySkill} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="e.g. scalable backend systems" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Specific Area of Interest</label>
              <input type="text" name="specificArea" value={userData.specificArea} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="e.g. cloud infrastructure" />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Relevant Project</label>
              <input type="text" name="relevantProject" value={userData.relevantProject} onChange={handleUserChange} className="w-full px-3 py-2 border rounded" placeholder="e.g. a microservices-based e-commerce platform" />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button type="submit" disabled={userSaving} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
              {userSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* SMTP Section */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-2xl font-bold">Gmail SMTP Configuration</h2>
        </div>
        
        {smtpError && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{smtpError}</div>}
        {smtpSuccess && <div className="bg-green-100 text-green-600 p-3 rounded mb-4">{smtpSuccess}</div>}

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>⚠️ Disclaimer:</strong> Your SMTP credentials (email and password) are securely encrypted and stored on our servers. We never use your credentials for any purpose other than sending emails on your behalf.
          </p>
        </div>

        <form onSubmit={handleSmtpSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Gmail Address</label>
            <input type="email" name="email" value={smtpData.email} onChange={handleSmtpChange} disabled={smtpExists && !isSmtpEditing} className="w-full px-3 py-2 border rounded disabled:bg-gray-100" placeholder="your-email@gmail.com" required />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">App Password</label>
            <input type="password" name="appPassword" value={smtpData.appPassword} onChange={handleSmtpChange} disabled={smtpExists && !isSmtpEditing} className="w-full px-3 py-2 border rounded disabled:bg-gray-100" placeholder={smtpExists && !isSmtpEditing ? '••••••••' : '16-character App Password'} required={!smtpExists} />
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-3">
              <p className="text-sm text-gray-700 font-semibold mb-2">📋 How to get your Gmail App Password:</p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">myaccount.google.com/security</a></li>
                <li>Enable 2-Step Verification (if not already enabled)</li>
                <li>Scroll down and click "App passwords"</li>
                <li>Select "Mail" as the app and "Windows Computer" (or your device) as the device</li>
                <li>Google will generate a 16-character password</li>
                <li>Copy this password and paste it in the "App Password" field above</li>
                <li>Click "Save Configuration" to store it securely</li>
              </ol>
            </div>
          </div>

          <div className="flex space-x-3">
            {!smtpExists ? (
              <button type="submit" disabled={smtpSaving} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
                {smtpSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            ) : (
              <>
                {!isSmtpEditing ? (
                  <>
                    <button 
                      type="button"
                      onClick={() => setIsSmtpEditing(true)} 
                      className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      type="button"
                      onClick={handleDeleteSmtp} 
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                    >
                      🗑️ Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="submit" 
                      disabled={smtpSaving} 
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {smtpSaving ? 'Updating...' : '💾 Update'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsSmtpEditing(false);
                        setSmtpData(prev => ({ ...prev, appPassword: '' }));
                      }}
                      className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </form>

        {smtpExists && (
          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-700"><strong>Current Email:</strong> {smtpData.email}</p>
            <p className="text-sm text-gray-600 mt-1">Click <strong>Edit</strong> to change your Gmail or update your App Password</p>
          </div>
        )}
      </div>
    </div>
  );
}
