/**
 * admin.api.js — Centralized axios client for all authenticated admin API calls.
 *
 * Key changes from the original:
 * - baseURL updated to /api/v1/admin/
 * - Authorization header reads Bearer token from React context (not localStorage)
 * - 401 interceptor: attempts silent refresh via /api/v1/auth/refresh before
 *   logging the user out. Prevents mid-session logouts on token expiry.
 * - All list endpoints now accept ?page / ?limit / ?search / ?sort / ?order params.
 */
import axios from 'axios';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // send the httpOnly refresh-token cookie automatically
});

// Dedicated instance for auth calls (avoids interceptor loops)
const authApi = axios.create({ withCredentials: true });

// ── Token injection ───────────────────────────────────────────────────────────
// The access token lives in React state. Components that call admin.api.js
// functions pass the token via setAccessToken() below, or we read it from a
// shared ref set by AuthContext.
let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── 401 → silent refresh → retry ─────────────────────────────────────────────
let _refreshing = null; // singleton promise to avoid concurrent refresh calls

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;

      // Try to refresh once; if that also fails, redirect to login
      if (!_refreshing) {
        _refreshing = authApi
          .post('/api/v1/auth/refresh')
          .finally(() => { _refreshing = null; });
      }

      try {
        const res = await _refreshing;
        const newToken = res.data.data.accessToken;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original); // retry the original request
      } catch {
        // Refresh failed — session is dead
        setAccessToken(null);
        window.location.href = '/admin/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
// Note: login/logout are handled directly by AuthContext (avoids circular dep).
// These are kept for completeness and legacy compatibility.
export const getSettings    = async () => (await api.get('/settings')).data;
export const updateSettings = async (data) => (await api.put('/settings', data)).data;

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = async () => (await api.get('/dashboard')).data;

// ── Certificates ──────────────────────────────────────────────────────────────
export const getCertificates = async (params) => (await api.get('/certificates', { params })).data;
export const issueSingle     = async (data)   => (await api.post('/certificates/issue', data)).data;
export const revokeCert      = async (id, reason) => (await api.put(`/certificates/${id}/revoke`, { reason })).data;

// ── Students ──────────────────────────────────────────────────────────────────
export const getStudents          = async (params) => (await api.get('/students', { params })).data;
export const getEligibleStudents  = async (courseId, search) =>
  (await api.get('/students/eligible', { params: { courseId, ...(search ? { search } : {}) } })).data;
export const createStudent        = async (data)   => (await api.post('/students', data)).data;
export const updateStudent        = async (id, data) => (await api.put(`/students/${id}`, data)).data;
export const deleteStudent        = async (id)     => (await api.delete(`/students/${id}`)).data;

// ── Courses ───────────────────────────────────────────────────────────────────
export const getCourses    = async (params) => (await api.get('/courses', { params })).data;
export const createCourse  = async (data)   => (await api.post('/courses', data)).data;
export const updateCourse  = async (id, data) => (await api.put(`/courses/${id}`, data)).data;
export const deleteCourse  = async (id)     => (await api.delete(`/courses/${id}`)).data;

// ── Logs ──────────────────────────────────────────────────────────────────────
export const getLogs = async (params) => (await api.get('/logs', { params })).data;

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReports    = async (params) => (await api.get('/reports', { params })).data;
export const updateReport  = async (id, status) => (await api.put(`/reports/${id}`, { status })).data;

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers    = async (params) => (await api.get('/users', { params })).data;
export const createUser  = async (data)   => (await api.post('/users', data)).data;
export const updateUser  = async (id, data) => (await api.put(`/users/${id}`, data)).data;
export const deleteUser  = async (id)     => (await api.delete(`/users/${id}`)).data;
