export class UpdateGrillMenuPackDto {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  isAvailable?: boolean;
  images?: string[];

  // si fourni, on remplace la composition entière
  items?: { productId: string; qty: number }[];
}
