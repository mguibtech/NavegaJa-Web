import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para tratar erros de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login-web', { email, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Safety API
export const safety = {
  getEmergencyContacts: async () => {
    const { data } = await api.get('/safety/emergency-contacts');
    return data;
  },
  getActiveSosAlerts: async () => {
    const { data } = await api.get('/safety/sos/active');
    return data;
  },
  resolveSosAlert: async (id: string, status: string, notes?: string) => {
    const { data } = await api.patch(`/safety/sos/${id}/resolve`, { status, notes });
    return data;
  },
};

// Stats API (para dashboard)
export const stats = {
  getDashboardStats: async () => {
    // Você pode criar um endpoint específico no backend ou fazer múltiplas chamadas
    const [trips, bookings, shipments, sosAlerts] = await Promise.all([
      api.get('/trips'),
      api.get('/bookings'),
      api.get('/shipments'),
      api.get('/safety/sos/active'),
    ]);
    return {
      trips: trips.data.length,
      bookings: bookings.data.length,
      shipments: shipments.data.length,
      sosAlerts: sosAlerts.data.length,
    };
  },
};
