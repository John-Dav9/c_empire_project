import { Component } from '@angular/core';
import { GenericCrudComponent, EntityConfig } from '../shared/generic-crud.component';
import { buildApiUrl } from '../../../core/config/api.config';

@Component({
  selector: 'app-events-management',
  standalone: true,
  imports: [GenericCrudComponent],
  template: '<app-generic-crud [config]="config"></app-generic-crud>',
})
export class EventsManagementComponent {
  config: EntityConfig = {
    title: "Catalogues C'Events",
    icon: '🎉',
    apiUrl: buildApiUrl('/c-event/events'),
    displayFields: ['title', 'category', 'basePrice', 'isActive'],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'category',
        label: 'Categorie',
        type: 'select',
        required: true,
        options: [
          { value: 'MARIAGE', label: 'Mariage' },
          { value: 'BAPTEME', label: 'Bapteme' },
          { value: 'ANNIVERSAIRE', label: 'Anniversaire' },
          { value: 'DEUIL', label: 'Deuil' },
          { value: 'SOUTENANCE', label: 'Soutenance' },
          { value: 'CONFERENCE', label: 'Conference' },
          { value: 'SEMINAIRE', label: 'Seminaire' },
          { value: 'SURPRISE', label: 'Surprise' },
        ],
      },
      { name: 'basePrice', label: 'Prix de base (FCFA)', type: 'number', required: true },
      { name: 'isActive', label: 'Actif', type: 'checkbox' },
    ],
  };
}

