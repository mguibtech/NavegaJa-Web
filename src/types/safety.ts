export enum SosAlertType {
  EMERGENCY = 'emergency',
  MEDICAL = 'medical',
  FIRE = 'fire',
  WATER_LEAK = 'water_leak',
  MECHANICAL = 'mechanical',
  WEATHER = 'weather',
  ACCIDENT = 'accident',
  OTHER = 'other',
}

export enum SosAlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
  CANCELLED = 'cancelled',
}

export interface SosAlert {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
  tripId: string | null;
  trip: any | null;
  type: SosAlertType;
  status: SosAlertStatus;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  resolvedById: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  id: string;
  type: string;
  name: string;
  phoneNumber: string;
  description: string | null;
  region: string | null;
  priority: number;
}
