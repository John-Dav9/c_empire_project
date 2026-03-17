export class CreateGrillMenuPackItemDto {
  productId: string;
  qty: number;
}

export class CreateGrillMenuPackDto {
  title: string;
  description?: string;
  price: number;
  currency?: string; // default XAF
  isAvailable?: boolean;
  images?: string[];

  items: CreateGrillMenuPackItemDto[];
}
