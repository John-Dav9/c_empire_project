import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface InitPaymentRequest {
  referenceType: string;
  referenceId: string;
  provider: string;
  userId?: string;
  currency?: string;
  metadata?: any;
}

export interface PaymentResponse {
  paymentId: string;
  amount: number;
  currency: string;
  redirectUrl?: string;
  instructions?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private apiService: ApiService) {}

  initPayment(request: InitPaymentRequest): Observable<PaymentResponse> {
    return this.apiService.post<PaymentResponse>('/payments/init', request);
  }

  verifyPayment(providerTransactionId: string): Observable<any> {
    return this.apiService.post<any>('/payments/verify', { providerTransactionId });
  }

  handleWebhook(provider: string, payload: any): Observable<any> {
    return this.apiService.post<any>(`/payments/webhook/${provider}`, payload);
  }
}
