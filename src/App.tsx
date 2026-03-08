import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Printer, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  Trash2, 
  ChevronRight,
  FlaskConical,
  Users,
  ClipboardList,
  LayoutDashboard,
  X,
  Settings as SettingsIcon,
  TrendingUp,
  Download,
  Calendar,
  Upload,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Test, Booking, Settings } from './types';
import { storage } from './lib/storage';

const PinLockScreen = ({ correctPin, onUnlock }: { correctPin: string, onUnlock: () => void }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (val: string) => {
    if (input.length < 5) {
      const next = input + val;
      setInput(next);
      if (next.length === 5) {
        if (next === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setInput('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6">
      <motion.div 
        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="w-full max-w-xs text-center space-y-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Enter Security PIN</h2>
          <p className="text-slate-400 text-sm">Please enter your 5-digit PIN to continue</p>
        </div>

        <div className="flex justify-center gap-3">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < input.length 
                  ? 'bg-emerald-500 border-emerald-500 scale-110' 
                  : 'border-slate-700'
              } ${error ? 'bg-red-500 border-red-500' : ''}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKey(num.toString())}
              className="w-16 h-16 rounded-full bg-slate-800 text-white text-2xl font-bold hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center mx-auto"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKey('0')}
            className="w-16 h-16 rounded-full bg-slate-800 text-white text-2xl font-bold hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center mx-auto"
          >
            0
          </button>
          <button
            onClick={() => setInput(input.slice(0, -1))}
            className="w-16 h-16 rounded-full bg-slate-800/50 text-slate-400 text-xl hover:bg-slate-800 hover:text-white active:scale-95 transition-all flex items-center justify-center mx-auto"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'tests' | 'settings'>('dashboard');
  const [tests, setTests] = useState<Test[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<Settings>({
    lab_name: 'LabFlow Diagnostics',
    lab_address: '',
    lab_phone: '',
    whatsapp_template: '',
    security_pin: ''
  });
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Delivered'>('All');

  // New Booking Form State
  const [newPatient, setNewPatient] = useState({
    reg_id: '',
    name: '',
    whatsapp: '',
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    selectedTests: [] as Test[]
  });

  // New Test Form State
  const [newTest, setNewTest] = useState({
    name: '',
    price: '',
    category: 'General'
  });

  // Receipt State
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = storage.getSettings();
    setSettings(s);
    if (s.security_pin) {
      setIsUnlocked(false);
    }
    setTests(storage.getTests());
    setBookings(storage.getBookings());
  }, []);

  const fetchTests = () => {
    setTests(storage.getTests());
  };

  const fetchBookings = () => {
    setBookings(storage.getBookings());
  };

  const fetchSettings = () => {
    setSettings(storage.getSettings());
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(settings);
    alert('Settings saved successfully!');
    fetchSettings();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('Kya aap sure hain? Is se aapka purana data khatam ho jaye ga aur backup wala data load ho jaye ga.')) {
      const success = await storage.importData(file);
      if (success) {
        alert('Data kamyabi se restore ho gaya hai!');
        fetchTests();
        fetchBookings();
        fetchSettings();
      } else {
        alert('Data restore karne mein masla hua. File check karein.');
      }
    }
    // Reset input
    e.target.value = '';
  };

  const handleExport = () => {
    storage.exportData();
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPatient.selectedTests.length === 0) return alert('Please select at least one test');

    const total = newPatient.selectedTests.reduce((sum, t) => sum + t.price, 0);
    
    const newBooking = storage.saveBooking({
      reg_id: newPatient.reg_id,
      patient_name: newPatient.name,
      whatsapp: newPatient.whatsapp,
      total_amount: total,
      delivery_date: newPatient.deliveryDate,
      items: newPatient.selectedTests
    });

    setIsNewBookingModalOpen(false);
    setNewPatient({ reg_id: '', name: '', whatsapp: '', deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], selectedTests: [] });
    fetchBookings();
    setSelectedBookingForReceipt(newBooking);
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      storage.saveTest({
        name: newTest.name,
        price: parseFloat(newTest.price),
        category: newTest.category
      });

      setIsNewTestModalOpen(false);
      setNewTest({ name: '', price: '', category: 'General' });
      fetchTests();
    } catch (error) {
      console.error('Error adding test:', error);
      alert('Error saving test. Please try again.');
    }
  };

  const deleteTest = (id: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    storage.deleteTest(id);
    fetchTests();
  };

  const updateStatus = (id: number, status: 'Pending' | 'Delivered') => {
    storage.updateBookingStatus(id, status);
    fetchBookings();
  };

  const deleteBooking = (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    storage.deleteBooking(id);
    fetchBookings();
  };

  const sendWhatsApp = (booking: Booking) => {
    let message = settings.whatsapp_template || `Assalam-o-Alaikum {patient_name}, Aapki lab report tayyar hai. Booking ID: {booking_id}. Total Amount: PKR {total_amount}. Shukriya!`;
    
    message = message
      .replace('{patient_name}', booking.patient_name)
      .replace('{booking_id}', booking.id.toString())
      .replace('{total_amount}', booking.total_amount.toString());

    const url = `https://wa.me/${booking.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Reg ID', 'Patient Name', 'WhatsApp', 'Amount', 'Status', 'Date', 'Tests'];
    const rows = bookings.map(b => [
      b.id,
      b.reg_id || '',
      b.patient_name,
      b.whatsapp,
      b.total_amount,
      b.status,
      new Date(b.created_at).toLocaleDateString(),
      b.test_names
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lab_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.whatsapp.includes(searchQuery) ||
                         (b.reg_id && b.reg_id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    delivered: bookings.filter(b => b.status === 'Delivered').length,
    revenue: bookings.reduce((sum, b) => sum + b.total_amount, 0),
    todayRevenue: bookings
      .filter(b => new Date(b.created_at).toDateString() === new Date().toDateString())
      .reduce((sum, b) => sum + b.total_amount, 0)
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isUnlocked && settings.security_pin) {
    return <PinLockScreen correctPin={settings.security_pin} onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen print:hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-emerald-600">
            <FlaskConical className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">LabFlow</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'bookings' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardList className="w-5 h-5" />
            Bookings
          </button>
          <button 
            onClick={() => setActiveTab('tests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FlaskConical className="w-5 h-5" />
            Test Catalog
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <SettingsIcon className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current User</p>
            <p className="text-sm font-semibold text-slate-700">Lab Administrator</p>
          </div>
          <div className="text-center">
            <a 
              href="https://khalid-software-house.web.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-slate-400 hover:text-emerald-600 transition-colors font-medium"
            >
              Powered by <span className="font-bold">Khalid Software House</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto print:p-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 sticky top-0 z-10 flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <p className="text-slate-500 text-sm">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'bookings' && (
              <button 
                onClick={exportToCSV}
                className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
            {activeTab === 'tests' && (
              <button 
                onClick={() => setIsNewTestModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add New Test
              </button>
            )}
            <button 
              onClick={() => setIsNewBookingModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Booking
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto print:p-0">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Bookings" value={stats.total} icon={<Users className="text-blue-600" />} color="blue" />
                <StatCard title="Today's Revenue" value={`PKR ${stats.todayRevenue.toLocaleString()}`} icon={<TrendingUp className="text-emerald-600" />} color="emerald" />
                <StatCard title="Pending Tests" value={stats.pending} icon={<Clock className="text-amber-600" />} color="amber" />
                <StatCard title="Total Revenue" value={`PKR ${stats.revenue.toLocaleString()}`} icon={<TrendingUp className="text-blue-600" />} color="blue" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Recent Bookings</h3>
                    <button onClick={() => setActiveTab('bookings')} className="text-emerald-600 text-sm font-medium hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-6 py-4">Patient</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.slice(0, 5).map(booking => (
                          <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800">{booking.patient_name}</div>
                              <div className="text-xs text-slate-500">{booking.whatsapp}</div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                              ₨ {booking.total_amount}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${booking.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => setSelectedBookingForReceipt(booking)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                                <Printer className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Stats / Info */}
                <div className="space-y-6">
                  <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100">
                    <h4 className="font-bold text-lg mb-2">Lab Information</h4>
                    <div className="space-y-3 text-emerald-50 text-sm">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 opacity-70" />
                        {settings.lab_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 opacity-70" />
                        {settings.lab_phone}
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 mt-0.5 opacity-70" />
                        {settings.lab_address}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4">Popular Tests</h4>
                    <div className="space-y-4">
                      {tests.slice(0, 3).map(test => (
                        <div key={test.id} className="flex justify-between items-center">
                          <div className="text-sm font-medium text-slate-700">{test.name}</div>
                          <div className="text-xs font-bold text-emerald-600">₨ {test.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or number..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  {['All', 'Pending', 'Delivered'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status as any)}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === status ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings List */}
              <div className="grid grid-cols-1 gap-4">
                {filteredBookings.map(booking => (
                  <motion.div 
                    layout
                    key={booking.id} 
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold text-slate-800">{booking.patient_name}</h4>
                          {booking.reg_id && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                              REG: {booking.reg_id}
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${booking.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 text-emerald-500" />
                            {booking.whatsapp}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-500" />
                            Booked: {new Date(booking.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ChevronRight className="w-4 h-4 text-purple-500" />
                            Delivery: {new Date(booking.delivery_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 italic">
                          {booking.test_names}
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-between items-end gap-4">
                        <div className="text-2xl font-bold text-slate-800">₨ {booking.total_amount}</div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => sendWhatsApp(booking)}
                            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                            title="Send WhatsApp"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setSelectedBookingForReceipt(booking)}
                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                            title="Print Receipt"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          {booking.status === 'Pending' ? (
                            <button 
                              onClick={() => updateStatus(booking.id, 'Delivered')}
                              className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                              title="Mark as Delivered"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => updateStatus(booking.id, 'Pending')}
                              className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                              title="Mark as Pending"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteBooking(booking.id)}
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Available Tests</h3>
                <button 
                  onClick={() => setIsNewTestModalOpen(true)}
                  className="text-emerald-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Test
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Test Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price (PKR)</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tests.map(test => (
                      <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{test.name}</td>
                        <td className="px-6 py-4 text-slate-500">{test.category}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">₨ {test.price}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteTest(test.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">System Settings</h3>
                <p className="text-sm text-slate-500">Configure your lab details and message templates.</p>
              </div>
              <form onSubmit={saveSettings} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Laboratory Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={settings.lab_name}
                      onChange={e => setSettings({...settings, lab_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Address</label>
                    <textarea 
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={settings.lab_address}
                      onChange={e => setSettings({...settings, lab_address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Contact Number</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={settings.lab_phone}
                      onChange={e => setSettings({...settings, lab_phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex justify-between">
                      WhatsApp Message Template
                      <span className="text-[10px] text-slate-400 font-normal">Use {`{patient_name}`}, {`{booking_id}`}, {`{total_amount}`}</span>
                    </label>
                    <textarea 
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                      value={settings.whatsapp_template}
                      onChange={e => setSettings({...settings, whatsapp_template: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Security PIN (5 Digits)</label>
                    <input 
                      type="password" 
                      maxLength={5}
                      placeholder="Leave empty to disable"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={settings.security_pin || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setSettings({...settings, security_pin: val});
                      }}
                    />
                    <p className="text-[10px] text-slate-400">App open karne par ye PIN manga jaye ga. Khali chorne se PIN khatam ho jaye gi.</p>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98]"
                >
                  Save All Settings
                </button>
              </form>

              <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800">Data Management</h4>
                <p className="text-xs text-slate-500">Apne data ka backup lein ya purana backup restore karein.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Backup Data (JSON)
                  </button>
                  
                  <label className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Restore Data (JSON)
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={handleImport}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New Booking Modal */}
      <AnimatePresence>
        {isNewBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewBookingModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">New Lab Booking</h3>
                <button onClick={() => setIsNewBookingModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddBooking} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Registration ID (Reg ID)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. REG-1001"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={newPatient.reg_id}
                      onChange={e => setNewPatient({...newPatient, reg_id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Patient Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={newPatient.name}
                      onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">WhatsApp Number</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="e.g. 03001234567"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={newPatient.whatsapp}
                      onChange={e => setNewPatient({...newPatient, whatsapp: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Expected Delivery Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={newPatient.deliveryDate}
                      onChange={e => setNewPatient({...newPatient, deliveryDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Select Tests</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {tests.map(test => {
                      const isSelected = newPatient.selectedTests.some(t => t.id === test.id);
                      return (
                        <button
                          key={test.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewPatient({...newPatient, selectedTests: newPatient.selectedTests.filter(t => t.id !== test.id)});
                            } else {
                              setNewPatient({...newPatient, selectedTests: [...newPatient.selectedTests, test]});
                            }
                          }}
                          className={`flex justify-between items-center p-3 rounded-xl border text-sm transition-all ${isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'}`}
                        >
                          <span className="font-medium">{test.name}</span>
                          <span className="font-bold">₨{test.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                  <div className="text-sm text-slate-500">Total Amount</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ₨ {newPatient.selectedTests.reduce((sum, t) => sum + t.price, 0)}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                >
                  Create Booking & Print Receipt
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Test Modal */}
      <AnimatePresence>
        {isNewTestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewTestModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Add New Lab Test</h3>
                <button onClick={() => setIsNewTestModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddTest} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Test Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Blood Sugar"
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={newTest.name}
                    onChange={e => setNewTest({...newTest, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Biochemistry"
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={newTest.category}
                    onChange={e => setNewTest({...newTest, category: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Price (PKR)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="e.g. 500"
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={newTest.price}
                    onChange={e => setNewTest({...newTest, price: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98] mt-4"
                >
                  Save Test
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedBookingForReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:static">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingForReceipt(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-[380px] rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none max-h-[92vh] flex flex-col"
            >
              <div className="p-3 border-b border-slate-100 flex justify-between items-center print:hidden">
                <h3 className="font-bold text-sm text-slate-800">Booking Receipt</h3>
                <button onClick={() => setSelectedBookingForReceipt(null)} className="p-1.5 hover:bg-slate-100 rounded-full">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div ref={printRef} className="p-5 space-y-4 bg-white">
                  <div className="text-center space-y-1">
                    <div className="flex justify-center mb-1">
                      <FlaskConical className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase leading-none">{settings.lab_name}</h2>
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest">{settings.lab_address}</p>
                    <p className="text-[8px] text-slate-500 font-bold">PH: {settings.lab_phone}</p>
                    <div className="h-px bg-slate-200 w-full my-2" />
                  </div>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Patient Name</p>
                    <p className="font-bold text-slate-800">{selectedBookingForReceipt.patient_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Booking ID</p>
                    <p className="font-bold text-slate-800">#{selectedBookingForReceipt.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Registration ID (Reg ID)</p>
                    <p className="font-bold text-slate-800">{selectedBookingForReceipt.reg_id || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp</p>
                    <p className="font-medium text-slate-700">{selectedBookingForReceipt.whatsapp}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Date</p>
                    <p className="font-medium text-slate-700">{new Date(selectedBookingForReceipt.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Expected Delivery</p>
                    <p className="font-medium text-slate-700">{new Date(selectedBookingForReceipt.delivery_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100 pb-1">Tests Ordered</p>
                  <div className="space-y-2">
                    {selectedBookingForReceipt.test_names?.split(', ').map((name, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-600">{name}</span>
                        <span className="font-bold text-slate-800">Included</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Total Amount</p>
                    <p className="text-[9px]">Paid in Full</p>
                  </div>
                  <div className="text-xl font-black">₨ {selectedBookingForReceipt.total_amount}</div>
                </div>

                <div className="text-center space-y-2 pt-1">
                  <div className="flex justify-center">
                    {/* Mock Barcode */}
                    <div className="flex gap-0.5 h-5">
                      {[1,3,1,2,4,1,3,2,1,4,1,2,1,3].map((w, i) => (
                        <div key={i} className="bg-slate-300" style={{ width: w }} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-400 italic leading-tight">Please bring this receipt for report collection.<br/>Expected Delivery: {new Date(selectedBookingForReceipt.delivery_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 flex gap-2 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button 
                  onClick={() => setSelectedBookingForReceipt(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
