import { Injectable } from '@nestjs/common';
import { EventCategory } from '../enums/event-category.enum';

@Injectable()
export class EventAiService {
  /**
   * Suggère un type d’événement selon un besoin utilisateur
   */
  suggestEventCategory(userNeed: string): EventCategory {
    const need = userNeed.toLowerCase();

    if (need.includes('mariage')) return EventCategory.MARIAGE;
    if (need.includes('bapt')) return EventCategory.BAPTEME;
    if (need.includes('anniv')) return EventCategory.ANNIVERSAIRE;
    if (need.includes('deuil')) return EventCategory.DEUIL;
    if (need.includes('souten')) return EventCategory.SOUTENANCE;
    if (need.includes('conf')) return EventCategory.CONFERENCE;
    if (need.includes('semin')) return EventCategory.SEMINAIRE;

    return EventCategory.SURPRISE;
  }

  /**
   * Génère une checklist simple selon le type d’événement
   */
  generateChecklist(category: EventCategory): string[] {
    switch (category) {
      case EventCategory.MARIAGE:
        return [
          'Définir la date et le budget',
          'Choisir la salle',
          'Décoration',
          'Traiteur',
          'Animation / musique',
          'Photographe',
          'Invitations',
        ];

      case EventCategory.ANNIVERSAIRE:
        return ['Choisir le thème', 'Lieu', 'Gâteau', 'Invités', 'Animation'];

      case EventCategory.CONFERENCE:
        return [
          'Réservation de salle',
          'Matériel audio-visuel',
          'Invitations / inscriptions',
          'Intervenants',
          'Accueil participants',
        ];

      default:
        return [
          'Définir les besoins',
          'Choisir la date',
          'Lieu',
          'Prestataires',
          'Validation finale',
        ];
    }
  }

  /**
   * Génère un planning basique
   */
  generatePlanning(category: EventCategory): Record<string, string> {
    return {
      'J-30': 'Validation du concept et budget',
      'J-15': 'Confirmation des prestataires',
      'J-7': 'Validation logistique',
      'J-1': 'Préparation finale',
      'Jour J': 'Déroulement de l’événement',
    };
  }

  /**
   * Suggère des idées de décoration
   */
  suggestDecorationIdeas(category: EventCategory): string[] {
    if (category === EventCategory.MARIAGE) {
      return [
        'Fleurs blanches',
        'Bougies',
        'Lumières tamisées',
        'Tissus élégants',
      ];
    }

    if (category === EventCategory.ANNIVERSAIRE) {
      return ['Ballons', 'Bannière personnalisée', 'Éclairage festif'];
    }

    return ['Décoration sobre', 'Couleurs neutres', 'Éléments personnalisés'];
  }
}
