import { Pipe, PipeTransform } from '@angular/core';

const STATUS_LABELS: Record<string, string> = {
  // Communs
  pending: 'En attente',
  confirmed: 'Confirmé',
  paid: 'Payé',
  cancelled: 'Annulé',
  canceled: 'Annulé',
  completed: 'Terminé',
  rejected: 'Rejeté',

  // Shop / Orders
  processing: 'En traitement',
  shipped: 'Expédié',
  delivered: 'Livré',
  refunded: 'Remboursé',

  // Express Delivery
  assigned: 'Livreur assigné',
  in_transit: 'En transit',

  // Import/Export
  requested: 'Demande envoyée',
  quoted: 'Devis proposé',
  accepted: 'Devis accepté',
  in_progress: 'En cours',

  // Events / Todo
  booked: 'Réservé',
  active: 'Actif',
  inactive: 'Inactif',

  // Paiements
  success: 'Succès',
  failed: 'Échoué',
  initiated: 'Initié',

  // Roles
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  employee: 'Employé',
  client: 'Client',
};

/**
 * Traduit un statut technique en label lisible.
 * Usage : {{ status | statusLabel }}
 */
@Pipe({
  name: 'statusLabel',
})
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return STATUS_LABELS[value.toLowerCase()] ?? value;
  }
}
