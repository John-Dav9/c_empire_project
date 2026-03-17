export enum CleanQuoteStatus {
  PENDING = 'PENDING', // demande reçue
  REVIEWING = 'REVIEWING', // en analyse
  SENT = 'SENT', // devis envoyé
  ACCEPTED = 'ACCEPTED', // client accepte
  REJECTED = 'REJECTED', // client refuse
  EXPIRED = 'EXPIRED', // devis expiré
  CANCELLED = 'CANCELLED', // annulé
}
