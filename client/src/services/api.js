import React, { useState, useEffect } from 'react';
import { getCourses, addCourse } from '../services/api'; // Import your API functions
import '../App.css';

const CoursePage = () => {
    const [courses, setCourses] = useState([]);
    const [newCourse, setNewCourse] = useState({ title: '', courseCode: '' });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await getCourses();
            setCourses(response.data);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCourse({ ...newCourse, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addCourse(newCourse);
        loadCourses(); // Refresh the list
        setNewCourse({ title: '', courseCode: '' }); // Clear the form
    };

    return (
        <div className="course-page-container">
            {/* Form for adding a new course */}
            <div style={{ marginBottom: '30px', padding: '20px', background: '#fff', borderRadius: '12px' }}>
                <h3>Add a New Course</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
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
                    <button type="submit">Add Course</button>
                </form>
            </div>

            {/* Grid to display courses */}
            <div className="course-content-grid">
                <div className="course-column">
                    <div className="course-header">Available Courses</div>
                    {courses.map(course => (
                        <div key={course.courseID} className="course-card">
                            <div className="course-line" style={{ background: 'none' }}>
                                <strong>{course.title}</strong> ({course.courseCode})
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoursePage;