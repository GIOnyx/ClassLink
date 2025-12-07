import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../App.css';
import './StudentPage.css';
import { me, getAdminAccounts, createAdminAccount, removeAdminAccount } from '../services/backend';

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
  const [removalTarget, setRemovalTarget] = useState(null);
  const [removalPassword, setRemovalPassword] = useState('');
  const [removalError, setRemovalError] = useState('');
  const [removalLoading, setRemovalLoading] = useState(false);
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
      console.error('Failed to add admin account', err);
      const responsePayload = err?.response?.data;
      const derivedMessage = typeof responsePayload === 'string'
        ? responsePayload
        : responsePayload?.error || err?.message || 'Failed to add admin account.';
      setFormFeedback({ error: derivedMessage, success: '' });
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

  const formatJoinedDate = (value) => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const rosterInsights = useMemo(() => {
    const credentialReady = accounts.filter((account) => Boolean(account.password && account.password.trim())).length;
    const credentialStat = accounts.length ? `${credentialReady}/${accounts.length}` : '0/0';
    return [
      { label: 'Active admins', value: accounts.length, detail: 'Synced from the live MySQL roster' },
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

  const openRemovalModal = (account) => {
    setRemovalTarget(account);
    setRemovalPassword('');
    setRemovalError('');
  };

  const closeRemovalModal = () => {
    setRemovalTarget(null);
    setRemovalPassword('');
    setRemovalError('');
    setRemovalLoading(false);
  };

  const handleConfirmRemove = async (event) => {
    event.preventDefault();
    if (!removalTarget) {
      return;
    }
    if (!removalPassword.trim()) {
      setRemovalError('Please enter your password to confirm the removal.');
      return;
    }
    setRemovalLoading(true);
    setRemovalError('');
    try {
      await removeAdminAccount({ email: removalTarget.email, password: removalPassword.trim() });
      await fetchAdminAccounts();
      closeRemovalModal();
    } catch (err) {
      const message = err?.response?.data || 'Unable to remove administrator right now.';
      setRemovalError(typeof message === 'string' ? message : 'Unable to remove administrator right now.');
    } finally {
      setRemovalLoading(false);
    }
  };

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
                  <p className="panel-subtitle">Entries loaded directly from the live administrator database.</p>
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
                        <th>Joined</th>
                        <th aria-label="Remove admin"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => {
                        const joinedLabel = formatJoinedDate(account.createdAt);
                        return (
                          <tr key={account.id || account.email}>
                            <td>
                              <div className="admin-identity">
                                <p className="admin-name">{account.name || account.email}</p>
                                <span className="admin-id-label">{account.id || 'CSV import'}</span>
                              </div>
                            </td>
                            <td>{account.email}</td>
                            <td className="admin-joined-col">
                              {joinedLabel ? `${joinedLabel}` : '—'}
                            </td>
                            <td className="admin-remove-cell">
                              <button
                                type="button"
                                className="admin-remove-link"
                                onClick={() => openRemovalModal(account)}
                              >
                                REMOVE
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </article>

          </section>
        </>
      )}

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={closeAddModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Add administrator</h3>
                <p>Creates an admin record directly in the database.</p>
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
      {removalTarget && (
        <div className="admin-modal-overlay" onClick={closeRemovalModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Confirm admin removal</h3>
                <p className="panel-subtitle">
                  Removing {removalTarget.name || removalTarget.email} will revoke their admin access immediately.
                </p>
              </div>
              <button type="button" className="admin-close-button" onClick={closeRemovalModal} aria-label="Close">
                x
              </button>
            </div>
            <p className="admin-remove-description">
              Enter your password to confirm this change. This action cannot be undone and removes the account from
              the live administrator database immediately.
            </p>
            <form className="admin-remove-form" onSubmit={handleConfirmRemove}>
              <label>
                Current password
                <input
                  type="password"
                  value={removalPassword}
                  onChange={(e) => setRemovalPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={removalLoading}
                />
              </label>
              {removalError && <p className="admin-error">{removalError}</p>}
              <button type="submit" className="admin-submit" disabled={removalLoading}>
                {removalLoading ? 'Removing...' : 'Confirm removal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
