import React from 'react';
import '../App.css';

// --- MOCK DATA ---
const mockCourses = [
    { id: 1, name: 'Course 1' },
    { id: 2, name: 'Course 2' },
    { id: 3, name: 'Course 3' },
    { id: 4, name: 'Course 4' },
    { id: 5, name: 'Course 5' },
    ];

    const FacultyPage = () => {
    return (
        // 👇 This class name now matches the pattern from EnrollmentPage
        <div className="faculty-page-container">
        <div className="faculty-content-grid">
            {/* Column 1 */}
            <div className="faculty-column">
            <div className="course-header">Course:</div>
            {mockCourses.map(course => (
                <div key={course.id} className="faculty-card">
                <div className="faculty-checkbox"></div>
                <div className="faculty-line"></div>
                </div>
            ))}
            </div>

            {/* Column 2 */}
            <div className="faculty-column">
            <div className="course-header">Course:</div>
            {mockCourses.map(course => (
                <div key={course.id} className="faculty-card">
                <div className="faculty-checkbox"></div>
                <div className="faculty-line"></div>
                </div>
            ))}
            </div>

            {/* Column 3 */}
            <div className="faculty-column">
            <div className="course-header">Course:</div>
            {mockCourses.map(course => (
                <div key={course.id} className="faculty-card">
                <div className="faculty-checkbox"></div>
                <div className="faculty-line"></div>
                </div>
            ))}
            <button className="manage-faculty-button">Manage Faculty</button>
            </div>
        </div>
        </div>
    );
};

export default FacultyPage;