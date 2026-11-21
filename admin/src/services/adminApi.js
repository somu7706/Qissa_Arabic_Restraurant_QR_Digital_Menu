import axios from 'axios';

export const DEFAULT_PRODUCTION_BACKEND = 'https://qissa-backend.onrender.com';

export const getAdminApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${DEFAULT_PRODUCTION_BACKEND}/api/admin`;
  }
  return 'http://localhost:5000/api/admin';
};

const API_BASE = getAdminApiBaseUrl();

const adminApi = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s for cloud backend cold starts
});

// Automatic retry on timeout or network errors
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Don't auto-retry login auth failures (401/400)
    if (config.url?.includes('/auth/login') && error.response?.status < 500) {
      return Promise.reject(error);
    }

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
        `[AdminAPI] Request to ${config.url || 'endpoint'} failed (${error.message}). Retrying in ${delayMs}ms (attempt ${config.__retryCount}/${maxRetries})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return adminApi(config);
    }

    return Promise.reject(error);
  }
);

// Interceptor to inject JWT token
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('qissa_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginAdmin = async (credentials) => {
  const res = await adminApi.post('/auth/login', credentials);
  return res.data;
};

export const getMe = async () => {
  const res = await adminApi.get('/auth/me');
  return res.data.admin;
};

// Dashboard
export const getDashboardStats = async () => {
  const res = await adminApi.get('/dashboard');
  return res.data.data;
};

// Menu Management
export const getAdminMenuItems = async () => {
  const res = await adminApi.get('/menu');
  return res.data.data;
};

export const createMenuItem = async (data) => {
  const res = await adminApi.post('/menu', data);
  return res.data.data;
};

export const updateMenuItem = async (id, data) => {
  const res = await adminApi.put(`/menu/${id}`, data);
  return res.data.data;
};

export const deleteMenuItem = async (id) => {
  const res = await adminApi.delete(`/menu/${id}`);
  return res.data;
};

// Image Uploads & Automatic Arabic Translation
export const uploadDishImage = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await adminApi.post('/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return res.data;
};

export const uploadMultipleDishImages = async (files, onUploadProgress) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('images', file);
  });
  const res = await adminApi.post('/upload-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return res.data;
};

export const translateDishName = async (text) => {
  const res = await adminApi.post('/translate', { text });
  return res.data;
};

// Categories
export const getAdminCategories = async () => {
  const res = await adminApi.get('/categories');
  return res.data.data;
};

export const createCategory = async (data) => {
  const res = await adminApi.post('/categories', data);
  return res.data.data;
};

export const updateCategory = async (id, data) => {
  const res = await adminApi.put(`/categories/${id}`, data);
  return res.data.data;
};

export const deleteCategory = async (id) => {
  const res = await adminApi.delete(`/categories/${id}`);
  return res.data;
};

export const getCategoryDishes = async (categoryId) => {
  const res = await adminApi.get(`/categories/${categoryId}/dishes`);
  return res.data.data;
};

export const reorderCategories = async (items) => {
  const res = await adminApi.put('/categories/reorder', { items });
  return res.data;
};

// Tables & QR
export const getAdminTables = async () => {
  const res = await adminApi.get('/tables');
  return res.data.data;
};

export const createTable = async (data) => {
  const res = await adminApi.post('/tables', data);
  return res.data.data;
};

export const updateTable = async (id, data) => {
  const res = await adminApi.put(`/tables/${id}`, data);
  return res.data.data;
};

export const regenerateTableQR = async (id) => {
  const res = await adminApi.post(`/tables/${id}/regenerate-qr`);
  return res.data;
};

export const refreshTableQRImage = async (id) => {
  const res = await adminApi.post(`/tables/${id}/refresh-qr`);
  return res.data;
};

export const syncAllTableQRs = async () => {
  const res = await adminApi.post('/tables/sync-public-urls');
  return res.data;
};

export const deleteTable = async (id) => {
  const res = await adminApi.delete(`/tables/${id}`);
  return res.data;
};

// Specials
export const getAdminSpecials = async () => {
  const res = await adminApi.get('/specials');
  return res.data.data;
};

export const createSpecial = async (data) => {
  const res = await adminApi.post('/specials', data);
  return res.data.data;
};

export const updateSpecial = async (id, data) => {
  const res = await adminApi.put(`/specials/${id}`, data);
  return res.data.data;
};

export const deleteSpecial = async (id) => {
  const res = await adminApi.delete(`/specials/${id}`);
  return res.data;
};

// Settings
export const getAdminSettings = async () => {
  const res = await adminApi.get('/settings');
  return res.data.data;
};

export const updateAdminSettings = async (data) => {
  const res = await adminApi.put('/settings', data);
  return res.data.data;
};

// Ratings Management
export const getAdminRatingStats = async () => {
  const res = await adminApi.get('/ratings/stats');
  return res.data.data;
};

export const getAdminRatings = async (page = 1, limit = 20) => {
  const res = await adminApi.get(`/ratings?page=${page}&limit=${limit}`);
  return res.data;
};

export const updateAdminRatingSettings = async (data) => {
  const res = await adminApi.put('/ratings/settings', data);
  return res.data;
};

export default adminApi;
