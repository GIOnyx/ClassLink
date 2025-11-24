import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  withCredentials: true
});

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
export const rejectStudent = (id, reason) => API.post(`/admin/students/${id}/reject`, { reason });
// Admin self profile
export const getMyAdmin = () => API.get('/admin/me');
export const uploadMyAdminProfileImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/admin/me/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateMyAdmin = (payload) => API.put('/admin/me', payload);

export const submitStudentApplication = (payload) => API.put('/students/me', payload);
export const getMyStudent = () => API.get('/students/me');
export const uploadMyProfileImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/students/me/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getDepartments = () => API.get('/departments');
export const getPrograms = (departmentId) => API.get('/programs', { params: { departmentId } });

export const getCalendarEvents = () => API.get('/calendar');
export const createCalendarEvent = (payload) => API.post('/calendar', payload);
export const deleteCalendarEvent = (id) => API.delete(`/calendar/${id}`);
export const getTeachers = () => API.get('/teachers'); // Adding missing export from previous context if needed
export const getCourses = () => API.get('/courses');
export const addCourse = (payload) => API.post('/courses', payload);

export const getCurriculum = (programCode) => API.get(`/curricula/${encodeURIComponent(programCode)}`);

export const getFilteredEnrollmentForms = (filters) => {
    // Note: Axios automatically serializes the 'filters' object into URL query parameters (?department=X&yearLevel=Y)
    return axios.get('/api/enrollments/forms', {
        params: filters
    });
};

export default API;