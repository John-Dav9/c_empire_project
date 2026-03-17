export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  promoPrice?: number | null;
  currency: string;
  stock: number;
  isActive: boolean;
  categories?: string[];
  images?: string[];
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
}
