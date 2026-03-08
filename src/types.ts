export interface Test {
  id: number;
  name: string;
  price: number;
  category: string;
}

export interface Booking {
  id: number;
  reg_id?: string;
  patient_name: string;
  whatsapp: string;
  total_amount: number;
  status: 'Pending' | 'Delivered';
  created_at: string;
  delivery_date: string;
  test_names?: string;
}

export interface BookingItem {
  id: number;
  booking_id: number;
  test_id: number;
  test_name: string;
  price: number;
}

export interface Settings {
  lab_name: string;
  lab_address: string;
  lab_phone: string;
  whatsapp_template: string;
  security_pin?: string;
}
