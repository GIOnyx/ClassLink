import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [lastSynced, setLastSynced] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      setLastSynced(new Date());
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

  const lastSyncedLabel = useMemo(() => {
    if (!lastSynced) {
      return 'Never';
    }
    return lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [lastSynced]);

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return accounts;
    }
    return accounts.filter((account) => {
      const haystack = `${account.name || ''} ${account.email || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [accounts, searchQuery]);

  const rosterInsights = useMemo(() => {
    const credentialReady = accounts.filter((account) => Boolean(account.password && account.password.trim())).length;
    const credentialStat = accounts.length ? `${credentialReady}/${accounts.length}` : '0/0';
    return [
      { label: 'Active admins', value: accounts.length, detail: 'CSV and database sources' },
      { label: 'Session role', value: info?.role || 'N/A', detail: info?.userType || 'Administrator' },
      { label: 'Credentials stored', value: credentialStat, detail: 'Accounts with saved passwords' },
      { label: 'Last sync', value: lastSyncedLabel, detail: accountsLoading ? 'Sync in progress' : 'Manual refresh available' }
    ];
  }, [accounts, info?.role, info?.userType, lastSyncedLabel, accountsLoading]);

  const openAddModal = () => {
    setFormFeedback({ error: '', success: '' });
    setShowAddModal(true);
  };

  const closeAddModal = () => setShowAddModal(false);

  const heroStatusClass = accountsLoading ? 'status-chip syncing' : 'status-chip live';
  const heroStatusLabel = accountsLoading ? 'Syncing roster...' : 'Roster current';

  return (
    <div className="admin-access-page standard-page-layout">
      {loading ? (
        <div className="admin-loading-state">Loading...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : !isAdmin ? (
        <div className="admin-warning">You need admin access to view this dashboard.</div>
      ) : (
        <>
          <section className="access-hero">
            <div className="access-hero-content">
              <p className="access-hero-kicker">Access administration</p>
              <h1>Administrator directory</h1>
              <p className="access-hero-subtitle">
                Keep privileged accounts aligned with enrollment and records teams. Refresh the roster, audit credentials,
                and invite trusted users in a single workspace.
              </p>
              <div className="access-hero-meta">
                <span>Signed in as {info?.userType || 'Administrator'}</span>
                <span>Role: {info?.role || 'N/A'}</span>
                <span className={heroStatusClass}>{heroStatusLabel}</span>
              </div>
            </div>
            <div className="access-hero-actions">
              <button type="button" className="admin-ghost-btn" onClick={fetchAdminAccounts} disabled={accountsLoading}>
                {accountsLoading ? 'Refreshing...' : 'Refresh roster'}
              </button>
              <button type="button" className="admin-primary-btn" onClick={openAddModal}>
                Add admin
              </button>
            </div>
          </section>

          <section className="access-insights-grid">
            {rosterInsights.map((card) => (
              <article key={card.label} className="access-insight-card">
                <p className="insight-label">{card.label}</p>
                <p className="insight-value">{card.value}</p>
                <p className="insight-detail">{card.detail}</p>
              </article>
            ))}
          </section>

          <section className="access-main-grid">
            <article className="roster-panel">
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Directory</p>
                  <h3>Admin roster</h3>
                  <p className="panel-subtitle">Entries loaded from admin-accounts.csv and the live database.</p>
                </div>
                <span className="panel-count">
                  Showing {filteredAccounts.length} of {accounts.length || 0}
                </span>
              </div>

              <div className="roster-controls">
                <div className="roster-search">
                  <input
                    type="search"
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search admins"
                  />
                </div>
                <button
                  type="button"
                  className="admin-ghost-btn small secondary"
                  onClick={() => setSearchQuery('')}
                  disabled={!searchQuery}
                >
                  Clear search
                </button>
              </div>

              {accountsError && <p className="admin-error inline">{accountsError}</p>}
              {accountsLoading && accounts.length > 0 && <p className="roster-hint">Refreshing roster...</p>}

              <div className="admin-table-wrapper modern">
                {accountsLoading && accounts.length === 0 ? (
                  <div className="admin-loading-state">Loading admin accounts...</div>
                ) : filteredAccounts.length === 0 ? (
                  <p className="roster-empty">
                    {searchQuery ? 'No admin accounts match your search.' : 'No admin accounts found.'}
                  </p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => (
                        <tr key={account.id || account.email}>
                          <td>
                            <div className="admin-identity">
                              <p className="admin-name">{account.name || account.email}</p>
                              <span className="admin-id-label">{account.id || 'CSV import'}</span>
                            </div>
                          </td>
                          <td>{account.email}</td>
                          <td className="admin-password-cell">{account.password || 'Hidden'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </article>

            <aside className="guidance-panel">
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Policies</p>
                  <h3>Access checklist</h3>
                </div>
              </div>
              <p className="panel-subtitle">Use this panel to keep the roster aligned with security policy.</p>
              <ul className="guidance-list">
                <li>Review the roster after every enrollment cycle and remove inactive accounts.</li>
                <li>Store temporary passwords only when needed and rotate them after hand off.</li>
                <li>Confirm each admin has multi factor authentication enabled with IT.</li>
                <li>Share CSV exports only inside secure internal channels.</li>
              </ul>
              <button type="button" className="admin-primary-btn full" onClick={openAddModal}>
                Invite another admin
              </button>
            </aside>
          </section>
        </>
      )}

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={closeAddModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Add administrator</h3>
                <p>Creates an admin record and appends it to admin-accounts.csv.</p>
              </div>
              <button type="button" className="admin-close-button" onClick={closeAddModal} aria-label="Close">
                x
              </button>
            </div>
            <form className="admin-form" onSubmit={handleAddAdmin}>
              <label>
                Full name
                <input type="text" name="name" value={newAdmin.name} onChange={handleInputChange} placeholder="e.g., Jane Doe" />
              </label>
              <label>
                Email
                <input type="email" name="email" value={newAdmin.email} onChange={handleInputChange} required />
              </label>
              <label>
                Password
                <input type="text" name="password" value={newAdmin.password} onChange={handleInputChange} required />
              </label>
              {formFeedback.error && <p className="admin-error">{formFeedback.error}</p>}
              {formFeedback.success && <p className="admin-success">{formFeedback.success}</p>}
              <button type="submit" className="admin-submit" disabled={savingAdmin}>
                {savingAdmin ? 'Saving...' : 'Add Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
