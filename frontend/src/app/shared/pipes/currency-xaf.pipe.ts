import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formate un montant en XAF : 15000 → "15 000 XAF"
 * Usage : {{ amount | currencyXaf }}
 */
@Pipe({
  name: 'currencyXaf',
})
export class CurrencyXafPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '—';
    const num = Number(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' XAF';
  }
}
