export type Supplier = {
  id:           number;
  store:        number;
  name:         string;
  contact_name: string;
  email:        string;
  phone:        string;
  notes:        string;
  is_active:    boolean;
  created_at:   string;
  updated_at:   string;
};

export type CreateSupplierPayload = {
  store_id:     number;
  name:         string;
  contact_name?: string;
  email?:        string;
  phone?:        string;
  notes?:        string;
};

export type UpdateSupplierPayload = {
  name?:         string;
  contact_name?: string;
  email?:        string;
  phone?:        string;
  notes?:        string;
};
