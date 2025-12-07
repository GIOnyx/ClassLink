import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../App.css';
import './ProfilePage.css';
import { me, getMyStudent, getMyAdmin, submitStudentApplication, uploadMyProfileImage, uploadMyAdminProfileImage, updateMyAdmin, changeMyPassword, getMyApplicationHistory } from '../services/backend';

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', status: '', profileImageUrl: '' });
    const [originalProfile, setOriginalProfile] = useState({ name: '', email: '', phone: '', status: '', profileImageUrl: '' });
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState('');
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordFeedback, setPasswordFeedback] = useState({ error: '', success: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const [historyEntries, setHistoryEntries] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [profileSyncedAt, setProfileSyncedAt] = useState(null);
    const [notificationsRefreshedAt, setNotificationsRefreshedAt] = useState(null);
    const fileInputRef = useRef(null);

    const outletContext = typeof useOutletContext === 'function' ? useOutletContext() : {};
    const {
        notifications: sharedNotifications = [],
        notificationsLoading = false,
        refreshNotifications = () => {},
        markNotificationRead = () => {}
    } = outletContext || {};

    const isAdmin = role === 'ADMIN';

    // Helper to resolve image URL (handles relative vs absolute)
    const resolveImageSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
        const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
        return base + url;
    };

    // Icons (kept inline as components for simplicity, or move to separate file)

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                const sessionRes = await me();
                const sessionData = sessionRes?.data || {};
                const currentRole = sessionData.role || '';
                setRole(currentRole);
                if (currentRole === 'ADMIN') {
                    const adminRes = await getMyAdmin();
                    const a = adminRes?.data || {};
                    const loaded = {
                        name: a.name || '',
                        email: a.email || '',
                        phone: '',
                        status: 'ADMIN',
                        profileImageUrl: a.profileImageUrl || ''
                    };
                    setProfile(loaded);
                    setOriginalProfile(loaded);
                } else {
                    const studentRes = await getMyStudent();
                    const s = studentRes?.data || {};
                    const loaded = {
                        name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || '',
                        email: s.email || s.username || '',
                        phone: s.phone || s.mobile || s.contactNumber || '',
                        status: s.status || s.enrollmentStatus || '',
                        profileImageUrl: s.profileImageUrl || ''
                    };
                    setProfile(loaded);
                    setOriginalProfile(loaded);
                }
                setProfileSyncedAt(new Date());
            } catch (e) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        refreshNotifications();
        setNotificationsRefreshedAt(new Date());
    }, [refreshNotifications]);

    const loadHistory = useCallback(async () => {
        if (role === 'ADMIN') return;
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const res = await getMyApplicationHistory();
            setHistoryEntries(res?.data || []);
        } catch (err) {
            const message = err?.response?.data?.error || 'Unable to load application history.';
            setHistoryError(message);
        } finally {
            setHistoryLoading(false);
        }
    }, [role]);

    useEffect(() => {
        if (role && role !== 'ADMIN') {
            loadHistory();
        }
    }, [role, loadHistory]);

    const handleNotificationRefresh = async () => {
        try {
            await Promise.resolve(refreshNotifications());
        } finally {
            setNotificationsRefreshedAt(new Date());
        }
    };

    // Handle profile image file selection & upload
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setProfile(p => ({ ...p, profileImageUrl: previewUrl })); // optimistic preview
        setUploading(true);
        try {
            const res = role === 'ADMIN' ? await uploadMyAdminProfileImage(file) : await uploadMyProfileImage(file);
            const url = res?.data?.profileImageUrl;
            if (url) {
                setProfile(p => ({ ...p, profileImageUrl: url }));
                setOriginalProfile(p => ({ ...p, profileImageUrl: url }));
            }
        } catch (err) {
            console.error('Upload failed', err);
            setError('Failed to upload image');
            setProfile(p => ({ ...p, profileImageUrl: originalProfile.profileImageUrl })); // revert to previous
        } finally {
            setUploading(false);
        }
    };

    const handleAvatarClick = () => {
        if (uploading) return;
        fileInputRef.current?.click();
    };

    const handleAvatarKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleAvatarClick();
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
    };

    const handleSave = async () => {
        setError('');
        if (!profileChanged) {
            setIsEditing(false);
            return;
        }
        setSaving(true);
        try {
            if (role === 'ADMIN') {
                const res = await updateMyAdmin({ name: profile.name });
                const data = res?.data || {};
                const updatedName = data.name || profile.name;
                setProfile(p => ({ ...p, name: updatedName }));
                setOriginalProfile(p => ({ ...p, name: updatedName }));
            } else {
                await submitStudentApplication({ name: profile.name, phone: profile.phone });
                setOriginalProfile({ ...profile });
            }
            setProfileSyncedAt(new Date());
            setIsEditing(false);
        } catch (e) {
            setError('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordFieldChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordFeedback({ error: '', success: '' });
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordFeedback({ error: 'All fields are required.', success: '' });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordFeedback({ error: 'New password and confirmation do not match.', success: '' });
            return;
        }
        if (passwordForm.oldPassword === passwordForm.newPassword) {
            setPasswordFeedback({ error: 'New password must be different from the old password.', success: '' });
            return;
        }
        setChangingPassword(true);
        try {
            await changeMyPassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword });
            setPasswordFeedback({ error: '', success: 'Password updated successfully.' });
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            const message = err?.response?.data?.error || 'Failed to change password.';
            setPasswordFeedback({ error: message, success: '' });
        } finally {
            setChangingPassword(false);
        }
    };

    const formatHistoryDate = (value) => {
        if (!value) return '—';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    };

    const notificationTypeLabels = {
        APPLICATION_STATUS: 'Application Update',
        CALENDAR_EVENT: 'Calendar Event',
        GENERAL: 'Notification'
    };

    const formatNotificationType = (type) => notificationTypeLabels[type] || 'Notification';

    const formatNotificationTimestamp = (value) => {
        if (!value) return '—';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    };

    const approvedHistory = historyEntries.filter((entry) => entry.status === 'APPROVED');
    const deniedHistory = historyEntries.filter((entry) => entry.status === 'REJECTED');
    const heroEntry = approvedHistory[0] || deniedHistory[0] || null;
    const heroStatusLabel = heroEntry
        ? `${heroEntry.status === 'APPROVED' ? 'Approved' : 'Denied'} on ${formatHistoryDate(heroEntry.changedAt)}`
        : 'No application history yet';
    const heroMessage = heroEntry
        ? (heroEntry.remarks && heroEntry.remarks.trim().length > 0
            ? heroEntry.remarks
            : heroEntry.status === 'APPROVED'
                ? 'Your academic status has been verified. Congratulations!'
                : 'Your application was denied. Please review the notes from the admissions team.')
        : 'Submit an application to see your status updates here.';
    const heroStatusClass = heroEntry ? (heroEntry.status === 'APPROVED' ? 'approved' : 'denied') : 'empty';
    const approvedBarWidth = approvedHistory.length ? '100%' : '0%';
    const deniedBarWidth = deniedHistory.length ? '100%' : '0%';

    const buildReasonList = (text) => {
        if (!text) return [];
        return text
            .split(/\r?\n|\u2022|•/)
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const isApprovedStudent = role !== 'ADMIN' && (profile.status || '').toUpperCase() === 'APPROVED';

    const normalizeField = (value = '') => String(value).trim();
    const profileChanged = useMemo(() => {
        const nameChanged = normalizeField(profile.name) !== normalizeField(originalProfile.name);
        if (isAdmin) {
            return nameChanged;
        }
        const phoneChanged = (profile.phone || '') !== (originalProfile.phone || '');
        return nameChanged || phoneChanged;
    }, [isAdmin, profile.name, originalProfile.name, profile.phone, originalProfile.phone]);

    const handleCancelEdit = () => {
        setProfile({ ...originalProfile });
        setIsEditing(false);
        setError('');
    };

    const profileStatusLabel = isAdmin ? 'Administrator' : (profile.status || 'Pending');
    const statusClassName = profileStatusLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const lastProfileSyncLabel = profileSyncedAt
        ? profileSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Syncing…';
    const notificationsRefreshedLabel = notificationsRefreshedAt
        ? notificationsRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—';
    const unreadNotifications = useMemo(() => sharedNotifications.filter((item) => !item.read).length, [sharedNotifications]);
    const profileStats = useMemo(() => ([
        {
            label: 'Primary email',
            value: loading ? 'Loading…' : (profile.email || '—'),
            detail: 'Used for all system access'
        },
        {
            label: 'Phone on file',
            value: isAdmin ? '—' : (profile.phone || 'Not provided'),
            detail: isAdmin ? 'Admins manage via IT desk' : 'Required for SMS reminders'
        },
        {
            label: 'Notifications',
            value: notificationsLoading ? 'Loading…' : sharedNotifications.length,
            detail: notificationsLoading ? 'Fetching feed' : unreadNotifications === 0 ? 'All caught up' : `${unreadNotifications} unread`
        },
        {
            label: 'Status',
            value: profileStatusLabel,
            detail: isAdmin ? 'Full admin access' : 'Enrollment workflow'
        }
    ]), [loading, profile.email, profile.phone, profileStatusLabel, isAdmin, notificationsLoading, sharedNotifications.length, unreadNotifications]);

    const displayedNotifications = useMemo(() => sharedNotifications.slice(0, 6), [sharedNotifications]);

    return (
        <div className="standard-page-layout profile-page">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
            />
            <section className="profile-hero-card">
                <div className="profile-hero-left">
                    <div
                        className={`profile-avatar-wrapper ${uploading ? 'uploading' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={handleAvatarClick}
                        onKeyDown={handleAvatarKeyDown}
                    >
                        {(() => {
                            const src = resolveImageSrc(profile.profileImageUrl);
                            return src ? <img src={src} alt="Profile" /> : <div className="avatar-placeholder-md"></div>;
                        })()}
                        <span className="profile-avatar-overlay">{uploading ? 'Uploading…' : 'Update photo'}</span>
                    </div>
                    <div className="profile-hero-copy">
                        <p className="profile-hero-kicker">{isAdmin ? 'Admin account' : 'Student profile'}</p>
                        <h1>{loading ? 'Loading…' : profile.name || 'Account profile'}</h1>
                        <p className="profile-hero-subtitle">
                            {isAdmin
                                ? 'Keep executive contact details current so teams can reach you quickly.'
                                : 'Your admissions details stay in sync across enrollment, curriculum, and advising tools.'}
                        </p>
                        <div className="profile-hero-meta">
                            <span className="profile-role-chip">{isAdmin ? 'Administrator' : 'Student'}</span>
                            {!isAdmin && (
                                <span className={`profile-status-chip ${statusClassName}`}>{profileStatusLabel}</span>
                            )}
                            <span className="profile-sync-meta">Synced · {lastProfileSyncLabel}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="profile-metrics-grid">
                {profileStats.map((card) => (
                    <article key={card.label} className="profile-metric-card">
                        <p className="metric-label">{card.label}</p>
                        <p className="metric-value">{card.value}</p>
                        <p className="metric-detail">{card.detail}</p>
                    </article>
                ))}
            </section>

            <section className="profile-main-grid">
                <div className="profile-main-column">
                    <article className="profile-card" id="profile-details-card">
                        <div className="profile-card-header">
                            <div>
                                <p className="profile-card-kicker">Personal info</p>
                                <h3>Account details</h3>
                                <p>Everything admissions and faculty see when reviewing your record.</p>
                            </div>
                        </div>
                        <div className="profile-form-grid" id="profile-details-form">
                            <label className="profile-form-field">
                                <span>Full name</span>
                                <input
                                    type="text"
                                    value={profile.name}
                                    disabled={!isEditing || isApprovedStudent}
                                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                                />
                            </label>
                            <label className="profile-form-field">
                                <span>Email account</span>
                                <input type="text" value={profile.email} readOnly disabled />
                            </label>
                            {!isAdmin && (
                                <label className="profile-form-field">
                                    <span>Mobile number</span>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        disabled={!isEditing}
                                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                                    />
                                </label>
                            )}
                            {!isAdmin && (
                                <div className="profile-form-field">
                                    <span>Enrollment status</span>
                                    <div>
                                        <span className={`status-pill ${(profile.status || 'pending').toLowerCase()}`}>
                                            {profile.status ? profile.status : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {error && <div className="profile-inline-error">{error}</div>}
                        <div className="profile-actions-row">
                            {!isEditing && (
                                <button type="button" className="admin-primary-btn" onClick={handleEdit} disabled={loading}>
                                    Edit info
                                </button>
                            )}
                            {isEditing && (
                                <>
                                    <button type="button" className="admin-ghost-btn" onClick={handleCancelEdit}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-primary-btn"
                                        onClick={handleSave}
                                        disabled={loading || saving || !profileChanged}
                                    >
                                        {saving ? 'Saving…' : 'Save changes'}
                                    </button>
                                </>
                            )}
                        </div>
                    </article>

                    <article className="profile-card" id="change-password-card">
                        <div className="profile-card-header">
                            <div>
                                <p className="profile-card-kicker">Security</p>
                                <h3>Change password</h3>
                                <p>Use a strong, unique password to keep your account protected.</p>
                            </div>
                        </div>
                        <form className="change-password-form" onSubmit={handlePasswordSubmit}>
                            <label>
                                Old password
                                <input
                                    type="password"
                                    name="oldPassword"
                                    value={passwordForm.oldPassword}
                                    onChange={handlePasswordFieldChange}
                                    autoComplete="current-password"
                                />
                            </label>
                            <label>
                                New password
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordFieldChange}
                                    autoComplete="new-password"
                                />
                            </label>
                            <label>
                                Confirm new password
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordFieldChange}
                                    autoComplete="new-password"
                                />
                            </label>
                            {passwordFeedback.error && <p className="form-feedback error">{passwordFeedback.error}</p>}
                            {passwordFeedback.success && <p className="form-feedback success">{passwordFeedback.success}</p>}
                            <button type="submit" className="admin-primary-btn" disabled={changingPassword}>
                                {changingPassword ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </article>
                </div>

                <div className="profile-side-column">
                    {!isAdmin && (
                        <article className="profile-card" id="application-history-card">
                            <div className="profile-card-header">
                                <div>
                                    <p className="profile-card-kicker">Application trail</p>
                                    <h3>Status timeline</h3>
                                    <p>See every approval, denial, and reviewer note.</p>
                                </div>
                                <button
                                    type="button"
                                    className="admin-ghost-btn"
                                    onClick={loadHistory}
                                    disabled={historyLoading}
                                >
                                    {historyLoading ? 'Refreshing…' : 'Refresh'}
                                </button>
                            </div>
                            {historyLoading && <p className="form-feedback">Loading application history…</p>}
                            {!historyLoading && historyError && <p className="form-feedback error">{historyError}</p>}
                            {!historyLoading && !historyError && (
                                <div className="history-card">
                                    <div className="history-progress">
                                        <div className="progress-row">
                                            <span>Approved</span>
                                            <div className="progress-track">
                                                <span className="progress-bar approved" style={{ width: approvedBarWidth }}></span>
                                            </div>
                                        </div>
                                        <div className="progress-row">
                                            <span>Denied</span>
                                            <div className="progress-track">
                                                <span className="progress-bar denied" style={{ width: deniedBarWidth }}></span>
                                            </div>
                                        </div>
                                    </div>
                                    {heroEntry ? (
                                        <div className={`history-hero ${heroStatusClass}`}>
                                            <div className="history-hero-header">
                                                <span className="history-hero-status">{heroStatusLabel}</span>
                                                <span className="history-hero-type">Latest update</span>
                                            </div>
                                            <div className="history-hero-body">
                                                <p>{heroMessage}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="history-empty">No application history yet.</p>
                                    )}
                                    {historyEntries.length > 0 && (
                                        <div className="history-list">
                                            {historyEntries.map((entry, index) => (
                                                <div key={entry.id || index} className="history-entry">
                                                    <div className="history-entry-header">
                                                        <span className={`status-pill ${(entry.status || '').toLowerCase()}`}>
                                                            {entry.status || 'Pending'}
                                                        </span>
                                                        <span>{formatHistoryDate(entry.changedAt)}</span>
                                                    </div>
                                                    {entry.remarks && (
                                                        <ul>
                                                            {buildReasonList(entry.remarks).map((reason, index) => (
                                                                <li key={`${entry.id}-${index}`}>{reason}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </article>
                    )}

                    <article className="profile-card" id="notifications-card">
                        <div className="profile-card-header">
                            <div>
                                <p className="profile-card-kicker">Activity feed</p>
                                <h3>Notifications</h3>
                                <p>Everything coming from enrollment, curriculum, and events.</p>
                            </div>
                            <div className="notifications-controls">
                                <span className="notifications-last-sync">Updated {notificationsRefreshedLabel}</span>
                                <button
                                    type="button"
                                    className="admin-ghost-btn"
                                    onClick={handleNotificationRefresh}
                                    disabled={notificationsLoading}
                                >
                                    {notificationsLoading ? 'Refreshing…' : 'Refresh'}
                                </button>
                            </div>
                        </div>
                        <div className="notifications-list">
                            {notificationsLoading && <p className="notifications-empty">Loading notifications…</p>}
                            {!notificationsLoading && displayedNotifications.length === 0 && (
                                <p className="notifications-empty">No notifications yet. We'll surface updates here.</p>
                            )}
                            {!notificationsLoading && displayedNotifications.length > 0 && (
                                displayedNotifications.map((entry, index) => (
                                    <article key={entry.id || entry.createdAt || index} className={`notifications-item ${entry.read ? 'read' : 'unread'}`}>
                                        <header className="notifications-item-header">
                                            <span className="notifications-item-type">{formatNotificationType(entry.type)}</span>
                                            <span className="notifications-item-time">{formatNotificationTimestamp(entry.createdAt)}</span>
                                        </header>
                                        <h4 className="notifications-item-title">{entry.title || formatNotificationType(entry.type)}</h4>
                                        <p className="notifications-item-message">{entry.message || 'No additional details provided.'}</p>
                                        <div className="notifications-item-actions">
                                            {!entry.read ? (
                                                <button type="button" onClick={() => markNotificationRead(entry.id)}>
                                                    Mark as read
                                                </button>
                                            ) : (
                                                <span className="notifications-item-status">Read</span>
                                            )}
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </article>
                </div>
            </section>
        </div>
    );
};

export default ProfilePage;