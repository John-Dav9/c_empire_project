import { Component } from '@angular/core';
import { GenericCrudComponent, EntityConfig } from '../shared/generic-crud.component';
import { buildApiUrl } from '../../../core/config/api.config';

@Component({
  selector: 'app-todo-services',
  standalone: true,
  imports: [GenericCrudComponent],
  template: '<app-generic-crud [config]="config"></app-generic-crud>'
})
export class TodoServicesComponent {
  config: EntityConfig = {
    title: 'Services C\'Todo',
    icon: '⚙️',
    apiUrl: buildApiUrl('/admin/c-todo/services'),
    displayFields: ['name', 'description', 'basePrice', 'category'],
    fields: [
      { name: 'name', label: 'Nom du service', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'basePrice', label: 'Prix de base (FCFA)', type: 'number', required: true },
      { name: 'category', label: 'Catégorie', type: 'select', required: true, options: [
        { value: 'plumbing', label: 'Plomberie' },
        { value: 'electrical', label: 'Électricité' },
        { value: 'painting', label: 'Peinture' },
        { value: 'carpentry', label: 'Menuiserie' },
        { value: 'other', label: 'Autre' }
      ]},
      { name: 'imageUrl', label: 'URL Image', type: 'url' }
    ]
  };
}
