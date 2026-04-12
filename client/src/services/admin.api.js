import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  if (response.data.success) {
    localStorage.setItem('token', response.data.data.token);
  }
  return response.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('token');
  window.location.href = '/admin/login';
};

export const getDashboard = async () => (await api.get('/dashboard')).data;

export const getCertificates = async (params) => (await api.get('/certificates', { params })).data;
export const issueSingle = async (data) => (await api.post('/certificates/issue', data)).data;
export const issueBulk = async (data) => (await api.post('/certificates/bulk', data)).data;
export const revokeCert = async (id, reason) => (await api.put(`/certificates/${id}/revoke`, { reason })).data;

export const getStudents = async () => (await api.get('/students')).data;
export const createStudent = async (data) => (await api.post('/students', data)).data;
export const updateStudent = async (id, data) => (await api.put(`/students/${id}`, data)).data;
export const deleteStudent = async (id) => (await api.delete(`/students/${id}`)).data;

export const getCourses = async () => (await api.get('/courses')).data;
export const createCourse = async (data) => (await api.post('/courses', data)).data;
export const updateCourse = async (id, data) => (await api.put(`/courses/${id}`, data)).data;
export const deleteCourse = async (id) => (await api.delete(`/courses/${id}`)).data;

export const getLogs = async (params) => (await api.get('/logs', { params })).data;

export const getReports = async () => (await api.get('/reports')).data;
export const updateReport = async (id, status) => (await api.put(`/reports/${id}`, { status })).data;

export const getUsers = async () => (await api.get('/users')).data;
export const createUser = async (data) => (await api.post('/users', data)).data;
export const updateUser = async (id, data) => (await api.put(`/users/${id}`, data)).data;
export const deleteUser = async (id) => (await api.delete(`/users/${id}`)).data;
