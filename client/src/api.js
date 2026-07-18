import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('societyhub-token') : null;
if (storedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
}

function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('societyhub-token');
    localStorage.removeItem('societyhub-user');
  }
  delete api.defaults.headers.common.Authorization;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:expired'));
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = typeof error?.response?.data?.error === 'string'
      ? error.response.data.error.toLowerCase()
      : '';
    const shouldRedirectToLogin = error?.response?.status === 401 && (
      errorMessage.includes('expired') ||
      errorMessage.includes('token') ||
      errorMessage.includes('authorization')
    ) && !errorMessage.includes('invalid credentials');
    const isAuthPage = typeof window !== 'undefined' && ['/login', '/register'].includes(window.location.pathname);

    if (shouldRedirectToLogin && !isAuthPage) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export function setToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
