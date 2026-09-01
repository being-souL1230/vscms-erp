import axios from 'axios';
import { BASE_URL, RENDER_FALLBACK_URL } from '../constants/api';
import { getSessionToken, removeSession } from '../storage/authStorage';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach session cookie if available
api.interceptors.request.use(
  async (config) => {
    const token = await getSessionToken();
    if (token) {
      config.headers.Cookie = `vscms_erp_session=${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - extract session cookie and handle fallback if local dev server offline
api.interceptors.response.use(
  (response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie && Array.isArray(setCookie)) {
      const sessionMatch = setCookie.find(c => c.startsWith('vscms_erp_session='));
      if (sessionMatch) {
        const token = sessionMatch.split(';')[0].split('=')[1];
        response._sessionToken = token;
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    // Fallback to Render URL if local host connection failed (Network Error / ECONNREFUSED)
    if (!error.response && config && !config._isRetry && config.baseURL !== RENDER_FALLBACK_URL) {
      config._isRetry = true;
      config.baseURL = RENDER_FALLBACK_URL;
      return api(config);
    }

    if (error.response?.status === 401) {
      await removeSession();
    }
    return Promise.reject(error);
  }
);

export default api;
