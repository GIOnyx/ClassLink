import React, { useState, useEffect } from 'react';
import '../App.css';
import { getCourses, addCourse } from '../services/backend';
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
    const [newCourse, setNewCourse] = useState({ title: '', courseCode: '', program: programs[0] });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await getCourses();
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCourse({ ...newCourse, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addCourse(newCourse);
            setNewCourse({ title: '', courseCode: '', program: programs[0] });
            loadCourses();
        } catch (err) {
            console.error('Failed to add course:', err);
        }
    };

    return (
        <div className="course-page-container">
            <div style={{ marginBottom: '30px', padding: '20px', background: '#fff', borderRadius: '12px' }}>
                <h3>Add a New Course</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
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
                    <button type="submit">Add Course</button>
                </form>
            </div>

            <div className="course-content-grid">
                <div className="course-column">
                    <div className="course-header">Available Courses</div>
                    {courses.map((course) => (
                        <div key={course.courseID} className="course-card">
                            <div className="course-line" style={{ background: 'none', display: 'flex', justifyContent: 'space-between' }}>
                                <span><strong>{course.title}</strong> ({course.courseCode})</span>
                                <span style={{ fontSize: 12, color: '#666' }}>{course.program || '—'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoursePage;