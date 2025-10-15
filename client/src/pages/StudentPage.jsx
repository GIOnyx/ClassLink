import React from 'react';
import '../App.css';

// --- MOCK DATA ---
// This would be replaced with actual student or course data from an API
const mockCourses = [
    { id: 1, name: 'Course A' },
    { id: 2, name: 'Course B' },
    { id: 3, name: 'Course C' },
    { id: 4, name: 'Course D' },
    { id: 5, name: 'Course E' },
    ];

    const StudentPage = () => {
    return (
        <div className="student-page-container">
        <div className="student-content-grid">
            {/* Column 1 */}
            <div className="student-column">
            <div className="course-header">Course:</div>
            {mockCourses.map(course => (
                <div key={course.id} className="student-card">
                <div className="student-checkbox"></div>
                <div className="student-line"></div>
                </div>
            ))}
            </div>

            {/* Column 2 */}
            <div className="student-column">
            <div className="course-header">Course:</div>
            {mockCourses.map(course => (
                <div key={course.id} className="student-card">
                <div className="student-checkbox"></div>
                <div className="student-line"></div>
                </div>
            ))}
            </div>

            {/* Column 3 */}
            <div className="student-column">
            <div className="course-header">Course:</div>
            {mockCourses.map(course => (
                <div key={course.id} className="student-card">
                <div className="student-checkbox"></div>
                <div className="student-line"></div>
                </div>
            ))}
            <button className="manage-student-button">Manage Student</button>
            </div>
        </div>
        </div>
    );
};

export default StudentPage;