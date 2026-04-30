import React, { useState, useEffect, useRef } from 'react';
import { emailAPI, contactAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CONNECTING_EMAIL = {
  subject: 'Seeking Guidance from {{company}} Engineers',
  body: "Hi {{name}},\n\nI'm a developer with experience in {{techSkill}}, and I admire the work at {{company}}.\n\nI am in search of internship opportunities and would greatly appreciate guidance from experienced engineers like you.\n\nI've built projects around {{specificArea}}.\nHere's my GitHub: {{githubLink}}\nHere's my LeetCode: {{leetcodeLink}}\n\nWould love to connect and learn more.\n\nBest,\n{{senderName}}"
};

const AVAILABLE_VARIABLES = [
  { key: 'name', label: 'Contact Name', dummy: '[Contact Name]' },
  { key: 'company', label: 'Company', dummy: '[Company Name]' },
  { key: 'role', label: 'Role', dummy: '[Job Role]' },
  { key: 'senderName', label: 'Your Name', userField: 'name' },
  { key: 'senderEmail', label: 'Your Email', userField: 'email' },
  { key: 'senderPhone', label: 'Your Phone', userField: 'phone' },
  { key: 'githubLink', label: 'GitHub Link', userField: 'githubLink' },
  { key: 'linkedinLink', label: 'LinkedIn Link', userField: 'linkedinLink' },
  { key: 'leetcodeLink', label: 'LeetCode Link', userField: 'leetcodeLink' },
  { key: 'techSkill', label: 'Tech Skill', userField: 'techSkill' },
  { key: 'keySkill', label: 'Key Skill', userField: 'keySkill' },
  { key: 'specificArea', label: 'Specific Area', userField: 'specificArea' },
  { key: 'relevantProject', label: 'Relevant Project', userField: 'relevantProject' },
];

export default function SendEmails() {
  const { user } = useAuth();
  const [userData, setUserData] = useState({});
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  const [resumePath, setResumePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactPageIndex, setContactPageIndex] = useState(0);
  const CONTACTS_PER_PAGE = 50;

  // Session tracking
  const [sessionId, setSessionId] = useState(null);
  const [sessionProgress, setSessionProgress] = useState(null);
  const pollingRef = useRef(null);

  const bodyInputRef = useRef(null);

  useEffect(() => {
    fetchUserData();
    fetchContacts();
    fetchEmailLogs();
    
    // Load saved or default template
    if (user?.userId) {
      const savedSubject = localStorage.getItem(`template_${user.userId}_connecting_subject`);
      const savedBody = localStorage.getItem(`template_${user.userId}_connecting_body`);
      setSubject(savedSubject || DEFAULT_CONNECTING_EMAIL.subject);
      setBody(savedBody || DEFAULT_CONNECTING_EMAIL.body);
    } else {
      setSubject(DEFAULT_CONNECTING_EMAIL.subject);
      setBody(DEFAULT_CONNECTING_EMAIL.body);
    }
  }, [user]);

  // Poll for session progress
  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const response = await emailAPI.getSessionProgress(sessionId);
        setSessionProgress(response.data);

        // Stop polling when complete or failed
        if (response.data.status === 'COMPLETED' || response.data.status === 'FAILED') {
          clearInterval(pollingRef.current);
          setSending(false);
          setSuccess(`Email session completed! Sent: ${response.data.sentEmails}, Failed: ${response.data.failedEmails}`);
          setSessionId(null);
          
          // Refresh dashboard after completion
          setTimeout(() => {
            fetchContacts();
            fetchEmailLogs();
            setSessionProgress(null);
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to poll session progress', err);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval (every 2 seconds)
    pollingRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId]);

  // Reset page index when search or filter changes
  useEffect(() => {
    setContactPageIndex(0);
  }, [searchQuery, filterStatus]);

  const fetchUserData = async () => {
    try {
      const uRes = await userAPI.getMe();
      setUserData(uRes.data);
    } catch (err) {
      console.error('Failed to fetch user data for preview', err);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const response = await emailAPI.getLogs();
      setEmailLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch email logs', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactAPI.getAll();
      setContacts(response.data);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  };

  // Get sent email addresses
  const getSentEmailAddresses = () => {
    return new Set(emailLogs.map(log => log.recipientEmail).filter(Boolean));
  };

  // Filter contacts based on filter status and search
  const getFilteredContacts = () => {
    const sentEmails = getSentEmailAddresses();
    let filtered = contacts;

    if (filterStatus === 'SENT') {
      filtered = contacts.filter(c => sentEmails.has(c.email));
    } else if (filterStatus === 'NOT_SENT') {
      filtered = contacts.filter(c => !sentEmails.has(c.email));
    }

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Get status badge for a contact
  const getContactStatus = (email) => {
    const sentEmails = getSentEmailAddresses();
    if (sentEmails.has(email)) {
      const log = emailLogs.find(l => l.recipientEmail === email);
      return {
        sent: true,
        status: log?.status || 'SENT',
        color: log?.status === 'FAILED' ? 'red' : 'green',
        isSuccessful: log?.status === 'SENT' || log?.status === 'SUCCESS'
      };
    }
    return { sent: false, status: 'NOT_SENT', color: 'gray', isSuccessful: false };
  };

  // Get organized contacts with status grouping and pagination
  const getOrganizedContacts = () => {
    const unsuccessful = [];
    const successful = [];
    const allOthers = [];

    getFilteredContacts().forEach(contact => {
      const statusInfo = getContactStatus(contact.email);
      if (statusInfo.sent && statusInfo.status === 'FAILED') {
        unsuccessful.push(contact);
      } else if (statusInfo.sent && statusInfo.isSuccessful) {
        successful.push(contact);
      } else {
        allOthers.push(contact);
      }
    });

    // Combine in the required order
    const organized = [...unsuccessful, ...successful, ...allOthers];
    
    // Apply pagination
    const startIndex = contactPageIndex * CONTACTS_PER_PAGE;
    const endIndex = startIndex + CONTACTS_PER_PAGE;
    return organized.slice(startIndex, endIndex);
  };

  const getTotalContactPages = () => {
    const unsuccessful = [];
    const successful = [];
    const allOthers = [];

    getFilteredContacts().forEach(contact => {
      const statusInfo = getContactStatus(contact.email);
      if (statusInfo.sent && statusInfo.status === 'FAILED') {
        unsuccessful.push(contact);
      } else if (statusInfo.sent && statusInfo.isSuccessful) {
        successful.push(contact);
      } else {
        allOthers.push(contact);
      }
    });

    const organized = [...unsuccessful, ...successful, ...allOthers];
    return Math.ceil(organized.length / CONTACTS_PER_PAGE);
  };

  const handleContactToggle = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    const organizedIds = getOrganizedContacts().map(c => c.id);
    if (selectedContacts.length === organizedIds.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(organizedIds);
    }
  };

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setSubject(val);
    if (user?.userId) localStorage.setItem(`template_${user.userId}_connecting_subject`, val);
  };

  const handleBodyChange = (e) => {
    const val = e.target.value;
    setBody(val);
    if (user?.userId) localStorage.setItem(`template_${user.userId}_connecting_body`, val);
  };

  const insertVariable = (varKey) => {
    if (bodyInputRef.current) {
      const start = bodyInputRef.current.selectionStart;
      const end = bodyInputRef.current.selectionEnd;
      const textToInsert = `{{${varKey}}}`;
      const newBody = body.substring(0, start) + textToInsert + body.substring(end);
      setBody(newBody);
      if (user?.userId) localStorage.setItem(`template_${user.userId}_connecting_body`, newBody);
      
      // Re-focus and set cursor position after React re-render
      setTimeout(() => {
        bodyInputRef.current.focus();
        bodyInputRef.current.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }, 0);
    } else {
      // Fallback
      setBody(prev => prev + `{{${varKey}}}`);
    }
  };

  const handleSendEmails = async () => {
    if (!subject || !body) {
      setError('Please provide an email subject and body.');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      const response = await emailAPI.sendBulk({
        templateId: '', // Empty because we rely entirely on subject/body overrides now
        resumePath: resumePath,
        contactIds: selectedContacts.length > 0 ? selectedContacts : [],
        subject: subject,
        body: body,
      });

      // Start tracking session
      setSessionId(response.data.sessionId);
      setSessionProgress({
        totalEmails: selectedContacts.length || contacts.length,
        sentEmails: 0,
        failedEmails: 0,
        pendingEmails: selectedContacts.length || contacts.length,
        progress: 0,
        status: 'IN_PROGRESS'
      });
    } catch (err) {
      setError('Failed to send emails');
      console.error(err);
      setSending(false);
    }
  };

  // Generate Live Preview
  const generatePreview = (text) => {
    if (!text) return '';
    let result = text;
    AVAILABLE_VARIABLES.forEach(v => {
      const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
      const replacementValue = v.userField ? (userData[v.userField] || `[Your ${v.label}]`) : v.dummy;
      result = result.replace(regex, replacementValue);
    });
    return result;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Send Cold Emails</h1>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-600 p-3 rounded mb-4">{success}</div>}

      {/* Progress Modal */}
      {sessionProgress && sending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Sending Emails...</h2>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Progress</span>
                <span className="text-sm font-semibold">{Math.round(sessionProgress.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-4">
                <div 
                  className="bg-blue-600 h-4 rounded transition-all duration-300" 
                  style={{ width: `${sessionProgress.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-600">{sessionProgress.sentEmails}</p>
                <p className="text-xs text-gray-600 mt-1">Sent</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-gray-600">{sessionProgress.pendingEmails}</p>
                <p className="text-xs text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <p className="text-2xl font-bold text-red-600">{sessionProgress.failedEmails}</p>
                <p className="text-xs text-gray-600 mt-1">Failed</p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Total: {sessionProgress.totalEmails} emails</p>
              <p className="text-xs text-gray-500 mt-1">Sending with 5-second delays between emails...</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Email Composer */}
        <div className="bg-white p-6 rounded shadow flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Compose Email</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={handleSubjectChange}
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded disabled:bg-gray-100"
              placeholder="Email Subject..."
            />
          </div>
          
          <div className="mb-4 flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-bold text-gray-700">Body</label>
              <span className="text-xs text-gray-500">Select a variable below to insert at cursor</span>
            </div>
            
            {/* Toolbar */}
            <div className="mb-2 flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-200 rounded">
              {AVAILABLE_VARIABLES.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  disabled={sending}
                  className="bg-white border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 px-2 py-1 rounded disabled:opacity-50"
                >
                  +{v.label}
                </button>
              ))}
            </div>

            <textarea
              ref={bodyInputRef}
              value={body}
              onChange={handleBodyChange}
              disabled={sending}
              className="w-full flex-1 px-3 py-2 border border-gray-300 rounded min-h-[300px] disabled:bg-gray-100"
              placeholder="Write your cold email here..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Resume Path (Optional)</label>
            <input
              type="text"
              placeholder="e.g. C:\Users\John\resume.pdf or /Users/john/resume.pdf"
              value={resumePath}
              onChange={(e) => setResumePath(e.target.value)}
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ Enter the full path to your resume file. Make sure the file exists at this location. 
              Supports both Windows (C:\path\to\file) and Unix (/path/to/file) paths.
            </p>
          </div>

          <button
            onClick={handleSendEmails}
            disabled={sending || !subject || !body || (contacts.length > 0 && selectedContacts.length === 0)}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 mt-auto"
          >
            {sending ? '📧 Sending...' : (selectedContacts.length > 0 ? `📧 Send to ${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''}` : '📧 Select Contacts to Send')}
          </button>
        </div>

        {/* Right Column: Live Preview & Contact Selection */}
        <div className="flex flex-col gap-8 h-full">
          
          {/* Live Preview Card */}
          <div className="bg-gray-50 p-6 rounded shadow border border-gray-200">
             <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-gray-800">Live Email Preview</h2>
             <div className="bg-white p-4 rounded border border-gray-300 min-h-[250px]">
               <div className="mb-4 pb-3 border-b border-gray-200">
                 <p className="text-sm text-gray-500 mb-1">Subject:</p>
                 <p className="font-semibold text-gray-800">{generatePreview(subject) || '...'}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500 mb-2">Body:</p>
                 <div className="text-gray-800 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                   {generatePreview(body) || '...'}
                 </div>
               </div>
             </div>
          </div>

          {/* Select Contacts Card */}
          <div className="bg-white p-6 rounded shadow flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select Contacts (Page {contactPageIndex + 1}/{Math.max(1, getTotalContactPages())})</h2>
              <button 
                onClick={handleSelectAll}
                disabled={sending}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                {selectedContacts.length === getOrganizedContacts().length && getOrganizedContacts().length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Search Box */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={sending}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
              />
            </div>

            {/* Filter Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                disabled={sending}
                className={`px-3 py-2 text-sm font-semibold rounded transition ${filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
              >
                📋 All ({contacts.length})
              </button>
              <button
                onClick={() => setFilterStatus('SENT')}
                disabled={sending}
                className={`px-3 py-2 text-sm font-semibold rounded transition ${filterStatus === 'SENT' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
              >
                ✅ Already Sent ({getSentEmailAddresses().size})
              </button>
              <button
                onClick={() => setFilterStatus('NOT_SENT')}
                disabled={sending}
                className={`px-3 py-2 text-sm font-semibold rounded transition ${filterStatus === 'NOT_SENT' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
              >
                📤 Not Yet Sent ({contacts.length - getSentEmailAddresses().size})
              </button>
            </div>
            
            {getFilteredContacts().length === 0 ? (
              <p className="text-gray-500 flex-1">No contacts found. {searchQuery && 'Try a different search term.'}</p>
            ) : (
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded p-2 max-h-80">
                {(() => {
                  const organizedContacts = getOrganizedContacts();
                  const unsuccessful = organizedContacts.filter(c => {
                    const status = getContactStatus(c.email);
                    return status.sent && status.status === 'FAILED';
                  });
                  const successful = organizedContacts.filter(c => {
                    const status = getContactStatus(c.email);
                    return status.sent && status.isSuccessful;
                  });
                  const unsent = organizedContacts.filter(c => {
                    const status = getContactStatus(c.email);
                    return !status.sent;
                  });

                  return (
                    <>
                      {/* Unsuccessful Section */}
                      {unsuccessful.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 px-2 py-2 bg-red-50 border-b border-red-200 sticky top-0 z-10">
                            <span className="text-red-700 font-bold text-sm">❌ Unsuccessful ({unsuccessful.length})</span>
                          </div>
                          {unsuccessful.map(contact => {
                            const statusInfo = getContactStatus(contact.email);
                            return (
                              <label key={contact.id} className="flex items-center p-3 hover:bg-red-50 cursor-pointer border-b last:border-b-0">
                                <input 
                                  type="checkbox" 
                                  checked={selectedContacts.includes(contact.id)}
                                  onChange={() => handleContactToggle(contact.id)}
                                  disabled={sending}
                                  className="mr-3 h-4 w-4 disabled:opacity-50"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800">{contact.name}</p>
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">
                                      ❌ {statusInfo.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">{contact.email} • {contact.company}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Successful Section */}
                      {successful.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 px-2 py-2 bg-green-50 border-b border-green-200 sticky top-0 z-10">
                            <span className="text-green-700 font-bold text-sm">✅ Successful ({successful.length})</span>
                          </div>
                          {successful.map(contact => {
                            const statusInfo = getContactStatus(contact.email);
                            return (
                              <label key={contact.id} className="flex items-center p-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0">
                                <input 
                                  type="checkbox" 
                                  checked={selectedContacts.includes(contact.id)}
                                  onChange={() => handleContactToggle(contact.id)}
                                  disabled={sending}
                                  className="mr-3 h-4 w-4 disabled:opacity-50"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800">{contact.name}</p>
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">
                                      ✅ {statusInfo.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">{contact.email} • {contact.company}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Unsent Section */}
                      {unsent.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 px-2 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <span className="text-gray-700 font-bold text-sm">📤 Not Sent ({unsent.length})</span>
                          </div>
                          {unsent.map(contact => {
                            const statusInfo = getContactStatus(contact.email);
                            return (
                              <label key={contact.id} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                                <input 
                                  type="checkbox" 
                                  checked={selectedContacts.includes(contact.id)}
                                  onChange={() => handleContactToggle(contact.id)}
                                  disabled={sending}
                                  className="mr-3 h-4 w-4 disabled:opacity-50"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800">{contact.name}</p>
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-700">
                                      📤 Not Sent
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">{contact.email} • {contact.company}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Show warning if more than 50 contacts */}
                      {getFilteredContacts().length > CONTACTS_PER_PAGE && (
                        <div className="mt-4 flex justify-center items-center gap-2">
                          <button
                            onClick={() => setContactPageIndex(Math.max(0, contactPageIndex - 1))}
                            disabled={contactPageIndex === 0 || sending}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
                          >
                            ← Previous
                          </button>
                          <span className="text-sm text-gray-600 font-semibold">
                            Page {contactPageIndex + 1} of {getTotalContactPages()}
                          </span>
                          <button
                            onClick={() => setContactPageIndex(Math.min(getTotalContactPages() - 1, contactPageIndex + 1))}
                            disabled={contactPageIndex >= getTotalContactPages() - 1 || sending}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              <p>Selected: <span className="font-bold text-blue-600">{selectedContacts.length}</span> / <span className="font-bold">{getFilteredContacts().length}</span> total available</p>
              <p className="text-xs text-gray-500 mt-1">📄 Showing {getOrganizedContacts().length} contacts on this page</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
