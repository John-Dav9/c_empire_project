export enum DeliveryStatus {
  PENDING = 'pending', // Créée, non payée ou non confirmée
  CONFIRMED = 'confirmed', // Payée / validée
  ASSIGNED = 'assigned', // Livreur assigné
  IN_TRANSIT = 'in_transit', // En cours de livraison
  DELIVERED = 'delivered', // Livrée
  CANCELED = 'canceled', // Annulée
}
