import React, { useState, useEffect } from 'react';
import { getCourses, getCoursesByProgram, postEnrollment, getEnrollments } from '../services/backend';
import '../App.css';

const programs = [
    'College of Computer Studies',
    'College of Arts, Sciences & Education',
    'College of Management, Business & Accountancy',
    'College of Nursing & Allied Sciences',
    'College of Criminal Justice',
    'College of Engineering & Architecture',
];

const semesters = ['First Semester', 'Second Semester', 'Summer Semester'];

const EnrollmentPage = () => {
    const [activeProgram, setActiveProgram] = useState('College of Computer Studies');
    const [activeSemester, setActiveSemester] = useState('First Semester');
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [newName, setNewName] = useState('');
    const [newProgram, setNewProgram] = useState(programs[0]);
    const [newSemester, setNewSemester] = useState(semesters[0]);
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    // Reload courses when activeProgram changes
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const res = await getCoursesByProgram(activeProgram);
                setCourses(res.data || []);
                setSelectedCourseId(null);
            } catch (e) {
                console.warn('Failed to load courses by program, falling back to all', e);
                try {
                    const all = await getCourses();
                    setCourses(all.data || []);
                } catch (err) {
                    console.error('Failed to load all courses', err);
                }
            }
        };
        loadCourses();
    }, [activeProgram]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [coursesRes, enrollmentsRes] = await Promise.all([
                getCourses(),
                getEnrollments()
            ]);
            setCourses(coursesRes.data || []);
            setEnrollments(enrollmentsRes.data || []);
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    const addEnrollment = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return alert('Please enter a student name.');
        if (!selectedCourseId) return alert('Please select a course.');

        setLoading(true);
        try {
            const payload = { studentName: newName.trim(), courseId: selectedCourseId };
            await postEnrollment(payload);
            
            // Reload enrollments from server
            await loadData();
            
            // Reset form
            setNewName('');
            setSelectedCourseId(null);
        } catch (err) {
            console.error('Enrollment failed', err);
            alert('Failed to enroll student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter enrollments by active filters (mock filtering since we don't have program/semester in DB)
    const filteredEnrollments = enrollments.filter((enrollment) => {
        // Since the Student model doesn't have program/semester in your DB,
        // we'll show all for now. You can add these fields to Student later.
        return true;
    });

    return (
        <div className="page-content">
            <div className="enrollment-grid">
                {/* Left Column: Filters */}
                <div className="enrollment-filters">
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

                    <div className="filter-card">
                        <ul>
                            {semesters.map((semester) => (
                                <li
                                    key={activeSemester === semester ? 'active' : ''}
                                    className={activeSemester === semester ? 'active' : ''}
                                    onClick={() => setActiveSemester(semester)}
                                >
                                    {semester}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column: Enrollment Form & List */}
                <div className="enrollment-student-list">
                    {/* Enrollment Form */}
                    <div className="filter-card" style={{ marginBottom: 20 }}>
                        <h3 style={{ marginTop: 0 }}>Mock Enrollment (test DB & filters)</h3>
                        <form onSubmit={addEnrollment} style={{ display: 'grid', gap: 12 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Student Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., John Doe"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Program</label>
                                <select 
                                    value={newProgram} 
                                    onChange={(e) => setNewProgram(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    {programs.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Semester</label>
                                <select 
                                    value={newSemester} 
                                    onChange={(e) => setNewSemester(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Course for {activeProgram} <span style={{ color: 'red' }}>*</span></label>
                                <select 
                                    value={selectedCourseId ?? ''} 
                                    onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">-- Select Course (required) --</option>
                                    {courses.map(c => (
                                        <option key={c.courseID} value={c.courseID}>
                                            {c.courseCode} - {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        flex: 1, 
                                        padding: '10px', 
                                        backgroundColor: loading ? '#ccc' : '#8B0000',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Add Enrollment'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setActiveProgram(newProgram);
                                        setActiveSemester(newSemester);
                                    }}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: '#333',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Set Filters To Form
                                </button>
                            </div>
                        </form>
                        <small style={{ display: 'block', marginTop: 12, color: '#666' }}>
                            Note: entry is stored locally for UI testing. If backend /api/enrollments exists, a POST is attempted.
                        </small>
                    </div>

                    {/* Enrollments List */}
                    <div>
                        <h3 style={{ marginBottom: 16 }}>
                            Enrolled Students ({filteredEnrollments.length})
                        </h3>
                        
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                Loading enrollments...
                            </div>
                        ) : filteredEnrollments.length === 0 ? (
                            <div className="student-enrollment-card" style={{ textAlign: 'center', padding: '40px' }}>
                                No enrollments found. Add your first enrollment above!
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {filteredEnrollments.map((enrollment) => (
                                    <div 
                                        key={enrollment.enrollmentID} 
                                        className="student-enrollment-card"
                                        style={{
                                            padding: '16px',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            border: '1px solid #e0e0e0'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div style={{ flex: 1 }}>
                                                <strong style={{ fontSize: '16px', color: '#333' }}>
                                                    {enrollment.student?.firstName} {enrollment.student?.lastName}
                                                </strong>
                                                <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>
                                                    {activeProgram}
                                                </div>
                                                <div style={{ color: '#888', fontSize: '13px', marginTop: '2px' }}>
                                                    {activeSemester}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {enrollment.course && (
                                                    <div style={{ 
                                                        backgroundColor: '#f0f0f0', 
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {enrollment.course.courseCode}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                                    {enrollment.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentPage;