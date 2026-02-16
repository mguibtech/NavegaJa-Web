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

// Variável para controlar se já estamos redirecionando
let isRedirecting = false;

// Interceptor para tratar erros de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !isRedirecting) {
        // Só redireciona se não estiver na página de login
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login')) {
          isRedirecting = true;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Remove o cookie também
          document.cookie = 'token=; path=/; max-age=0';
          window.location.href = '/login';
        }
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

// Trips API
export const trips = {
  getAll: async (filters?: any) => {
    const { data } = await api.get('/trips', { params: filters });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/trips/${id}`);
    return data;
  },
  create: async (tripData: any) => {
    const { data } = await api.post('/trips', tripData);
    return data;
  },
  update: async (id: string, tripData: any) => {
    const { data } = await api.patch(`/trips/${id}`, tripData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/trips/${id}`);
    return data;
  },
  cancel: async (id: string, reason?: string) => {
    const { data } = await api.patch(`/trips/${id}`, {
      status: 'cancelled',
      notes: reason
    });
    return data;
  },
};

// Shipments API
export const shipments = {
  getAll: async (filters?: any) => {
    const { data } = await api.get('/shipments', { params: filters });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/shipments/${id}`);
    return data;
  },
  getByTrackingCode: async (trackingCode: string) => {
    const { data } = await api.get(`/shipments/track/${trackingCode}`);
    return data;
  },
  create: async (shipmentData: any) => {
    const { data } = await api.post('/shipments', shipmentData);
    return data;
  },
  update: async (id: string, shipmentData: any) => {
    const { data } = await api.patch(`/shipments/${id}`, shipmentData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/shipments/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/shipments/${id}`, { status });
    return data;
  },
};

// Stats API (para dashboard)
export const stats = {
  getDashboardStats: async () => {
    // Você pode criar um endpoint específico no backend ou fazer múltiplas chamadas
    const [tripsData, bookings, shipmentsData, sosAlerts] = await Promise.all([
      api.get('/trips'),
      api.get('/bookings'),
      api.get('/shipments'),
      api.get('/safety/sos/active'),
    ]);
    return {
      trips: tripsData.data.length,
      bookings: bookings.data.length,
      shipments: shipmentsData.data.length,
      sosAlerts: sosAlerts.data.length,
    };
  },
};
