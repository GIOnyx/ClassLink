import React, { useCallback, useEffect, useState } from 'react';
import '../App.css';
import './StudentPage.css';
import { me, getAdminAccounts, createAdminAccount } from '../services/backend';

const StudentPage = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [formFeedback, setFormFeedback] = useState({ error: '', success: '' });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await me();
        setInfo(data);
      } catch (e) {
        setError('Failed to load your session information.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchAdminAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const { data } = await getAdminAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data || 'Unable to load admin accounts.';
      setAccountsError(typeof message === 'string' ? message : 'Unable to load admin accounts.');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (info?.role === 'ADMIN') {
      fetchAdminAccounts();
    }
  }, [info, fetchAdminAccounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setFormFeedback({ error: '', success: '' });
    if (!newAdmin.email || !newAdmin.password) {
      setFormFeedback({ error: 'Email and password are required.', success: '' });
      return;
    }
    setSavingAdmin(true);
    try {
      await createAdminAccount({
        email: newAdmin.email,
        password: newAdmin.password,
        name: newAdmin.name
      });
      setFormFeedback({ error: '', success: 'Admin account added successfully.' });
      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdminAccounts();
      setShowAddModal(false);
    } catch (err) {
      const message = err?.response?.data || 'Failed to add admin account.';
      setFormFeedback({ error: typeof message === 'string' ? message : 'Failed to add admin account.', success: '' });
    } finally {
      setSavingAdmin(false);
    }
  };

  const isAdmin = info?.role === 'ADMIN';

  return (
    <div className="standard-page-layout admin-dashboard">
      <h2 className="student-dashboard-header">Admin Dashboard</h2>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : !isAdmin ? (
        <div className="admin-warning">You need admin access to view this dashboard.</div>
      ) : (
        <>
          <div className="admin-summary-card">
            <div>
              <p className="admin-summary-label">Signed in as</p>
              <p className="admin-summary-value">{info?.userType || 'admin'}</p>
            </div>
            <div>
              <p className="admin-summary-label">Role</p>
              <p className="admin-summary-value">{info?.role}</p>
            </div>
            <div>
              <p className="admin-summary-label">User ID</p>
              <p className="admin-summary-value">{info?.userId}</p>
            </div>
          </div>

          <div className="admin-grid">
            <section className="admin-card full">
              <div className="admin-card-header">
                <div>
                  <h3>Admin Accounts</h3>
                  <p>Entries loaded from admin-accounts.csv and live database.</p>
                </div>
                <div className="admin-card-actions">
                  <span className="admin-count-chip">{accounts.length} total</span>
                  <button
                    type="button"
                    className="admin-add-button"
                    onClick={() => {
                      setFormFeedback({ error: '', success: '' });
                      setShowAddModal(true);
                    }}
                    aria-label="Add admin"
                  >
                    +
                  </button>
                </div>
              </div>
              {accountsLoading ? (
                <p>Loading admin accounts…</p>
              ) : accountsError ? (
                <p className="admin-error">{accountsError}</p>
              ) : accounts.length === 0 ? (
                <p className="admin-empty">No admin accounts found.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr key={account.id || account.email}>
                          <td>{account.name || account.email}</td>
                          <td>{account.email}</td>
                          <td className="admin-password-cell">{account.password || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
          {showAddModal && (
            <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                  <div>
                    <h3>Add New Admin</h3>
                    <p>Creates an admin record and appends it to admin-accounts.csv.</p>
                  </div>
                  <button type="button" className="admin-close-button" onClick={() => setShowAddModal(false)} aria-label="Close">
                    ×
                  </button>
                </div>
                <form className="admin-form" onSubmit={handleAddAdmin}>
                  <label>
                    Full name
                    <input
                      type="text"
                      name="name"
                      value={newAdmin.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Jane Doe"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={newAdmin.email}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="text"
                      name="password"
                      value={newAdmin.password}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  {formFeedback.error && <p className="admin-error">{formFeedback.error}</p>}
                  {formFeedback.success && <p className="admin-success">{formFeedback.success}</p>}
                  <button type="submit" className="admin-submit" disabled={savingAdmin}>
                    {savingAdmin ? 'Saving…' : 'Add Admin'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentPage;