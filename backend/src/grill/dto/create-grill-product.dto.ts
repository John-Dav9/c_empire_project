export class CreateGrillProductDto {
  title: string;
  description?: string;
  price: number;
  currency?: string; // default XAF
  category?: string;
  isAvailable?: boolean;
  stockQty?: number;
  images?: string[];
}
