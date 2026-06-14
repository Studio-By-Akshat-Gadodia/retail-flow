export interface Product {
  id:            number;
  name:          string;
  sku:           string;
  category:      string;
  quantity:      number;
  unit_price:    string;
  reorder_level: number;
  store:         number;
  is_active:     boolean;
  created_at:    string;
  updated_at:    string;
}

export interface CreateProductPayload {
  store_id:      number;
  name:          string;
  sku:           string;
  category:      string;
  quantity:      number;
  unit_price:    string | number;
  reorder_level: number;
}

export interface UpdateProductPayload {
  name?:          string;
  sku?:           string;
  category?:      string;
  quantity?:      number;
  unit_price?:    string | number;
  reorder_level?: number;
}