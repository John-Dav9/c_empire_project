import { Component } from '@angular/core';
import { GenericCrudComponent, EntityConfig } from '../shared/generic-crud.component';
import { buildApiUrl } from '../../../core/config/api.config';

@Component({
  selector: 'app-sectors',
  standalone: true,
  imports: [GenericCrudComponent],
  template: '<app-generic-crud [config]="config"></app-generic-crud>'
})
export class SectorsComponent {
  config: EntityConfig = {
    title: 'Gestion des Secteurs',
    icon: '🏢',
    apiUrl: buildApiUrl('/sectors'),
    displayFields: ['name', 'code', 'description'],
    fields: [
      { name: 'name', label: 'Nom du secteur', type: 'text', required: true },
      { name: 'code', label: 'Code (ex: CSHOP)', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'iconUrl', label: 'URL Icône', type: 'url' }
    ]
  };
}
