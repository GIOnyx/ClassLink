import React, { useState } from 'react';
import '../App.css';

// --- MOCK DATA ---
const programs = [
    'College of Computer Studies',
    'College of Arts, Sciences & Education',
    'College of Management, Business & Accountancy',
    'College of Nursing & Allied Sciences',
    'College of Criminal Justice',
    'College of Engineering & Architecture',
];

const semesters = ['First Semester', 'Second Semester', 'Summer Semester'];

// --- COMPONENT ---
const EnrollmentPage = () => {
    // State to track the active filters
    const [activeProgram, setActiveProgram] = useState('College of Computer Studies');
    const [activeSemester, setActiveSemester] = useState('First Semester');

    return (
        <div className="page-content">
            <div className="enrollment-grid">
                {/* Left Column: Filters */}
                <div className="enrollment-filters">
                    {/* Programs Filter */}
                    <div className="filter-card">
                        <ul>
                            {programs.map((program) => (
                                <li
                                    key={program}
                                    className={activeProgram === program ? 'active' : ''}
                                    onClick={() => setActiveProgram(program)}
                                >
                                    {program}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Semester Filter */}
                    <div className="filter-card">
                        <ul>
                            {semesters.map((semester) => (
                                <li
                                    key={semester}
                                    className={activeSemester === semester ? 'active' : ''}
                                    onClick={() => setActiveSemester(semester)}
                                >
                                    {semester}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column: Student List */}
                <div className="enrollment-student-list">
                    {/* Placeholder for student cards - you can map over real data here */}
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                    <div className="student-enrollment-card"></div>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentPage;