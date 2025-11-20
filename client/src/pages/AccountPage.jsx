import React, { useEffect, useState } from 'react';
import '../App.css'; 
import './AccountPage.css';
import { me, getMyStudent, submitStudentApplication } from '../services/backend';

const AccountPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', status: '' });

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                // Try to fetch student-specific data first
                const studentRes = await getMyStudent();
                if (studentRes?.data) {
                    const s = studentRes.data;
                    setProfile({
                        name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || '',
                        email: s.email || s.username || '',
                        phone: s.phone || s.mobile || '',
                        status: s.status || s.enrollmentStatus || ''
                    });
                } else {
                    // Fallback to generic 'me' endpoint
                    const meRes = await me();
                    const m = meRes?.data || {};
                    setProfile({ name: m.name || m.username || '', email: m.email || '', phone: '', status: m.status || '' });
                }
            } catch (e) {
                // If student endpoint fails, try 'me' and continue
                try {
                    const meRes = await me();
                    const m = meRes?.data || {};
                    setProfile({ name: m.name || m.username || '', email: m.email || '', phone: '', status: m.status || '' });
                } catch (err) {
                    setError('Failed to load profile');
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        setError('');
        try {
            // send updatable fields to student endpoint
            await submitStudentApplication({ name: profile.name, phone: profile.phone, location: profile.location });
            // Optionally refetch or show a success message — we'll update the UI in-place
        } catch (e) {
            setError('Failed to save changes');
        }
    };
  // Simple SVG Icon Components for clarity
    const ProfileIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
    const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
    const NotificationIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
    const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
    const ChevronRightIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

    return (
        <div className="account-page-container">
        <aside className="account-sidebar">
            <div className="sidebar-profile-summary">
            <div className="avatar-placeholder-sm"></div>
            <div className="user-info">
                <span className="user-name">{loading ? 'Loading…' : profile.name || '—'}</span>
                <span className="user-email">{loading ? '' : profile.email || '—'}</span>
            </div>
            </div>
            <nav className="sidebar-nav">
            <ul>
                <li><a href="#" className="active"><ProfileIcon /> My Profile <ChevronRightIcon /></a></li>
                <li><a href="#"><SettingsIcon /> Settings <ChevronRightIcon /></a></li>
                <li><a href="#"><NotificationIcon /> Notification <span>Allow</span></a></li>
                <li><a href="#"><LogoutIcon /> Log Out</a></li>
            </ul>
            </nav>
        </aside>
        
        <main className="account-main-content">
            <div className="account-header">
            <div className="avatar-placeholder-md"></div>
            <div className="user-info">
                <span className="user-name">{loading ? 'Loading…' : profile.name || '—'}</span>
                <span className="user-email">{loading ? '' : profile.email || '—'}</span>
            </div>
            </div>
            <div className="account-details-form">
            <div className="form-row">
                <label>Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-row">
                <label>Email account</label>
                <input type="text" value={profile.email} readOnly />
            </div>
            <div className="form-row">
                <label>Mobile number</label>
                <input type="text" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-row">
                <label>Enrollment status</label>
                <div>
                    <span className={`status-pill ${(profile.status||'').toLowerCase()}`}>
                        {profile.status ? profile.status : 'Pending'}
                    </span>
                </div>
            </div>
            </div>
            {error && <div style={{ color: '#b00020', margin: '8px 0' }}>{error}</div>}
            <button className="save-changes-button" onClick={handleSave} disabled={loading}>Save Changes</button>
        </main>
        </div>
    );
};

export default AccountPage;