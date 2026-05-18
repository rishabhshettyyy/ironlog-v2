/* ══════════════════════════════════════════════
   client/src/services/api.js
   Axios instance — auto-attaches JWT token to
   every request via request interceptor.
   Author: Rishabh
══════════════════════════════════════════════ */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/* Attach token from localStorage to every request */
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ironlog_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* On 401, clear stored auth and redirect to login */
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ironlog_token');
      localStorage.removeItem('ironlog_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

/* ── Auth ── */
export const authApi = {
  register: (data)   => api.post('/auth/register', data),
  login:    (data)   => api.post('/auth/login', data),
  getMe:    ()       => api.get('/auth/me'),
  updateMe: (data)   => api.put('/auth/me', data),
};

/* ── Exercises ── */
export const exerciseApi = {
  getByDate:   (date)              => api.get('/exercises', { params: { date } }),
  getAll:      (params = {})       => api.get('/exercises/all', { params }),
  getSummary:  (year, month, uid)  => api.get('/exercises/summary', { params: { year, month, userId: uid } }),
  create:      (data)              => api.post('/exercises', data),
  update:      (id, data)          => api.put(`/exercises/${id}`, data),
  delete:      (id)                => api.delete(`/exercises/${id}`),
  clearAll:    (weekday)           => api.delete('/exercises/all', { params: weekday ? { weekday } : {} }),
};

/* ── Routine ── */
export const routineApi = {
  get:          ()     => api.get('/routine'),
  save:         (data) => api.put('/routine', data),
  fillSchedule: ()     => api.post('/routine/fill-schedule'),
  clearDay:     (day)  => api.delete(`/routine/clear-day/${day}`),
};

/* ── Health Metrics ── */
export const metricsApi = {
  getRange:  (from, to, userId) => api.get('/health-metrics', { params: { from, to, userId } }),
  getByDate: (date)             => api.get(`/health-metrics/${date}`),
  save:      (data)             => api.post('/health-metrics', data),
  update:    (date, data)       => api.put(`/health-metrics/${date}`, data),
  delete:    (date)             => api.delete(`/health-metrics/${date}`),
};

/* ── Gym Closures ── */
export const gymClosureApi = {
  getByMonth: (year, month) => api.get('/gym-closures', { params: { year, month } }),
  create:     (data)        => api.post('/gym-closures', data),
  update:     (id, data)    => api.put(`/gym-closures/${id}`, data),
  delete:     (id)          => api.delete(`/gym-closures/${id}`),
};

/* ── Admin ── */
export const adminApi = {
  getUsers:          ()         => api.get('/admin/users'),
  getUser:           (id)       => api.get(`/admin/users/${id}`),
  updateRole:        (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser:        (id)       => api.delete(`/admin/users/${id}`),
  getUserExercises:  (id, p)    => api.get(`/admin/users/${id}/exercises`, { params: p }),
  getUserRoutine:    (id)       => api.get(`/admin/users/${id}/routine`),
  getUserMetrics:    (id, p)    => api.get(`/admin/users/${id}/metrics`, { params: p }),
  getCalendarSummary:(id, y, m) => api.get(`/admin/users/${id}/calendar-summary`, { params: { year: y, month: m } }),
};
