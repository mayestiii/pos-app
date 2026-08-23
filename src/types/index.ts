export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
  discount?: number; // percentage
}

export interface SaleMetadata {
  date: Date;
  seller: string;
}
