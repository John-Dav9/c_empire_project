export enum EventBookingStatus {
  PENDING = 'PENDING', // Réservation créée, en attente de validation
  VALIDATED = 'VALIDATED', // Validée par l’admin
  REFUSED = 'REFUSED', // Refusée par l’admin
  PAID = 'PAID', // Paiement effectué
  CANCELLED = 'CANCELLED', // Annulée par l’utilisateur
}
