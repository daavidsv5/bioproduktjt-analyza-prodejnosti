export interface SaleRecord {
  product_name: string;

  quantity: number;
  price_no_vat: number;
  price_vat: number;
  currency: string;
  date: string;
  status: string;
}

export interface ProductSummary {
  product_name: string;
  total_quantity: number;
  total_price_no_vat: number;
  total_price_vat: number;
}

export type SortField = 'product_name' | 'total_quantity' | 'total_price_no_vat' | 'total_price_vat';
export type SortDirection = 'asc' | 'desc';
export type Market = 'ALL' | 'CZ' | 'SK';
