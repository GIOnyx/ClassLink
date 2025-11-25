import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './ProfilePage.css';
import { me, getMyStudent, getMyAdmin, submitStudentApplication, uploadMyProfileImage, uploadMyAdminProfileImage, updateMyAdmin, changeMyPassword, logout as apiLogout } from '../services/backend';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', status: '', profileImageUrl: '' });
    const [originalProfile, setOriginalProfile] = useState({ name: '', email: '', phone: '', status: '', profileImageUrl: '' });
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activePanel, setActivePanel] = useState('profile');
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordFeedback, setPasswordFeedback] = useState({ error: '', success: '' });
    const [changingPassword, setChangingPassword] = useState(false);

    // Helper to resolve image URL (handles relative vs absolute)
    const resolveImageSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
        return base + url;
    };

    // Icons (kept inline as components for simplicity, or move to separate file)
    const ProfileIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
    const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
    const NotificationIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
    const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
    const ChevronRightIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

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
                    // Fetch admin profile
                    const adminRes = await getMyAdmin();
                    const a = adminRes?.data || {};
                    const loaded = {
                        name: a.name || '',
                        email: a.email || '',
                        phone: '',
                        status: 'ADMIN',
                        profileImageUrl: ''
                    };
                    setProfile(loaded);
                    setOriginalProfile(loaded);
                } else {
                    // Student path
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
            } catch (e) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

        useEffect(() => {
            if (activePanel !== 'change-password') {
                setPasswordFeedback({ error: '', success: '' });
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setChangingPassword(false);
            }
        }, [activePanel]);

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

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
    };

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            if (role === 'ADMIN') {
                const res = await updateMyAdmin({ name: profile.name });
                const data = res?.data || {};
                setProfile(p => ({ ...p, name: data.name || p.name }));
                setOriginalProfile(p => ({ ...p, name: data.name || p.name }));
            } else {
                await submitStudentApplication({ name: profile.name, phone: profile.phone });
                setOriginalProfile(profile); // persist new baseline
            }
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

    const profileActions = [
        {
            label: 'My Profile',
            primary: true,
            action: () => {
                setActivePanel('profile');
                document.querySelector('.profile-main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    ];

    const settingsSubmenu = [
        {
            label: 'Update Personal Info',
            action: () => {
                setActivePanel('profile');
                if (!isEditing) {
                    setIsEditing(true);
                }
                setTimeout(() => {
                    document.getElementById('profile-details-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 0);
            }
        },
        {
            label: 'Change Password',
            action: () => {
                setActivePanel('change-password');
                setTimeout(() => {
                    document.getElementById('change-password-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 0);
            }
        },
        {
            label: 'Manage Guardians',
            action: () => navigate('/', { state: { focus: 'guardian' } })
        },
        {
            label: 'View Application History',
            action: () => navigate('/student', { state: { tab: 'history' } })
        }
    ];

    const handleProfileAction = (fn) => {
        try {
            fn();
        } catch (err) {
            console.warn('Action not available yet', err);
            setError('That shortcut is not available yet.');
        }
    };

    return (
        <div className="standard-page-layout">
            <div className="profile-page-wrapper">
                <aside className="profile-sidebar">
                    <div className="sidebar-profile-summary">
                        {(() => {
                            const src = resolveImageSrc(profile.profileImageUrl);
                            return src ? (
                                <img src={src} alt="Profile" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', background: '#e0e0e0' }} />
                            ) : (
                                <div className="avatar-placeholder-sm"></div>
                            );
                        })()}
                        <div className="user-info">
                            <span className="user-name">{loading ? 'Loading…' : profile.name || '—'}</span>
                            <span className="user-email">{loading ? '' : profile.email || '—'}</span>
                        </div>
                    </div>
                    <nav className="sidebar-nav">
                        <ul>
                            {profileActions.map(({ label, action, primary }) => (
                                <li key={label}>
                                    <button
                                        type="button"
                                        className={`sidebar-link ${primary ? 'active' : ''}`}
                                        onClick={() => handleProfileAction(action)}
                                    >
                                        {primary && <ProfileIcon />}
                                        <span>{label}</span>
                                        <ChevronRightIcon />
                                    </button>
                                </li>
                            ))}
                            <li className="settings-group">
                                <button type="button" className="sidebar-link" onClick={() => setSettingsOpen(o => !o)}>
                                    <SettingsIcon />
                                    <span>Settings</span>
                                    <ChevronRightIcon className={settingsOpen ? 'open' : ''} />
                                </button>
                                {settingsOpen && (
                                    <ul className="settings-submenu">
                                        {settingsSubmenu.map(item => (
                                            <li key={item.label}>
                                                <button type="button" onClick={() => handleProfileAction(item.action)}>
                                                    {item.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                            <li><a href="#"><NotificationIcon /> Notification <span>Allow</span></a></li>
                            <li><a href="#" onClick={async (e) => { e.preventDefault(); try { await apiLogout(); } catch {} window.location.href = '/'; }}><LogoutIcon /> Log Out</a></li>
                        </ul>
                    </nav>
                </aside>
                
                <main className="profile-main-content">
                    <div className="profile-header">
                        {(() => {
                            const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
                            const src = profile.profileImageUrl
                                ? (profile.profileImageUrl.startsWith('http') ? profile.profileImageUrl : base + profile.profileImageUrl)
                                : null;
                            return src ? (
                                <img src={src} alt="Profile" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', background: '#e0e0e0' }} />
                            ) : (
                                <div className="avatar-placeholder-md"></div>
                            );
                        })()}
                        <div className="user-info">
                            <span className="user-name">{loading ? 'Loading…' : profile.name || '—'}</span>
                            <span className="user-email">{loading ? '' : profile.email || '—'}</span>
                        </div>
                    </div>
                    <div className="profile-details-form" id="profile-details-form">
                        <div className="form-row">
                            <label>Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                disabled={!isEditing}
                                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                            />
                        </div>
                        <div className="form-row">
                            <label>Email account</label>
                            <input
                                type="text"
                                value={profile.email}
                                readOnly
                                disabled
                            />
                        </div>
                        {role !== 'ADMIN' && (
                            <>
                                <div className="form-row">
                                    <label>Mobile number</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        disabled={!isEditing}
                                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Enrollment status</label>
                                    <div>
                                        <span className={`status-pill ${(profile.status||'').toLowerCase()}`}>
                                            {profile.status ? profile.status : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {error && <div style={{ color: '#b00020', margin: '8px 0' }}>{error}</div>}
                    <div className="actions-row">
                        {!isEditing && (
                            <button className="save-changes-button" onClick={handleEdit} disabled={loading}>Edit Profile</button>
                        )}
                        {isEditing && (
                            <button className="save-changes-button editing" onClick={handleSave} disabled={loading || saving}>
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                    {isEditing && (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
                            {uploading && <span style={{ fontSize: '.85rem', color: '#555' }}>Uploading…</span>}
                        </div>
                    )}
                    {activePanel === 'change-password' && (
                        <section className="card-section" id="change-password-card">
                            <h3>Change Password</h3>
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
                                {passwordFeedback.error && (
                                    <p className="form-feedback error">{passwordFeedback.error}</p>
                                )}
                                {passwordFeedback.success && (
                                    <p className="form-feedback success">{passwordFeedback.success}</p>
                                )}
                                <button type="submit" className="password-submit-button" disabled={changingPassword}>
                                    {changingPassword ? 'Updating…' : 'Update Password'}
                                </button>
                            </form>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;