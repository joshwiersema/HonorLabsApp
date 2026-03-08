export interface WcSetting {
  id: string;
  label: string;
  description: string;
  value: string;
  type:
    | 'text'
    | 'select'
    | 'checkbox'
    | 'textarea'
    | 'number'
    | 'color'
    | 'email'
    | 'url'
    | 'image'
    | 'multiselect';
  options?: Record<string, string>;
  default: string;
  tip?: string;
}

export type WcSettingsGroupId =
  | 'general'
  | 'products'
  | 'tax'
  | 'shipping'
  | 'checkout'
  | 'email';

export interface WcSettingsGroup {
  id: WcSettingsGroupId;
  label: string;
  description: string;
  settings: WcSetting[];
}

export interface StoreInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  currency: string;
  currency_symbol: string;
}

/** The setting IDs we care about per group. */
export const IMPORTANT_SETTINGS: Record<string, string[]> = {
  general: [
    'woocommerce_store_address',
    'woocommerce_store_address_2',
    'woocommerce_store_city',
    'woocommerce_store_postcode',
    'woocommerce_default_country',
    'woocommerce_currency',
    'woocommerce_currency_pos',
    'woocommerce_price_thousand_sep',
    'woocommerce_price_decimal_sep',
    'woocommerce_price_num_decimals',
  ],
  products: [
    'woocommerce_shop_page_display',
    'woocommerce_default_catalog_orderby',
    'woocommerce_weight_unit',
    'woocommerce_dimension_unit',
    'woocommerce_manage_stock',
    'woocommerce_stock_email_recipient',
    'woocommerce_notify_low_stock_amount',
    'woocommerce_notify_no_stock_amount',
    'woocommerce_hide_out_of_stock_items',
  ],
  tax: [
    'woocommerce_calc_taxes',
    'woocommerce_prices_include_tax',
    'woocommerce_tax_based_on',
    'woocommerce_shipping_tax_class',
    'woocommerce_tax_round_at_subtotal',
    'woocommerce_tax_display_shop',
    'woocommerce_tax_display_cart',
  ],
  shipping: [],
  checkout: [],
  email: [
    'woocommerce_email_from_name',
    'woocommerce_email_from_address',
    'woocommerce_email_header_image',
    'woocommerce_email_footer_text',
    'woocommerce_email_base_color',
    'woocommerce_email_background_color',
    'woocommerce_email_body_background_color',
    'woocommerce_email_text_color',
  ],
};

export const GROUP_LABELS: Record<WcSettingsGroupId, string> = {
  general: 'General',
  products: 'Products',
  tax: 'Tax',
  shipping: 'Shipping',
  checkout: 'Checkout',
  email: 'Email',
};
