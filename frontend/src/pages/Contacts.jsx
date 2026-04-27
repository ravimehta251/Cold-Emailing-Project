import React, { useState, useEffect, useMemo, useRef } from 'react';
import { contactAPI } from '../services/api';

// Virtualized Table Component for Contacts
function VirtualizedContactsTable({ contacts, itemHeight = 65, containerHeight = 600, onEdit, onDelete }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight]);

  const visibleContacts = contacts.slice(visibleRange.startIndex, visibleRange.endIndex);
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="overflow-y-auto border border-gray-300 rounded-lg"
      style={{ height: `${containerHeight}px` }}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Name</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Company</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Role</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Email</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Actions</th>
          </tr>
        </thead>
      </table>

      {/* Virtual Scroller Content */}
      <div style={{ height: `${contacts.length * itemHeight}px`, position: 'relative' }}>
        {/* Top Spacer */}
        <div style={{ height: `${offsetY}px` }} />

        {/* Visible Items */}
        <table className="w-full border-collapse" style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          <tbody>
            {visibleContacts.map((contact, index) => (
              <tr
                key={contact.id}
                className="border-b hover:bg-gray-50 transition"
                style={{ height: `${itemHeight}px` }}
              >
                <td className="px-4 py-3 text-gray-800 text-sm">{contact.name}</td>
                <td className="px-4 py-3 text-gray-800 text-sm">{contact.company}</td>
                <td className="px-4 py-3 text-gray-800 text-sm">{contact.role}</td>
                <td className="px-4 py-3 text-gray-800 text-sm">{contact.email}</td>
                <td className="px-4 py-3 text-sm flex gap-2">
                  <button
                    onClick={() => onEdit(contact)}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(contact.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    email: '',
  });
  const [editing, setEditing] = useState(null);

  // Pagination & Virtualization
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInfo, setPageInfo] = useState(null);
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'virtualized'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContacts();
  }, [currentPage]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await contactAPI.getAllPaginated(currentPage);
      setContacts(response.data.content);
      setPageInfo({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
        hasNext: response.data.hasNext,
        hasPrevious: response.data.hasPrevious,
        pageSize: response.data.pageSize,
      });
    } catch (err) {
      setError('Failed to fetch contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.role?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await contactAPI.update(editing, formData);
      } else {
        await contactAPI.create(formData);
      }
      setFormData({ name: '', company: '', role: '', email: '' });
      setEditing(null);
      setShowForm(false);
      fetchContacts();
    } catch (err) {
      setError('Failed to save contact');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactAPI.delete(id);
        fetchContacts();
      } catch (err) {
        setError('Failed to delete contact');
      }
    }
  };

  const handleEdit = (contact) => {
    setFormData(contact);
    setEditing(contact.id);
    setShowForm(true);
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await contactAPI.bulkUpload(file);
      alert(`✅ Successfully uploaded ${response.data.uploadedCount} contacts!`);
      e.target.value = '';
      setCurrentPage(0);
      fetchContacts();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to upload contacts. Check CSV format.';
      setError(errorMsg);
      console.error('Bulk upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && currentPage === 0) {
    return <div className="text-center py-10">Loading contacts...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">👥 HR Contacts</h1>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}

      {/* Stats */}
      {pageInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-bold">{pageInfo.totalElements}</span> total contacts |{' '}
            <span className="font-bold">{pageInfo.pageSize}</span> per page |{' '}
            Page <span className="font-bold">{pageInfo.currentPage + 1}</span> of{' '}
            <span className="font-bold">{pageInfo.totalPages}</span>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          {showForm ? '✕ Cancel' : '➕ Add Contact'}
        </button>
        <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer font-semibold">
          📤 Bulk Upload CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleBulkUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-100 p-6 rounded mb-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-bold mb-4">{editing ? 'Update Contact' : 'Add New Contact'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="name"
                placeholder="Name*"
                value={formData.name}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                name="company"
                placeholder="Company*"
                value={formData.company}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                name="role"
                placeholder="Role*"
                value={formData.role}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email*"
                value={formData.email}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
            >
              {editing ? '✏️ Update' : '➕ Add'} Contact
            </button>
          </form>
        </div>
      )}

      {/* Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, company, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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

      {/* Contacts Display */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchQuery ? 'No contacts match your search.' : 'No contacts found.'}
        </div>
      ) : viewMode === 'virtualized' ? (
        <VirtualizedContactsTable
          contacts={filteredContacts}
          itemHeight={65}
          containerHeight={600}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Name</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Company</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Role</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Email</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-gray-800">{contact.name}</td>
                  <td className="px-4 py-3 text-gray-800">{contact.company}</td>
                  <td className="px-4 py-3 text-gray-800">{contact.role}</td>
                  <td className="px-4 py-3 text-gray-800">{contact.email}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm font-semibold"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm font-semibold"
                    >
                      🗑️ Delete
                    </button>
                  </td>
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
            {Array.from({ length: Math.min(5, pageInfo.totalPages) }).map((_, i) => (
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
            ))}
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
