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

// Boats API
export const boats = {
  getAll: async () => {
    const { data } = await api.get('/boats');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/boats/${id}`);
    return data;
  },
  myBoats: async () => {
    const { data } = await api.get('/boats/my-boats');
    return data;
  },
  create: async (boatData: any) => {
    const { data } = await api.post('/boats', boatData);
    return data;
  },
  update: async (id: string, boatData: any) => {
    const { data} = await api.patch(`/boats/${id}`, boatData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/boats/${id}`);
    return data;
  },
};

// Routes API
export const routes = {
  getAll: async () => {
    const { data } = await api.get('/routes');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/routes/${id}`);
    return data;
  },
  search: async (origin?: string, dest?: string) => {
    const { data } = await api.get('/routes/search', {
      params: { origin, dest },
    });
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

// Admin API - Endpoints administrativos
export const admin = {
  // Dashboard
  dashboard: {
    getOverview: async () => {
      const { data } = await api.get('/admin/dashboard');
      return data;
    },
    getActivity: async () => {
      const { data } = await api.get('/admin/dashboard/activity');
      return data;
    },
  },

  // Users
  users: {
    getAll: async (params?: any) => {
      const { data } = await api.get('/admin/users', { params });
      return data;
    },
    getStats: async () => {
      const { data } = await api.get('/admin/users/stats');
      return data;
    },
    getById: async (id: string) => {
      const { data } = await api.get(`/admin/users/${id}`);
      return data;
    },
    updateRole: async (id: string, role: string) => {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      return data;
    },
    delete: async (id: string) => {
      const { data } = await api.delete(`/admin/users/${id}`);
      return data;
    },
  },

  // Trips
  trips: {
    getAll: async (params?: any) => {
      const { data } = await api.get('/admin/trips', { params });
      return data;
    },
    getStats: async () => {
      const { data } = await api.get('/admin/trips/stats');
      return data;
    },
    updateStatus: async (id: string, status: string) => {
      const { data } = await api.patch(`/admin/trips/${id}/status`, { status });
      return data;
    },
    delete: async (id: string) => {
      const { data } = await api.delete(`/admin/trips/${id}`);
      return data;
    },
  },

  // Shipments
  shipments: {
    getAll: async (params?: any) => {
      const { data } = await api.get('/admin/shipments', { params });
      return data;
    },
    getStats: async () => {
      const { data } = await api.get('/admin/shipments/stats');
      return data;
    },
    updateStatus: async (id: string, status: string) => {
      const { data } = await api.patch(`/admin/shipments/${id}/status`, { status });
      return data;
    },
  },

  // Safety Checklists
  safety: {
    getChecklists: async (params?: any) => {
      const { data } = await api.get('/admin/safety/checklists', { params });
      return data;
    },
    getChecklistStats: async () => {
      const { data } = await api.get('/admin/safety/checklists/stats');
      return data;
    },
  },
};

// Coupons API
export const coupons = {
  // Admin - CRUD completo
  create: async (couponData: any) => {
    const { data } = await api.post('/coupons', couponData);
    return data;
  },
  getAll: async () => {
    const { data } = await api.get('/coupons');
    return data;
  },
  getByCode: async (code: string) => {
    const { data } = await api.get(`/coupons/${code}`);
    return data;
  },
  update: async (id: string, couponData: any) => {
    const { data } = await api.put(`/coupons/${id}`, couponData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/coupons/${id}`);
    return data;
  },

  // Públicos
  getActive: async () => {
    const { data } = await api.get('/coupons/active');
    return data;
  },
  validate: async (validateData: { code: string; tripId: string; quantity: number }) => {
    const { data } = await api.post('/coupons/validate', validateData);
    return data;
  },
};

// Bookings API
export const bookings = {
  // Admin - Endpoints administrativos
  getAll: async (params?: any) => {
    const { data } = await api.get('/admin/bookings', { params });
    return data;
  },
  getStats: async () => {
    const { data } = await api.get('/admin/bookings/stats');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/admin/bookings/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/admin/bookings/${id}/status`, { status });
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/admin/bookings/${id}`);
    return data;
  },

  // Passageiros - Endpoints públicos
  myBookings: async () => {
    const { data } = await api.get('/bookings/my-bookings');
    return data;
  },
  create: async (bookingData: any) => {
    const { data } = await api.post('/bookings', bookingData);
    return data;
  },
  calculatePrice: async (priceData: any) => {
    const { data } = await api.post('/bookings/calculate-price', priceData);
    return data;
  },
  cancel: async (id: string, reason?: string) => {
    const { data } = await api.post(`/bookings/${id}/cancel`, { reason });
    return data;
  },
  getTracking: async (id: string) => {
    const { data } = await api.get(`/bookings/${id}/tracking`);
    return data;
  },
  getPaymentStatus: async (id: string) => {
    const { data } = await api.get(`/bookings/${id}/payment-status`);
    return data;
  },

  // Capitão
  confirmPayment: async (id: string) => {
    const { data } = await api.post(`/bookings/${id}/confirm-payment`);
    return data;
  },
  checkin: async (id: string) => {
    const { data } = await api.post(`/bookings/${id}/checkin`);
    return data;
  },
  complete: async (id: string) => {
    const { data } = await api.patch(`/bookings/${id}/complete`);
    return data;
  },
};
