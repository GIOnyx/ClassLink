import React from 'react';

// --- MOCK DATA ---
// In a real app, this data would come from an API
const enrollmentRequests = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Peter Jones' },
    ];

    // --- COMPONENT ---
    const EnrollmentPage = () => {
    return (
        <div className="enrollment-page-container">
        <div className="enrollment-main-content">

            {/* Left Column: Enrollment Requests */}
            <div className="enrollment-left-column">
            {enrollmentRequests.map((request) => (
                <div key={request.id} className="request-card">
                <div className="avatar-placeholder"></div>
                <div className="info-container">
                    <div className="line"></div>
                    <div className="line line-short"></div>
                    <div className="actions">
                    <button className="enrollment-button approve-button">Approve</button>
                    <button className="enrollment-button decline-button">Decline</button>
                    </div>
                </div>
                <svg className="view-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
            ))}
            <button className="manage-admin-button">Manage Admin</button>
            </div>

            {/* Right Column: Profile Preview */}
            <div className="enrollment-right-column">
            <div className="profile-card">
                <div className="profile-avatar"></div>
                <div className="profile-line"></div>
                <div className="profile-line profile-line-short"></div>
                <div className="profile-line"></div>
            </div>
            </div>
            
        </div>
        </div>
    );
};

export default EnrollmentPage;

