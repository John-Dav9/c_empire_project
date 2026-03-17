export class UpdateGrillProductDto {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  isAvailable?: boolean;
  stockQty?: number;
  images?: string[];
}
