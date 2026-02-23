export enum ReviewType {
  PASSENGER_TO_CAPTAIN = 'passenger_to_captain',
  CAPTAIN_TO_PASSENGER = 'captain_to_passenger',
}

export interface ReviewUser {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
  email?: string;
  phone?: string;
  rating?: number;
}

export interface ReviewBoat {
  id: string;
  name: string;
  rating?: number;
}

export interface ReviewTrip {
  id: string;
  origin: string;
  destination: string;
  departureAt?: string;
  status?: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewer: ReviewUser;
  tripId: string;
  trip: ReviewTrip;
  reviewType: ReviewType;

  // Passageiro → Capitão
  captainId?: string | null;
  captain?: ReviewUser | null;
  captainRating?: number | null;
  captainComment?: string | null;
  punctualityRating?: number | null;
  communicationRating?: number | null;

  // Passageiro → Barco (opcional, mesma submissão)
  boatId?: string | null;
  boat?: ReviewBoat | null;
  boatRating?: number | null;
  boatComment?: string | null;
  cleanlinessRating?: number | null;
  comfortRating?: number | null;
  boatPhotos?: string[] | null;

  // Capitão → Passageiro
  passengerId?: string | null;
  passenger?: ReviewUser | null;
  passengerRating?: number | null;
  passengerComment?: string | null;

  createdAt: string;
}

export interface ReviewStats {
  total: number;
  passengerToCapitain: number;
  captainToPassenger: number;
  averages: {
    captain: number;
    boat: number;
    passenger: number;
  };
  captainRatingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
