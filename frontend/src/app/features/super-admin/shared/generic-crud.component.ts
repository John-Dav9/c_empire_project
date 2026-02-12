import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface EntityField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'url';
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface EntityConfig {
  title: string;
  icon: string;
  apiUrl: string;
  fields: EntityField[];
  displayFields: string[];
  searchPlaceholder?: string;
}

@Component({
  selector: 'app-generic-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generic-crud.component.html',
  styleUrls: ['./generic-crud.component.scss']
})
export class GenericCrudComponent implements OnInit {
  @Input() config!: EntityConfig;
  
  private http = inject(HttpClient);

  items: any[] = [];
  loading = false;
  error: string | null = null;
  showModal = false;
  saving = false;
  editingItem: any = null;
  formData: any = {};

  ngOnInit() {
    this.initFormData();
    this.loadItems();
  }

  initFormData() {
    this.formData = {};
    this.config.fields.forEach(field => {
      this.formData[field.name] = field.type === 'checkbox' ? true : 
                                   field.type === 'number' ? 0 : '';
    });
  }

  loadItems() {
    this.loading = true;
    this.error = null;
    this.http.get<any[]>(this.config.apiUrl).subscribe({
      next: (data) => {
        this.items = Array.isArray(data) ? data : (data as any).data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  openAddModal() {
    this.initFormData();
    this.editingItem = null;
    this.showModal = true;
  }

  editItem(item: any) {
    this.editingItem = item;
    this.formData = { ...item };
    this.showModal = true;
  }

  saveItem() {
    this.saving = true;
    const request = this.editingItem
      ? this.http.patch(`${this.config.apiUrl}/${this.editingItem.id}`, this.formData)
      : this.http.post(this.config.apiUrl, this.formData);

    request.subscribe({
      next: () => {
        this.showModal = false;
        this.loadItems();
        this.saving = false;
      },
      error: (err) => {
        this.error = 'Erreur lors de l\'enregistrement';
        this.saving = false;
      }
    });
  }

  deleteItem(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      this.http.delete(`${this.config.apiUrl}/${id}`).subscribe({
        next: () => this.loadItems(),
        error: (err) => this.error = 'Erreur lors de la suppression'
      });
    }
  }

  getValue(item: any, field: string): any {
    return item[field] ?? 'N/A';
  }

  getFieldLabel(fieldName: string): string {
    const field = this.config.fields.find(f => f.name === fieldName);
    return field?.label || fieldName;
  }
}
