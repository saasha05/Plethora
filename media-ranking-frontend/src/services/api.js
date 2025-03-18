// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const auth = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Media services
export const media = {
  search: (query, type) => api.get(`/watchmode/search?query=${query}${type ? `&type=${type}` : ''}`),
  getAll: (params) => api.get('/media', { params }),
  getById: (id) => api.get(`/media/${id}`),
  addToWatched: (mediaId, watchedOn) => api.post(`/users/me/watched`, { mediaId, watchedOn }),
};

// Ranking services
export const ranking = {
  getComparisonPair: () => api.get('/users/me/comparison-pair'),
  submitComparison: (winnerId, loserId) => api.post('/comparisons', { winner: winnerId, loser: loserId }),
  getRankings: () => api.get('/users/me/rankings'),
  getRankingsByCategory: (category) => api.get(`/users/me/rankings/${category}`),
};

// Subscription services
export const subscription = {
  getRecommendations: () => api.get('/users/me/subscription-recommendations'),
  updateSubscriptions: (subscriptions) => api.put('/users/me/subscriptions', { subscriptions }),
  getPlatforms: () => api.get('/watchmode/platforms'),
};

export default {
  auth,
  media,
  ranking,
  subscription,
};
