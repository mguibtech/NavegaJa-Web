export enum TripStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TripType {
  PASSENGER = 'passenger',
  CARGO = 'cargo',
  MIXED = 'mixed',
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  estimatedDuration: number; // em minutos
  distance: number; // em km
}

export interface Boat {
  id: string;
  name: string;
  capacity: number;
  type: string;
}

export interface Captain {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Trip {
  id: string;
  routeId: string;
  route?: Route;
  boatId: string;
  boat?: Boat;
  captainId: string;
  captain?: Captain;
  type: TripType;
  status: TripStatus;
  scheduledDeparture: Date;
  scheduledArrival: Date;
  actualDeparture?: Date;
  actualArrival?: Date;
  passengerCount: number;
  maxPassengers: number;
  price: number;
  notes?: string;
  weatherCondition?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripFilters {
  status?: TripStatus;
  type?: TripType;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateTripDto {
  routeId: string;
  boatId: string;
  captainId: string;
  type: TripType;
  scheduledDeparture: Date;
  scheduledArrival: Date;
  maxPassengers: number;
  price: number;
  notes?: string;
}

export interface UpdateTripDto {
  status?: TripStatus;
  actualDeparture?: Date;
  actualArrival?: Date;
  notes?: string;
  weatherCondition?: string;
}
