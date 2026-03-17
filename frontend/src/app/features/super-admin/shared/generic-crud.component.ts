import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

export interface EntityField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'url'
    | 'url-list'
    | 'file-list';
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
  listUrl?: string;
  createUrl?: string;
  updateUrl?: string;
  deleteUrl?: string;
  uploadUrl?: string;
  idField?: string;
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
  uploadingFiles = false;
  editingItem: any = null;
  formData: any = {};

  ngOnInit() {
    this.initFormData();
    this.loadItems();
  }

  initFormData() {
    this.formData = {};
    this.config.fields.forEach(field => {
      this.formData[field.name] =
        field.type === 'checkbox'
          ? true
          : field.type === 'number'
            ? 0
            : field.type === 'url-list' || field.type === 'file-list'
              ? ['']
              : '';
    });
  }

  loadItems() {
    this.loading = true;
    this.error = null;
    this.http.get<any[]>(this.resolveListUrl()).subscribe({
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
    this.config.fields.forEach((field) => {
      if (field.type !== 'url-list' && field.type !== 'file-list') return;
      const current = this.formData[field.name];
      if (Array.isArray(current)) {
        this.formData[field.name] = current.length > 0 ? current : [''];
        return;
      }
      this.formData[field.name] = current ? [String(current)] : [''];
    });
    this.showModal = true;
  }

  saveItem() {
    this.saving = true;
    const payload = this.buildPayload();
    const itemId = this.editingItem?.[this.resolveIdField()];
    const request = this.editingItem
      ? this.http.patch(`${this.resolveUpdateUrl()}/${itemId}`, payload)
      : this.http.post(this.resolveCreateUrl(), payload);

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
      this.http.delete(`${this.resolveDeleteUrl()}/${id}`).subscribe({
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

  addUrlField(fieldName: string): void {
    const current = this.formData[fieldName];
    if (!Array.isArray(current)) {
      this.formData[fieldName] = [''];
      return;
    }
    current.push('');
  }

  removeUrlField(fieldName: string, index: number): void {
    const current = this.formData[fieldName];
    if (!Array.isArray(current)) return;
    current.splice(index, 1);
    if (current.length === 0) {
      current.push('');
    }
  }

  private buildPayload(): Record<string, unknown> {
    const payload = { ...this.formData } as Record<string, unknown>;

    this.config.fields.forEach((field) => {
      if (field.type !== 'url-list' && field.type !== 'file-list') return;
      const raw = payload[field.name];
      const list = Array.isArray(raw)
        ? raw
            .map((value) => String(value ?? '').trim())
            .filter((value) => value.length > 0)
        : [];
      payload[field.name] = list;
    });

    return payload;
  }

  onFilesSelected(fieldName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const requestBody = new FormData();
    Array.from(input.files).forEach((file) => requestBody.append('files', file));

    this.uploadingFiles = true;
    this.http
      .post<{ files: string[] }>(this.resolveUploadUrl(), requestBody)
      .pipe(finalize(() => (this.uploadingFiles = false)))
      .subscribe({
        next: (response) => {
          const existing = Array.isArray(this.formData[fieldName])
            ? this.formData[fieldName]
            : [];
          const cleaned = existing.filter(
            (value: unknown) => String(value ?? '').trim().length > 0,
          );
          this.formData[fieldName] = [...cleaned, ...(response.files ?? [])];
          input.value = '';
        },
        error: () => {
          this.error = "Erreur lors de l'upload des images";
        },
      });
  }

  removeListItem(fieldName: string, index: number): void {
    this.removeUrlField(fieldName, index);
  }

  private resolveIdField(): string {
    return this.config.idField || 'id';
  }

  private resolveListUrl(): string {
    return this.config.listUrl || this.config.apiUrl;
  }

  private resolveCreateUrl(): string {
    return this.config.createUrl || this.config.apiUrl;
  }

  private resolveUpdateUrl(): string {
    return this.config.updateUrl || this.config.apiUrl;
  }

  private resolveDeleteUrl(): string {
    return this.config.deleteUrl || this.config.apiUrl;
  }

  private resolveUploadUrl(): string {
    return this.config.uploadUrl || `${this.config.apiUrl}/upload-images`;
  }
}
