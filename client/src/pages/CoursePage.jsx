import React from 'react';
import '../App.css'; 

// --- MOCK DATA ---
// This would be replaced with actual course data from an API
const mockItems = [
    { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
    ];

    const CoursePage = () => {
    return (
        <div className="course-page-container">
        <div className="course-content-grid">
            {/* Column 1 */}
            <div className="course-column">
            <div className="course-header">Course:</div>
            {mockItems.map(item => (
                <div key={item.id} className="course-card">
                <div className="course-checkbox"></div>
                <div className="course-line"></div>
                </div>
            ))}
            </div>

            {/* Column 2 */}
            <div className="course-column">
            <div className="course-header">Course:</div>
            {mockItems.map(item => (
                <div key={item.id} className="course-card">
                <div className="course-checkbox"></div>
                <div className="course-line"></div>
                </div>
            ))}
            </div>

            {/* Column 3 */}
            <div className="course-column">
            <div className="course-header">Course:</div>
            {mockItems.map(item => (
                <div key={item.id} className="course-card">
                <div className="course-checkbox"></div>
                <div className="course-line"></div>
                </div>
            ))}
            <button className="manage-course-button">Manage Course</button>
            </div>
        </div>
        </div>
    );
};

export default CoursePage;