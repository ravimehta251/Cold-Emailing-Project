import React, { useState, useEffect } from 'react';
import { contactAPI } from '../services/api';

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

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await contactAPI.getAll();
      setContacts(response.data);
    } catch (err) {
      setError('Failed to fetch contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    if (confirm('Are you sure?')) {
      try {
        await contactAPI.delete(id);
        fetchContacts();
      } catch (err) {
        setError('Failed to delete contact');
      }
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError('');
    // nnn

    try {
      const response = await contactAPI.bulkUpload(file);
      setContacts([...contacts, ...response.data.contacts]);
      alert(`✅ Successfully uploaded ${response.data.uploadedCount} contacts!`);
      e.target.value = ''; // Reset file input
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to upload contacts. Check CSV format.';
      setError(errorMsg);
      console.error('Bulk upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">HR Contacts</h1>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}

      <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Contact'}
          </button>
          <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
            Bulk Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              className="hidden"
            />
          </label>
        </div>

        {showForm && (
          <div className="bg-gray-100 p-6 rounded mb-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded"
                  required
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Company"
                  value={formData.company}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded"
                  required
                />
                <input
                  type="text"
                  name="role"
                  placeholder="Role"
                  value={formData.role}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editing ? 'Update' : 'Add'} Contact
              </button>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 px-4 py-2">Name</th>
                <th className="border border-gray-300 px-4 py-2">Company</th>
                <th className="border border-gray-300 px-4 py-2">Role</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="border border-gray-300 px-4 py-2">{contact.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{contact.company}</td>
                  <td className="border border-gray-300 px-4 py-2">{contact.role}</td>
                  <td className="border border-gray-300 px-4 py-2">{contact.email}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      onClick={() => {
                        setFormData(contact);
                        setEditing(contact.id);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:underline"
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
