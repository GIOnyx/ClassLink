import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
});

export const getCourses = () => API.get('/courses');
export const addCourse = (course) => API.post('/courses', course);
export const postEnrollment = (payload) => API.post('/enrollments', payload);

export default API;
