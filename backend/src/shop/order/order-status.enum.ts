export enum OrderStatus {
  PENDING = 'pending', // créée, pas encore validée
  CONFIRMED = 'confirmed', // validée par admin
  PAID = 'paid', // paiement reçu
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
