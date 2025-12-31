export interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  color: string | null;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export const MENU_CATEGORIES = [
  "Juices",
  "Smoothies", 
  "Milkshakes",
  "Mocktails",
  "Specials"
] as const;

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  isParcel: boolean;
  parcelQuantity: number;
}

export interface Bill {
  id: string;
  bill_number: number;
  date_time: string;
  business_date: string;
  subtotal: number;
  total_parcel_collected: number;
  total_amount: number;
  payment_method: 'Cash' | 'UPI';
  apply_parcel_to_all: boolean;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  menu_item_id: string;
  quantity: number;
  price_per_unit: number;
  line_subtotal: number;
  is_parcel: boolean;
  parcel_quantity: number;
  parcel_charge_per_unit: number;
  parcel_total: number;
  line_total: number;
  created_at: string;
}

export type PaymentMethod = 'Cash' | 'UPI';