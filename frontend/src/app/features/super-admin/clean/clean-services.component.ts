import { Component } from '@angular/core';
import { GenericCrudComponent, EntityConfig } from '../shared/generic-crud.component';
import { buildApiUrl } from '../../../core/config/api.config';

@Component({
  selector: 'app-clean-services',
  standalone: true,
  imports: [GenericCrudComponent],
  template: '<app-generic-crud [config]="config"></app-generic-crud>'
})
export class CleanServicesComponent {
  config: EntityConfig = {
    title: 'Services C\'Clean',
    icon: '✨',
    apiUrl: buildApiUrl('/cclean/services'),
    listUrl: buildApiUrl('/cclean/services?includeInactive=true'),
    displayFields: ['title', 'description', 'basePrice', 'type', 'isActive'],
    fields: [
      { name: 'title', label: 'Nom du service', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'basePrice', label: 'Prix de base (FCFA)', type: 'number', required: true },
      { name: 'type', label: 'Type de service', type: 'select', required: true, options: [
        { value: 'HOME', label: 'Maison' },
        { value: 'OFFICE', label: 'Bureau' },
        { value: 'CONSTRUCTION', label: 'Chantier' },
        { value: 'AFTER_EVENT', label: 'Après événement' },
        { value: 'MOVE_OUT', label: 'Après déménagement' },
        { value: 'DISINFECTION', label: 'Désinfection' },
        { value: 'WINDOWS', label: 'Vitres' },
        { value: 'PERIODIC', label: 'Entretien périodique' }
      ]},
      { name: 'estimatedDurationMin', label: 'Durée estimée (min)', type: 'number' },
      { name: 'currency', label: 'Devise', type: 'text' },
      { name: 'isActive', label: 'Actif', type: 'checkbox' },
      { name: 'imageUrl', label: 'URL Image', type: 'url' }
    ]
  };
}
