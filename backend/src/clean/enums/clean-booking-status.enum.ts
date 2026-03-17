export enum CleanBookingStatus {
  DRAFT = 'DRAFT', // créé mais pas payé
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED', // payé + confirmé
  ASSIGNED = 'ASSIGNED', // agent assigné
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}
