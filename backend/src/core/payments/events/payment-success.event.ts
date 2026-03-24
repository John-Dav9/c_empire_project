import { PaymentReferenceType } from '../payment-reference-type.enum';
import { PaymentProvider } from '../providers/payment-provider.enum';

export class PaymentSuccessEvent {
  constructor(
    public readonly paymentId: string,
    public readonly referenceType: PaymentReferenceType,
    public readonly referenceId: string,
    public readonly provider: PaymentProvider,
    public readonly amount: number,
    public readonly userId?: string,
  ) {}
}
