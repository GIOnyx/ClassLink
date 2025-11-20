import React, { useState, useEffect } from 'react';
import '../App.css';
import './CoursePage.css';
import { getCourses, addCourse, getTeachers } from '/src/services/backend.js'; // ✅ Import getTeachers

const programs = [
    'College of Computer Studies',
    'College of Arts, Sciences & Education',
    'College of Management, Business & Accountancy',
    'College of Nursing & Allied Sciences',
    'College of Criminal Justice',
    'College of Engineering & Architecture',
];

const CoursePage = () => {
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]); // ✅ Add state for teachers
    const [newCourse, setNewCourse] = useState({
        title: '',
        courseCode: '',
        program: programs[0],
        teacherId: '' // ✅ Add teacherId to form state
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, teachersRes] = await Promise.all([
                getCourses(),
                getTeachers() // ✅ Fetch teachers on load
            ]);
            setCourses(coursesRes.data);
            setTeachers(teachersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // Handle error (e.g., if user is not admin and can't get teachers)
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCourse({ ...newCourse, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // ✅ Prepare payload, formatting teacherId as an object
            const payload = {
                title: newCourse.title,
                courseCode: newCourse.courseCode,
                program: newCourse.program,
                assignedTeacher: newCourse.teacherId ? { teacherId: parseInt(newCourse.teacherId) } : null
            };
            
            await addCourse(payload);
            setNewCourse({ title: '', courseCode: '', program: programs[0], teacherId: '' });
            loadData(); // Reload courses
        } catch (err) {
            console.error('Failed to add course:', err);
        }
    };

    return (
        <div className="course-page-container">
            <div style={{ marginBottom: '30px', padding: '20px', background: '#fff', borderRadius: '12px' }}>
                <h3>Add a New Course</h3>
                {/* ✅ Update form to be 2x2 grid */}
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    <input
                        type="text"
                        name="title"
                        placeholder="Course Title"
                        value={newCourse.title}
                        onChange={handleInputChange}
                    />
                    <input
                        type="text"
                        name="courseCode"
                        placeholder="Course Code (e.g., CS101)"
                        value={newCourse.courseCode}
                        onChange={handleInputChange}
                    />
                    <select name="program" value={newCourse.program} onChange={handleInputChange}>
                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    
                    {/* ✅ Add Teacher Dropdown */}
                    <select name="teacherId" value={newCourse.teacherId} onChange={handleInputChange}>
                        <option value="">-- Assign Teacher (Optional) --</option>
                        {teachers.map(t => (
                            <option key={t.teacherId} value={t.teacherId}>{t.name}</option>
                        ))}
                    </select>
                    
                    {/* ✅ Make button span full width */}
                    <button type="submit" style={{ gridColumn: '1 / -1' }}>Add Course</button>
                </form>
            </div>

            <div className="course-content-grid">
                <div className="course-column">
                    <div className="course-header">Available Courses</div>
                    {courses.map((course) => (
                        <div key={course.courseID} className="course-card">
                            <div className="course-line" style={{ background: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ display: 'block' }}>{course.title}</strong>
                                    <span style={{ fontSize: 13 }}>{course.courseCode}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {/* ✅ Display assigned teacher */}
                                    <span style={{ fontSize: 12, color: '#000', fontWeight: '500' }}>
                                        {course.assignedTeacher ? course.assignedTeacher.name : 'N/A'}
                                    </span>
                                    <span style={{ fontSize: 12, color: '#666', display: 'block' }}>
                                        {course.program || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoursePage;