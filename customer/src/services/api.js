import axios from 'axios';

export const DEFAULT_PRODUCTION_BACKEND = 'https://qissa-backend.onrender.com';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${DEFAULT_PRODUCTION_BACKEND}/api/public`;
  }
  return 'http://localhost:5000/api/public';
};

const API_BASE = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s to accommodate cloud container wake-ups (e.g. Render free tier cold starts)
});

// Automatic retry on timeout or server wake-up delay
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    config.__retryCount = config.__retryCount || 0;
    const maxRetries = 2;

    const isTimeout =
      error.code === 'ECONNABORTED' ||
      (error.message && error.message.toLowerCase().includes('timeout'));
    const isNetworkError = !error.response && error.request;
    const is5xx = error.response && [502, 503, 504].includes(error.response.status);

    if ((isTimeout || isNetworkError || is5xx) && config.__retryCount < maxRetries) {
      config.__retryCount += 1;
      const delayMs = config.__retryCount * 1500;
      console.warn(
        `[API] Request to ${config.url || 'endpoint'} failed (${error.message}). Retrying in ${delayMs}ms (attempt ${config.__retryCount}/${maxRetries})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export const getRestaurantInfo = async () => {
  const res = await api.get('/restaurant');
  return res.data.data;
};

export const getTableDetails = async (qrToken) => {
  const res = await api.get(`/tables/${qrToken}`);
  return res.data.data;
};

export const getCategories = async () => {
  const res = await api.get('/categories');
  return res.data.data;
};

export const getMenuItems = async (params = {}) => {
  const res = await api.get('/menu', { params });
  return res.data.data;
};

export const getMenuItemById = async (id) => {
  const res = await api.get(`/menu/${id}`);
  return res.data.data;
};

export const getRelatedDishes = async (itemId, params = {}) => {
  const res = await api.get(`/menu/${itemId}/related`, { params });
  return res.data.data;
};

export const getSpecials = async () => {
  const res = await api.get('/specials');
  return res.data.data;
};

export const getPopularDishes = async () => {
  const res = await api.get('/popular');
  return res.data.data;
};

export const sendAssistantMessage = async (message, options = {}) => {
  const res = await api.post('/assistant/message', {
    message,
    ...options,
  });
  return res.data.data;
};

export const resetAssistantSession = async (sessionId) => {
  const res = await api.post('/assistant/reset', { sessionId });
  return res.data.data;
};

export const getDishRatings = async (itemId) => {
  const sessionToken = sessionStorage.getItem('qissa_table_session_token');
  const headers = sessionToken ? { 'x-table-session': sessionToken } : {};
  const res = await api.get(`/menu/${itemId}/ratings`, { headers });
  return res.data.data;
};

export const submitDishRating = async (itemId, rating) => {
  const sessionToken = sessionStorage.getItem('qissa_table_session_token');
  const headers = sessionToken ? { 'x-table-session': sessionToken } : {};
  const res = await api.post(`/menu/${itemId}/ratings`, { rating }, { headers });
  return res.data;
};

export const trackInteraction = async (payload) => {
  try {
    await api.post('/interactions', payload);
  } catch (e) {
    // silently ignore tracking errors
  }
};

export default api;
