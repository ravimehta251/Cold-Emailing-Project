import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { emailAPI } from '../services/api';

// Simple Virtualization: Only render visible rows
function VirtualizedEmailTable({ emails, itemHeight = 60, containerHeight = 600 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight]);

  const visibleEmails = emails.slice(visibleRange.startIndex, visibleRange.endIndex);
  const offsetY = visibleRange.startIndex * itemHeight;

  const getStatusColor = (status) => {
    if (status === 'SUCCESS') return 'bg-green-100 text-green-800';
    if (status === 'FAILED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'SUCCESS') return '✅';
    if (status === 'FAILED') return '❌';
    return '📧';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="overflow-y-auto border border-gray-300 rounded-lg"
      style={{ height: `${containerHeight}px` }}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-50 z-10">
          <tr>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Status</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Email</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Name</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Subject</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Sent At</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Retries</th>
          </tr>
        </thead>
      </table>

      {/* Virtual Scroller Content */}
      <div style={{ height: `${emails.length * itemHeight}px`, position: 'relative' }}>
        {/* Top Spacer */}
        <div style={{ height: `${offsetY}px` }} />

        {/* Visible Items */}
        <table className="w-full border-collapse" style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          <tbody>
            {visibleEmails.map((log, index) => (
              <tr
                key={log.id || `${index}-${log.recipientEmail}`}
                className="border-b hover:bg-gray-50 transition"
                style={{ height: `${itemHeight}px` }}
                title={log.errorMessage ? `Error: ${log.errorMessage}` : ''}
              >
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.status)}`}>
                    {getStatusIcon(log.status)} {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800 text-sm">{log.recipientEmail}</td>
                <td className="px-4 py-3 text-gray-800 text-sm">{log.recipientName || '-'}</td>
                <td className="px-4 py-3 text-gray-800 text-sm truncate max-w-xs">{log.subject || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDate(log.sentAt)}</td>
                <td className="px-4 py-3 text-center text-gray-600 text-sm font-semibold">{log.retryCount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EmailHistory() {
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInfo, setPageInfo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'virtualized'

  useEffect(() => {
    fetchEmailLogs();
  }, [currentPage]);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await emailAPI.getLogsPaginated(currentPage);
      setEmailLogs(response.data.content);
      setPageInfo({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
        hasNext: response.data.hasNext,
        hasPrevious: response.data.hasPrevious,
        pageSize: response.data.pageSize,
      });
    } catch (err) {
      setError('Failed to fetch email logs');
      console.error('Error fetching email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter emails based on status and search
  const filteredEmails = useMemo(() => {
    return emailLogs.filter(log => {
      // Status filter
      if (filterStatus !== 'ALL' && log.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.recipientEmail?.toLowerCase().includes(query) ||
          log.recipientName?.toLowerCase().includes(query) ||
          log.subject?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [emailLogs, filterStatus, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading && currentPage === 0) {
    return <div className="text-center py-10">Loading email history...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">📧 Email History</h1>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}

      {/* Stats */}
      {pageInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-bold">{pageInfo.totalElements}</span> total emails |{' '}
            <span className="font-bold">{pageInfo.pageSize}</span> per page |{' '}
            Page <span className="font-bold">{pageInfo.currentPage + 1}</span> of{' '}
            <span className="font-bold">{pageInfo.totalPages}</span>
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search by email, name, or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-2">
          {['ALL', 'SUCCESS', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === status
                  ? status === 'SUCCESS'
                    ? 'bg-green-600 text-white'
                    : status === 'FAILED'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' && '📋'}
              {status === 'SUCCESS' && '✅'}
              {status === 'FAILED' && '❌'}
              {' '}
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('paginated')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            viewMode === 'paginated' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📄 Paginated View (50/page)
        </button>
        <button
          onClick={() => setViewMode('virtualized')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            viewMode === 'virtualized' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ⚡ Virtualized View (Current Page)
        </button>
      </div>

      {/* Email Logs Display */}
      {filteredEmails.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No emails found. {searchQuery && 'Try a different search term.'}
        </div>
      ) : viewMode === 'virtualized' ? (
        <VirtualizedEmailTable emails={filteredEmails} itemHeight={60} containerHeight={600} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Status</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Email</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Name</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Subject</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Sent At</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Retries</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.map((log, index) => (
                <tr
                  key={log.id || index}
                  className="border-b hover:bg-gray-50 transition"
                  title={log.errorMessage ? `Error: ${log.errorMessage}` : ''}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      log.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status === 'SUCCESS' && '✅'}
                      {log.status === 'FAILED' && '❌'}
                      {log.status === 'PENDING' && '⏳'}
                      {' '}{log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{log.recipientEmail}</td>
                  <td className="px-4 py-3 text-gray-800">{log.recipientName || '-'}</td>
                  <td className="px-4 py-3 text-gray-800 truncate max-w-xs">{log.subject || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(log.sentAt)}</td>
                  <td className="px-4 py-3 text-center text-gray-600 font-semibold">{log.retryCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4 flex-wrap">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={!pageInfo.hasPrevious || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pageInfo.totalPages) }).map((_, i) => {
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-3 py-2 rounded-lg font-semibold transition ${
                    currentPage === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
            {pageInfo.totalPages > 5 && <span className="text-gray-500">...</span>}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(pageInfo.totalPages - 1, currentPage + 1))}
            disabled={!pageInfo.hasNext || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
