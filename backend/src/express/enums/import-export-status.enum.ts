export enum ImportExportStatus {
  REQUESTED = 'requested', // Demande envoyée par l’utilisateur
  QUOTED = 'quoted', // Devis proposé par l’admin
  ACCEPTED = 'accepted', // Devis accepté par l’utilisateur
  IN_PROGRESS = 'in_progress', // En cours de traitement / transport
  COMPLETED = 'completed', // Livraison terminée
  REJECTED = 'rejected', // Demande refusée
}
