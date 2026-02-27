export enum ShipmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COLLECTED = 'collected',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface Shipment {
  id: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  origin: string;
  destination: string;
  weight: number;
  description: string;
  price: number;
  status: ShipmentStatus;
  // Novos campos
  paidBy?: string;
  photos?: string[];
  tripId?: string;
  trip?: {
    id: string;
    scheduledDeparture: string;
    currentLat?: number;
    currentLng?: number;
    boat: {
      name: string;
    };
  };
  estimatedDelivery?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
