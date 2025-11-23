import React, { useState, useEffect } from 'react';
import '../App.css';
import './CoursePage.css';
import { getCourses, addCourse, getTeachers } from '/src/services/backend.js';

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
    const [teachers, setTeachers] = useState([]);
    const [newCourse, setNewCourse] = useState({
        title: '',
        courseCode: '',
        program: programs[0],
        teacherId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, teachersRes] = await Promise.all([
                getCourses(),
                getTeachers()
            ]);
            setCourses(coursesRes.data);
            setTeachers(teachersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCourse({ ...newCourse, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newCourse.title,
                courseCode: newCourse.courseCode,
                program: newCourse.program,
                assignedTeacher: newCourse.teacherId ? { teacherId: parseInt(newCourse.teacherId) } : null
            };
            
            await addCourse(payload);
            setNewCourse({ title: '', courseCode: '', program: programs[0], teacherId: '' });
            loadData();
        } catch (err) {
            console.error('Failed to add course:', err);
        }
    };

    return (
        <div className="standard-page-layout">
            <div className="add-course-panel">
                <h3 className="add-course-header">Add a New Course</h3>
                <form onSubmit={handleSubmit} className="add-course-form">
                    <input
                        type="text"
                        name="title"
                        placeholder="Course Title"
                        value={newCourse.title}
                        onChange={handleInputChange}
                        className="course-form-input"
                    />
                    <input
                        type="text"
                        name="courseCode"
                        placeholder="Course Code (e.g., CS101)"
                        value={newCourse.courseCode}
                        onChange={handleInputChange}
                        className="course-form-input"
                    />
                    <select name="program" value={newCourse.program} onChange={handleInputChange} className="course-form-select">
                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    
                    <select name="teacherId" value={newCourse.teacherId} onChange={handleInputChange} className="course-form-select">
                        <option value="">-- Assign Teacher (Optional) --</option>
                        {teachers.map(t => (
                            <option key={t.teacherId} value={t.teacherId}>{t.name}</option>
                        ))}
                    </select>
                    
                    <button type="submit" className="btn-add-course">Add Course</button>
                </form>
            </div>

            <div className="course-list-grid">
                {courses.map((course) => (
                    <div key={course.courseID} className="course-card">
                        <div className="course-card-header">
                            <div>
                                <span className="course-title">{course.title}</span>
                                <span className="course-code">{course.courseCode}</span>
                            </div>
                            <div className="course-info-right">
                                <span className="course-teacher">
                                    {course.assignedTeacher ? course.assignedTeacher.name : 'N/A'}
                                </span>
                                <span className="course-program">
                                    {course.program || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CoursePage;