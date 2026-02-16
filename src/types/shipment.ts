export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
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
  tripId?: string;
  trip?: {
    id: string;
    scheduledDeparture: string;
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
