import { Component } from '@angular/core';
import { GenericCrudComponent, EntityConfig } from '../shared/generic-crud.component';
import { buildApiUrl } from '../../../core/config/api.config';

@Component({
  selector: 'app-grill-menus',
  standalone: true,
  imports: [GenericCrudComponent],
  template: '<app-generic-crud [config]="config"></app-generic-crud>'
})
export class GrillMenusComponent {
  config: EntityConfig = {
    title: 'Menus C\'Grill',
    icon: '🍱',
    apiUrl: buildApiUrl('/grill/menu-packs'),
    displayFields: ['name', 'description', 'price', 'isAvailable'],
    fields: [
      { name: 'name', label: 'Nom du menu', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'price', label: 'Prix (FCFA)', type: 'number', required: true },
      { name: 'imageUrl', label: 'URL Image', type: 'url' },
      { name: 'isAvailable', label: 'Disponible', type: 'checkbox' }
    ]
  };
}
