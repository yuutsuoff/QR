import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  const { hostname, protocol } = window.location;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Localtunnel support (expected: xxx-web.loca.lt and xxx-api.loca.lt)
  if (hostname.endsWith('.loca.lt')) {
    if (hostname.includes('-web')) {
      return 'https://' + hostname.replace('-web', '-api');
    }
    // If no -web suffix, we can't easily guess, so we fallback to current host
    // but typically the API is on a different subdomain or port.
    return protocol + '//' + hostname; 
  }
  
  // Fallback: use current hostname with port 8000 (common for local network sharing)
  return `${protocol}//${hostname}:8000`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
