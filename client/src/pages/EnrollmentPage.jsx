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

    // Local mock "database" of enrollments to test filters/UI
    const [students, setStudents] = useState([
        { id: 1, name: 'Alice Santos', program: 'College of Computer Studies', semester: 'First Semester' },
        { id: 2, name: 'Ben Reyes', program: 'College of Management, Business & Accountancy', semester: 'Second Semester' },
        { id: 3, name: 'Carla Dela Cruz', program: 'College of Computer Studies', semester: 'First Semester' },
    ]);

    // Form state for adding a new mock enrollment
    const [newName, setNewName] = useState('');
    const [newProgram, setNewProgram] = useState(programs[0]);
    const [newSemester, setNewSemester] = useState(semesters[0]);

    const addEnrollment = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return alert('Please enter a student name.');

        const newEntry = {
            id: Date.now(),
            name: newName.trim(),
            program: newProgram,
            semester: newSemester,
        };

        // Add locally for UI testing
        setStudents((prev) => [newEntry, ...prev]);

        // Optional: try to POST to backend if available; ignore errors for mock testing
        try {
            await fetch('/api/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry),
            });
        } catch (err) {
            // network/back-end may not be present; that's fine for local testing
        }

        // reset form
        setNewName('');
        setNewProgram(programs[0]);
        setNewSemester(semesters[0]);
    };

    // Filter students by active filters
    const filteredStudents = students.filter(
        (s) => s.program === activeProgram && s.semester === activeSemester
    );

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

                {/* Right Column: Student List + Mock Input */}
                <div className="enrollment-student-list">
                    {/* Mock input form to create a test enrollment */}
                    <div className="filter-card" style={{ marginBottom: 16 }}>
                        <h3>Mock Enrollment (test DB & filters)</h3>
                        <form onSubmit={addEnrollment} style={{ display: 'grid', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Student full name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <select value={newProgram} onChange={(e) => setNewProgram(e.target.value)}>
                                {programs.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select value={newSemester} onChange={(e) => setNewSemester(e.target.value)}>
                                {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit">Add Enrollment</button>
                                <button type="button" onClick={() => {
                                    // quick test helper: set filters to newly selected values
                                    setActiveProgram(newProgram);
                                    setActiveSemester(newSemester);
                                }}>
                                    Set Filters To Form
                                </button>
                            </div>
                        </form>
                        <small>Note: entry is stored locally for UI testing. If backend /api/enrollments exists, a POST is attempted.</small>
                    </div>

                    {/* Render filtered students */}
                    {filteredStudents.length === 0 ? (
                        <div className="student-enrollment-card">No enrollments match the selected filters.</div>
                    ) : (
                        filteredStudents.map((s) => (
                            <div key={s.id} className="student-enrollment-card">
                                <strong>{s.name}</strong>
                                <div>{s.program}</div>
                                <div>{s.semester}</div>
                            </div>
                        ))
                    )}

                    {/* Debug listing of all mock enrollments */}
                    <div style={{ marginTop: 20 }}>
                        <h4>All Mock Enrollments (debug)</h4>
                        {students.map((s) => (
                            <div key={`all-${s.id}`} style={{ fontSize: 12, color: '#666' }}>
                                {s.name} — {s.program} — {s.semester}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentPage;