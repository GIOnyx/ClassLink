import React from 'react';
import '../App.css'; 

const AccountPage = () => {
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
                <span className="user-name">Your name</span>
                <span className="user-email">yourname@gmail.com</span>
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
                <span className="user-name">Your name</span>
                <span className="user-email">yourname@gmail.com</span>
            </div>
            </div>
            <div className="account-details-form">
            <div className="form-row">
                <label>Name</label>
                <span>your name</span>
            </div>
            <div className="form-row">
                <label>Email account</label>
                <span>yourname@gmail.com</span>
            </div>
            <div className="form-row">
                <label>Mobile number</label>
                <span className="placeholder-text">Add number</span>
            </div>
            <div className="form-row">
                <label>Location</label>
                <span className="placeholder-text">Add location</span>
            </div>
            </div>
            <button className="save-changes-button">Save Changes</button>
        </main>
        </div>
    );
};

export default AccountPage;