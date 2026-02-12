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
    displayFields: ['name', 'description', 'basePrice', 'category'],
    fields: [
      { name: 'name', label: 'Nom du service', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'basePrice', label: 'Prix de base (FCFA)', type: 'number', required: true },
      { name: 'category', label: 'Catégorie', type: 'select', required: true, options: [
        { value: 'house', label: 'Maison' },
        { value: 'office', label: 'Bureau' },
        { value: 'deep', label: 'Nettoyage Profond' },
        { value: 'move', label: 'Déménagement' }
      ]},
      { name: 'imageUrl', label: 'URL Image', type: 'url' }
    ]
  };
}
