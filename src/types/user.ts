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
  isActive: boolean;
  isVerified?: boolean;
  cpf?: string;
  birthDate?: string;
  city?: string;
  state?: string;
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
  newToday: number;
  activeUsers: number;
  blockedUsers: number;
}

export interface UserFilters {
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  search?: string;
  page?: number;
  limit?: number;
}
