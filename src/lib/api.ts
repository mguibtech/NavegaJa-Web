import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Helpers de storage ───────────────────────────────────────────────────────
// Usa localStorage (permanecer conectado) ou sessionStorage (só esta sessão)

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

/** Detecta qual storage tem o token ativo */
function getActiveStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem('token')) return localStorage;
  if (sessionStorage.getItem('token')) return sessionStorage;
  return null;
}

/** Salva novo accessToken no mesmo storage onde o anterior estava */
function persistNewAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  const storage = getActiveStorage();
  if (!storage) return;
  storage.setItem('token', token);
  const isPersistent = storage === localStorage;
  document.cookie = isPersistent
    ? `token=${token}; path=/; max-age=604800`
    : `token=${token}; path=/`;
}

/** Limpa todos os dados de autenticação dos dois storages */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  ['token', 'refreshToken', 'user'].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  document.cookie = 'token=; path=/; max-age=0';
}

// ─── Interceptor de request ───────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Refresh token logic ──────────────────────────────────────────────────────
let isRedirecting = false;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && !isRedirecting) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/login')) {
      isRedirecting = true;
      clearAuthStorage();
      window.location.href = '/login';
    }
  }
}

// Interceptor de response com refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    // Sem refresh token → vai direto para o login
    if (!refreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // Outra requisição já está fazendo refresh → enfileira
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Usa axios puro (não o api) para evitar loop de interceptors
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const newToken: string = data.accessToken;

      persistNewAccessToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login-web', { email, password });
    return data;
  },
  refresh: async (refreshToken: string) => {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
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
  createEmergencyContact: async (contact: { name: string; type: string; phoneNumber: string; description?: string; region?: string; priority?: number }) => {
    const { data } = await api.post('/safety/emergency-contacts', contact);
    return data;
  },
  updateEmergencyContact: async (id: string, contact: { name?: string; type?: string; phoneNumber?: string; description?: string; region?: string; priority?: number }) => {
    const { data } = await api.put(`/safety/emergency-contacts/${id}`, contact);
    return data;
  },
  deleteEmergencyContact: async (id: string) => {
    const { data } = await api.delete(`/safety/emergency-contacts/${id}`);
    return data;
  },
  seedEmergencyContacts: async () => {
    const { data } = await api.post('/safety/emergency-contacts/seed');
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
  create: async (boatData: Record<string, unknown>) => {
    const { data } = await api.post('/boats', boatData);
    return data;
  },
  update: async (id: string, boatData: Record<string, unknown>) => {
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
  getAll: async (filters?: Record<string, unknown>) => {
    const { data } = await api.get('/trips', { params: filters });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/trips/${id}`);
    return data;
  },
  create: async (tripData: Record<string, unknown>) => {
    const { data } = await api.post('/trips', tripData);
    return data;
  },
  update: async (id: string, tripData: Record<string, unknown>) => {
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
  getAll: async (filters?: Record<string, unknown>) => {
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
  create: async (shipmentData: Record<string, unknown>) => {
    const { data } = await api.post('/shipments', shipmentData);
    return data;
  },
  update: async (id: string, shipmentData: Record<string, unknown>) => {
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
    getActivity: async (limit = 50) => {
      const { data } = await api.get('/admin/dashboard/activity', { params: { limit } });
      return data;
    },
    getChart: async (days = 7) => {
      const { data } = await api.get('/admin/dashboard/chart', { params: { days } });
      return data;
    },
  },

  // Users
  users: {
    getAll: async (params?: Record<string, unknown>) => {
      const normalized = params ? {
        ...params,
        ...(params.page  !== undefined && { page:  Math.trunc(Number(params.page)) }),
        ...(params.limit !== undefined && { limit: Math.trunc(Number(params.limit)) }),
      } : undefined;
      const { data } = await api.get('/admin/users', { params: normalized });
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
    updateStatus: async (id: string, isActive: boolean) => {
      const { data } = await api.patch(`/admin/users/${id}/status`, { isActive });
      return data; // retorna { message: string, user: User }
    },
    delete: async (id: string) => {
      const { data } = await api.delete(`/admin/users/${id}`);
      return data;
    },
    verify: async (id: string, verified: boolean, rejectionReason?: string) => {
      const body: Record<string, unknown> = { verified };
      if (rejectionReason) body.rejectionReason = rejectionReason;
      const { data } = await api.patch(`/admin/users/${id}/verify`, body);
      return data;
    },
  },

  // Trips
  trips: {
    getAll: async (params?: Record<string, unknown>) => {
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
    getAll: async (params?: Record<string, unknown>) => {
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

  // Reviews (moderação)
  reviews: {
    getAll: async (params?: Record<string, unknown>) => {
      const { data } = await api.get('/admin/reviews', { params });
      return data;
    },
    getById: async (id: string) => {
      const { data } = await api.get(`/admin/reviews/${id}`);
      return data;
    },
    getStats: async () => {
      const { data } = await api.get('/admin/reviews/stats');
      return data;
    },
    delete: async (id: string) => {
      const { data } = await api.delete(`/admin/reviews/${id}`);
      return data;
    },
  },

  // Safety Checklists
  safety: {
    getChecklists: async (params?: Record<string, unknown>) => {
      const { data } = await api.get('/admin/safety/checklists', { params });
      return data;
    },
    getChecklistStats: async () => {
      const { data } = await api.get('/admin/safety/checklists/stats');
      return data;
    },
  },

  // Boats (admin operations)
  boats: {
    getPending: async () => {
      const { data } = await api.get('/admin/boats/pending');
      return data;
    },
    verify: async (id: string, approved: boolean, reason?: string) => {
      const body: Record<string, unknown> = { approved };
      if (reason) body.reason = reason;
      const { data } = await api.patch(`/admin/boats/${id}/verify`, body);
      return data;
    },
  },

  // Captains
  captains: {
    create: async (captainData: { name: string; phone: string; password: string; email?: string; city?: string }) => {
      const { data } = await api.post('/admin/captains', captainData);
      return data;
    },
  },

  // Notifications
  notifications: {
    getAll: async () => {
      const { data } = await api.get('/admin/notifications');
      return data;
    },
    broadcast: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/admin/notifications/broadcast', payload);
      return data;
    },
  },
};

// Coupons API
export const coupons = {
  // Admin - CRUD completo
  create: async (couponData: Record<string, unknown>) => {
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
  update: async (id: string, couponData: Record<string, unknown>) => {
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
  getAll: async (params?: Record<string, unknown>) => {
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
  create: async (bookingData: Record<string, unknown>) => {
    const { data } = await api.post('/bookings', bookingData);
    return data;
  },
  calculatePrice: async (priceData: Record<string, unknown>) => {
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

// Notifications API
export const notifications = {
  test: async () => {
    const { data } = await api.post('/notifications/test');
    return data;
  },
};
