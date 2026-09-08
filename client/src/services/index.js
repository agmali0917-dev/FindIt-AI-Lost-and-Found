/**
 * Auth API functions
 */

import api from './api'

export const authService = {
  register:            (data) => api.post('/auth/register', data),
  login:               (data) => api.post('/auth/login', data),
  logout:              ()     => api.post('/auth/logout'),
  verifyEmail:         (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification:  (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword:      (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:       (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  refreshToken:        (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getMe:               () => api.get('/auth/me'),
  changePassword:      (data) => api.put('/auth/change-password', data),
}

export const userService = {
  getProfile:    (id) => api.get(id ? `/users/${id}` : '/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  updateSettings:(data) => api.put('/users/me/settings', data),
  getActivity:   (id) => api.get(id ? `/users/${id}/activity` : '/users/me/activity'),
}

export const lostItemService = {
  create:         (data) => api.post('/lost-items', data),
  getAll:         (params) => api.get('/lost-items', { params }),
  getById:        (id) => api.get(`/lost-items/${id}`),
  update:         (id, data) => api.put(`/lost-items/${id}`, data),
  delete:         (id) => api.delete(`/lost-items/${id}`),
  getMine:        (params) => api.get('/lost-items/my', { params }),
  deleteImage:    (id, publicId) => api.delete(`/lost-items/${id}/images/${encodeURIComponent(publicId)}`),
}

export const foundItemService = {
  create:  (data) => api.post('/found-items', data),
  getAll:  (params) => api.get('/found-items', { params }),
  getById: (id) => api.get(`/found-items/${id}`),
  update:  (id, data) => api.put(`/found-items/${id}`, data),
  delete:  (id) => api.delete(`/found-items/${id}`),
  getMine: (params) => api.get('/found-items/my', { params }),
}

export const matchService = {
  getAll:   (params) => api.get('/matches', { params }),
  getById:  (id) => api.get(`/matches/${id}`),
  confirm:  (id, data) => api.post(`/matches/${id}/confirm`, data),
  reject:   (id, data) => api.post(`/matches/${id}/reject`, data),
}

export const chatService = {
  getChats:      ()         => api.get('/chats'),
  getMessages:   (chatId, params) => api.get(`/chats/${chatId}/messages`, { params }),
  sendMessage:   (chatId, data) => api.post(`/chats/${chatId}/messages`, data),
  deleteMessage: (chatId, messageId) => api.delete(`/chats/${chatId}/messages/${messageId}`),
}

export const notificationService = {
  getAll:       (params) => api.get('/notifications', { params }),
  markRead:     (id) => api.put(`/notifications/${id}/read`),
  markAllRead:  () => api.put('/notifications/read-all'),
  delete:       (id) => api.delete(`/notifications/${id}`),
}

export const searchService = {
  search:      (params) => api.get('/search', { params }),
  suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
}

export const adminService = {
  getStats:     () => api.get('/admin/stats'),
  getUsers:     (params) => api.get('/admin/users', { params }),
  banUser:      (id, data) => api.put(`/admin/users/${id}/ban`, data),
  unbanUser:    (id) => api.put(`/admin/users/${id}/unban`),
  promoteUser:  (id) => api.put(`/admin/users/${id}/promote`),
  deleteUser:   (id) => api.delete(`/admin/users/${id}`),
  getItems:     (params) => api.get('/admin/items', { params }),
  verifyItem:   (id, type) => api.put(`/admin/items/${id}/verify`, null, { params: { type } }),
  featureItem:  (id) => api.put(`/admin/items/${id}/feature`),
  deleteItem:   (id, type) => api.delete(`/admin/items/${id}`, { params: { type } }),
}

export const aiService = {
  autoFill: (formData) => api.post('/ai/auto-fill', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
