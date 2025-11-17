import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const getStudents = () => axios.get(`${API_BASE}/api/students`);
export const getStudent = (id) => axios.get(`${API_BASE}/api/students/${id}`);
export const createStudent = (student) => axios.post(`${API_BASE}/api/students`, student);
export const updateStudent = (id, student) => axios.put(`${API_BASE}/api/students/${id}`, student);
export const deleteStudent = (id) => axios.delete(`${API_BASE}/api/students/${id}`);

export default {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent
};
