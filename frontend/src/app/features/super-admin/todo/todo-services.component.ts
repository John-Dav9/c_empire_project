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
    displayFields: ['title', 'description', 'basePrice', 'isActive'],
    fields: [
      { name: 'title', label: 'Nom du service', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'basePrice', label: 'Prix de base (FCFA)', type: 'number', required: true },
      { name: 'isActive', label: 'Actif', type: 'checkbox' },
    ]
  };
}
