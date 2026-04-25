import React, { useState, useEffect } from 'react';
import { emailAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmailsSent: 0,
    successfulEmails: 0,
    failedEmails: 0,
    successRate: 0,
    emailsSentToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        emailAPI.getStats(),
        emailAPI.getLogs()
      ]);
      setStats(statsRes.data);
      // Sort logs by date descending
      const sortedLogs = logsRes.data.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      setLogs(sortedLogs);
    } catch (err) {
      setError('Failed to fetch dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  const filteredLogs = logs.filter(log => filterStatus === 'ALL' || log.status === filterStatus);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={fetchStats}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
        >
          🔄 Refresh
        </button>
      </div>
      
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded shadow">
          <h3 className="text-gray-700 font-bold text-sm">Total Emails Sent</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalEmailsSent}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-6 rounded shadow">
          <h3 className="text-gray-700 font-bold text-sm">Successful</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.successfulEmails}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 p-6 rounded shadow">
          <h3 className="text-gray-700 font-bold text-sm">Failed</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.failedEmails}</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded shadow">
          <h3 className="text-gray-700 font-bold text-sm">Success Rate</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.successRate.toFixed(2)}%</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 p-6 rounded shadow">
          <h3 className="text-gray-700 font-bold text-sm">Sent Today</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.emailsSentToday}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold">Email Logs ({filteredLogs.length})</h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded p-1">
            <button 
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 text-sm font-semibold rounded transition ${filterStatus === 'ALL' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              All ({logs.length})
            </button>
            <button 
              onClick={() => setFilterStatus('SUCCESS')}
              className={`px-3 py-1 text-sm font-semibold rounded transition ${filterStatus === 'SUCCESS' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Success ({logs.filter(l => l.status === 'SUCCESS').length})
            </button>
            <button 
              onClick={() => setFilterStatus('FAILED')}
              className={`px-3 py-1 text-sm font-semibold rounded transition ${filterStatus === 'FAILED' ? 'bg-white shadow text-red-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Failed ({logs.filter(l => l.status === 'FAILED').length})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filterStatus === 'ALL' 
              ? 'No email logs found. Start sending emails to see them here.' 
              : `No ${filterStatus.toLowerCase()} email logs found.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-4 font-bold text-gray-700">Date</th>
                  <th className="p-4 font-bold text-gray-700">Recipient</th>
                  <th className="p-4 font-bold text-gray-700">Subject</th>
                  <th className="p-4 font-bold text-gray-700">Status</th>
                  <th className="p-4 font-bold text-gray-700 text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className={`border-b hover:bg-gray-50 ${log.status === 'FAILED' ? 'bg-red-50' : ''}`}>
                      <td className="p-4 text-sm whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-800">{log.recipientName}</p>
                        <p className="text-sm text-gray-500">{log.recipientEmail}</p>
                      </td>
                      <td className="p-4 text-sm max-w-xs truncate" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'SUCCESS' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status === 'SUCCESS' ? '✓ Sent' : '✗ Failed'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                        >
                          {expandedLog === log.id ? '▼ Hide' : '▶ View'}
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan="5" className="p-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-gray-700 mb-2">Email Subject:</h4>
                              <div className="bg-white p-3 border border-gray-200 rounded text-sm text-gray-800">
                                {log.subject}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-bold text-gray-700 mb-2">Email Body:</h4>
                              <div className="bg-white p-4 border border-gray-200 rounded whitespace-pre-wrap text-sm text-gray-800 font-mono max-h-64 overflow-y-auto">
                                {log.body || 'No body content available.'}
                              </div>
                            </div>
                            
                            {log.errorMessage && (
                              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
                                <h4 className="font-bold mb-2">⚠️ Error Details:</h4>
                                <p className="text-sm">{log.errorMessage}</p>
                              </div>
                            )}
                            
                            {log.retryCount > 0 && (
                              <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded">
                                <p className="text-sm">Retry attempts: {log.retryCount}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
