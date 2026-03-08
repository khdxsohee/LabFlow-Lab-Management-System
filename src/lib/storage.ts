import { Test, Booking, Settings } from '../types';

const STORAGE_KEYS = {
  TESTS: 'labflow_tests',
  BOOKINGS: 'labflow_bookings',
  SETTINGS: 'labflow_settings'
};

const DEFAULT_TESTS: Test[] = [
  { id: 1, name: "Complete Blood Count (CBC)", price: 800, category: "Hematology" },
  { id: 2, name: "Blood Sugar (Fasting)", price: 300, category: "Biochemistry" },
  { id: 3, name: "Lipid Profile", price: 1500, category: "Biochemistry" },
  { id: 4, name: "Liver Function Test (LFT)", price: 1200, category: "Biochemistry" },
  { id: 5, name: "Renal Function Test (RFT)", price: 1000, category: "Biochemistry" },
  { id: 6, name: "Thyroid Profile (T3, T4, TSH)", price: 2500, category: "Hormones" }
];

const DEFAULT_SETTINGS: Settings = {
  lab_name: "LabFlow Diagnostics",
  lab_address: "123 Health Street, Medical District, Karachi",
  lab_phone: "021-3456789",
  whatsapp_template: "Assalam-o-Alaikum {patient_name}, Aapki lab report tayyar hai. Booking ID: {booking_id}. Total Amount: PKR {total_amount}. Shukriya!"
};

export const storage = {
  getTests: (): Test[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TESTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(DEFAULT_TESTS));
      return DEFAULT_TESTS;
    }
    return JSON.parse(data);
  },

  saveTest: (test: Omit<Test, 'id'>): Test => {
    const tests = storage.getTests();
    const newTest = { ...test, id: Date.now() };
    tests.push(newTest);
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
    return newTest;
  },

  deleteTest: (id: number) => {
    const tests = storage.getTests().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  },

  getBookings: (): Booking[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },

  saveBooking: (booking: Omit<Booking, 'id' | 'status' | 'created_at'> & { items: any[] }): Booking => {
    const bookings = storage.getBookings();
    const testNames = booking.items.map((i: any) => i.name).join(', ');
    const newBooking: Booking = {
      id: Date.now(),
      reg_id: booking.reg_id,
      patient_name: booking.patient_name,
      whatsapp: booking.whatsapp,
      total_amount: booking.total_amount,
      status: 'Pending',
      created_at: new Date().toISOString(),
      delivery_date: booking.delivery_date,
      test_names: testNames
    };
    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return newBooking;
  },

  updateBookingStatus: (id: number, status: 'Pending' | 'Delivered') => {
    const bookings = storage.getBookings().map(b => 
      b.id === id ? { ...b, status } : b
    );
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  deleteBooking: (id: number) => {
    const bookings = storage.getBookings().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  getSettings: (): Settings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
  },

  saveSettings: (settings: Settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  exportData: () => {
    const data = {
      tests: storage.getTests(),
      bookings: storage.getBookings(),
      settings: storage.getSettings(),
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `labflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importData: async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.tests && Array.isArray(data.tests)) {
        localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(data.tests));
      }
      if (data.bookings && Array.isArray(data.bookings)) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data.bookings));
      }
      if (data.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
};
