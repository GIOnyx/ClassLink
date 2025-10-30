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

export default API;
