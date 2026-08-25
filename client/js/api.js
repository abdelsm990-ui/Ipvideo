/* ============================================
   Ipvideo - API Client (Frontend)
   PayPal + Supabase version
   ============================================ */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api';

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('ipvideo_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Auth API
const authAPI = {
  register: (userData) => api('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => api('/auth/login', { method: 'POST', body: credentials }),
  me: () => api('/auth/me', { method: 'GET' }),
  pointsHistory: () => api('/auth/points-history', { method: 'GET' }),
};

// Video API
const videoAPI = {
  generate: (payload) => api('/videos/generate', { method: 'POST', body: payload }),
  myVideos: () => api('/videos/my', { method: 'GET' }),
  getById: (id) => api(`/videos/${id}`, { method: 'GET' }),
  checkStatus: (id) => api(`/videos/${id}/status`, { method: 'GET' }),
};

// PayPal Payment API
const paymentAPI = {
  // One-time order
  createPayPalOrder: (plan) => api('/payments/paypal-order', { method: 'POST', body: { plan } }),
  capturePayPalOrder: (orderId, plan) => api('/payments/paypal-capture', { method: 'POST', body: { orderId, plan } }),

  // Subscription
  createPayPalSubscription: (plan) => api('/payments/paypal-subscription', { method: 'POST', body: { plan } }),

  // Subscription management
  cancel: () => api('/payments/cancel', { method: 'POST' }),
  status: () => api('/payments/status', { method: 'GET' }),
};
