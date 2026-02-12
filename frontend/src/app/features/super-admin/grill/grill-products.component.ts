import { Component } from '@angular/core';
import { GenericCrudComponent, EntityConfig } from '../shared/generic-crud.component';
import { buildApiUrl } from '../../../core/config/api.config';

@Component({
  selector: 'app-grill-products',
  standalone: true,
  imports: [GenericCrudComponent],
  template: '<app-generic-crud [config]="config"></app-generic-crud>'
})
export class GrillProductsComponent {
  config: EntityConfig = {
    title: 'Produits C\'Grill',
    icon: '🍖',
    apiUrl: buildApiUrl('/grill/products'),
    displayFields: ['name', 'description', 'price', 'category', 'isAvailable'],
    fields: [
      { name: 'name', label: 'Nom du produit', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'price', label: 'Prix (FCFA)', type: 'number', required: true },
      { name: 'category', label: 'Catégorie', type: 'select', required: true, options: [
        { value: 'grilled', label: 'Grillades' },
        { value: 'sides', label: 'Accompagnements' },
        { value: 'drinks', label: 'Boissons' },
        { value: 'desserts', label: 'Desserts' }
      ]},
      { name: 'imageUrl', label: 'URL Image', type: 'url' },
      { name: 'isAvailable', label: 'Disponible', type: 'checkbox' }
    ]
  };
}
