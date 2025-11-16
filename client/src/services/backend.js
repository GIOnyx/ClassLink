import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  withCredentials: true
});

export const getCourses = () => API.get('/courses');
export const getCoursesByProgram = (program) => API.get('/courses', { params: { program } });
export const addCourse = (course) => API.post('/courses', course);
export const getEnrollments = () => API.get('/enrollments');
export const postEnrollment = (payload) => API.post('/enrollments', payload);

// Auth/session helpers
export const login = (email, password, role = 'student') =>
  API.post('/auth/login', { email, password, role });

export const me = () => API.get('/auth/me');

export const logout = () => API.post('/auth/logout');

export const register = (payload) => API.post('/auth/register', payload);

// Admin - Students
export const getStudents = () => API.get('/admin/students');
export const createStudent = (payload) => API.post('/admin/students', payload);
export const getStudentsByStatus = (status) => API.get('/admin/students', { params: { status } });
export const setStudentStatus = (id, status) => API.patch(`/admin/students/${id}/status`, { status });
export const approveStudent = (id) => API.post(`/admin/students/${id}/approve`);
export const rejectStudent = (id) => API.post(`/admin/students/${id}/reject`);

export const submitStudentApplication = (payload) => API.put('/students/me', payload);
export const getMyStudent = () => API.get('/students/me');
export const getDepartments = () => API.get('/departments');
export const getPrograms = (departmentId) => API.get('/programs', { params: { departmentId } });

export const getTeachers = () => API.get('/teachers');
export const addTeacher = (teacherData) => API.post('/teachers', teacherData);
export const updateTeacher = (id, teacherData) => API.put(`/teachers/${id}`, teacherData);
export const deleteTeacher = (id) => API.delete(`/teachers/${id}`);

export default API;
