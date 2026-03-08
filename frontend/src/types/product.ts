export interface WcProductImage {
  id: number;
  date_created: string;
  date_modified: string;
  src: string;
  name: string;
  alt: string;
}

export interface WcProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WcProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock: boolean;
  categories: WcProductCategory[];
  images: WcProductImage[];
  date_created: string;
  date_modified: string;
  total_sales: number;
  wholesale_regular_price?: string;
  wholesale_sale_price?: string;
  meta_data: Array<{ id: number; key: string; value: string }>;
}

export interface ProductUpdatePayload {
  name?: string;
  description?: string;
  short_description?: string;
  regular_price?: string;
  sale_price?: string;
  sku?: string;
  stock_quantity?: number;
  stock_status?: string;
  manage_stock?: boolean;
  wholesale_regular_price?: string;
  wholesale_sale_price?: string;
}
