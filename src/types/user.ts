export enum UserRole {
  ADMIN = 'admin',
  CAPTAIN = 'captain',
  PASSENGER = 'passenger',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  cpf?: string;
  birthDate?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface UserStats {
  total: number;
  byRole: {
    admin: number;
    captain: number;
    passenger: number;
  };
  byStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  recentRegistrations: number;
  activeToday: number;
}

export interface UserFilters {
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  search?: string;
  page?: number;
  limit?: number;
}
