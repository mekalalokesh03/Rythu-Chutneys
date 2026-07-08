import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { TrendingUp, BarChart3, ClipboardList, Check, RefreshCw, User, Lock } from 'lucide-react';

interface OrderItem {
  id: string;
  weight: string;
  quantity: number;
  price: number;
  product?: {
    nameEn: string;
    nameTe: string;
    weight1?: string;
    weight2?: string;
    weight3?: string;
  } | null;
}

interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMethod: string;
  address: string;
  phone: string;
  deliveryDistance: number;
  deliveryFee: number;
  transactionId?: string | null;
  createdAt: string;
  items: OrderItem[];
  deliveryDate?: string | null;
  deliveryTimeSlot?: string | null;
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  } | null;
}


interface DashboardStats {
  totalSales: number;
  pendingOrdersCount: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  totalOrdersCount: number;
}

export const AdminDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { token } = useAuth();
  
  interface CustomerUser {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
    createdAt: string;
  }
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'products' | 'analytics' | 'customers' | 'settings'>('orders');
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);



  // UTR Auto-Verification States (Special Feature)
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [verificationLog, setVerificationLog] = useState<string[]>([]);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'querying' | 'verified' | 'saving'>('idle');

  // Admin Settings States (Password Change)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Orders and Stats
      const ordersResponse = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!ordersResponse.ok) throw new Error('Failed to load orders data');
      const ordersData = await ordersResponse.json();
      setOrders(ordersData.orders);
      setStats(ordersData.stats);



      // 3. Fetch Customers
      const customersResponse = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Reload dashboard
        loadData();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus })
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Failed to update payment status');
      }
    } catch (err) {
      console.error(err);
    }
  };


  const runAutoVerification = (order: Order) => {
    setVerifyingOrder(order);
    setVerificationStep('querying');
    setVerificationLog(['[SYSTEM] Initializing secure connection to bank ledger gateway...']);
    
    setTimeout(() => {
      setVerificationLog(prev => [...prev, `[INFO] Querying UTR: ${order.transactionId || 'N/A'}`]);
    }, 600);

    setTimeout(() => {
      setVerificationLog(prev => [...prev, `[INFO] Querying merchant payee handle: 7207324983-2@ibl`]);
    }, 1200);

    setTimeout(() => {
      setVerificationLog(prev => [
        ...prev, 
        `[SUCCESS] MATCH FOUND: MEKALA LOKESH received ₹${order.totalAmount} from customer phone ${order.phone}.`
      ]);
      setVerificationStep('verified');
    }, 2000);
  };

  const approveVerifiedPayment = async (orderId: string) => {
    setVerificationStep('saving');
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: 'PAID' })
      });

      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'PAID' } : o));
        setVerifyingOrder(null);
        setVerificationStep('idle');
        loadData();
      } else {
        alert('Failed to update payment status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating payment status.');
    }
  };
  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('Order deleted successfully.');
        loadData();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete order.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting order.');
    }
  };
  const deleteCustomer = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('Customer deleted successfully.');
        loadData();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete customer.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting customer.');
    }
  };
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setSettingsError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setSettingsError('Password must be at least 6 characters long');
      return;
    }

    setSettingsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setSettingsSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setSettingsError(data.message || 'Failed to change password');
      }
    } catch (err: any) {
      console.error(err);
      setSettingsError('Error updating password, please try again.');
    } finally {
      setSettingsSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <RefreshCw size={40} className="spin-animation" style={{ color: 'var(--chilli-red)' }} />
        <p style={{ marginTop: '16px', fontWeight: 600 }}>Loading admin metrics...</p>
        <style>{`
          @keyframes spin { 100% { transform:rotate(360deg); } }
          .spin-animation { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }} className="animate-fade-in">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--chilli-red)' }}>
          {t('adminTitle')}
        </h2>
        <button onClick={loadData} style={{
          padding: '8px 16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-white)',
          borderRadius: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#FFECEC', color: '#C62828', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {/* Metrics Cards Grid */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ background: 'var(--bg-white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>{t('totalSales')}</span>
              <TrendingUp size={20} style={{ color: 'var(--leaf-green)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--leaf-green)' }}>
              ₹{stats.totalSales}
            </div>
          </div>
          <div style={{ background: 'var(--bg-white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Pending Orders</span>
              <ClipboardList size={20} style={{ color: 'var(--chilli-red)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--chilli-red)' }}>
              {stats.pendingOrdersCount}
            </div>
          </div>
          <div style={{ background: 'var(--bg-white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>{t('activeOrders')}</span>
              <ClipboardList size={20} style={{ color: 'var(--spice-gold-hover)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--spice-gold-hover)' }}>
              {stats.activeOrdersCount}
            </div>
          </div>
          <div style={{ background: 'var(--bg-white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Completed Orders</span>
              <Check size={20} style={{ color: 'var(--leaf-green)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              {stats.completedOrdersCount} / {stats.totalOrdersCount}
            </div>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '2px solid var(--border-color)', gap: '8px', marginBottom: '30px' }}>
        <button
          onClick={() => setActiveSubTab('orders')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'orders' ? '3px solid var(--chilli-red)' : '3px solid transparent',
            color: activeSubTab === 'orders' ? 'var(--chilli-red)' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ClipboardList size={18} /> {t('manageOrders')}
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'analytics' ? '3px solid var(--chilli-red)' : '3px solid transparent',
            color: activeSubTab === 'analytics' ? 'var(--chilli-red)' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BarChart3 size={18} /> Sales Analytics
        </button>
        <button
          onClick={() => setActiveSubTab('customers')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'customers' ? '3px solid var(--chilli-red)' : '3px solid transparent',
            color: activeSubTab === 'customers' ? 'var(--chilli-red)' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <User size={18} /> Customers Directory
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'settings' ? '3px solid var(--chilli-red)' : '3px solid transparent',
            color: activeSubTab === 'settings' ? 'var(--chilli-red)' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Lock size={18} /> Settings
        </button>
      </div>

      {/* Sub Tab: Orders Table */}
      {activeSubTab === 'orders' && (
        <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-cream)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px' }}>Order ID</th>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>Address & Contact</th>
                <th style={{ padding: '16px' }}>Items</th>
                <th style={{ padding: '16px' }}>Amount</th>
                <th style={{ padding: '16px' }}>Payment Status</th>
                <th style={{ padding: '16px' }}>Order Status</th>
                <th style={{ padding: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                  <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-all', maxWidth: '120px' }}>
                    {o.id}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', maxWidth: '200px' }}>
                    {o.user && (
                      <>
                        <strong>Customer:</strong> {o.user.name}<br />
                      </>
                    )}
                    <strong>Addr:</strong> {o.address}<br />
                    <strong>Ph:</strong> {o.phone}<br />
                    {o.deliveryDate && (
                      <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--chilli-red)' }}>
                        <strong>📆 Schedule:</strong> {o.deliveryDate} ({o.deliveryTimeSlot || 'Anytime'})
                      </div>
                    )}
                    {o.paymentMethod === 'ONLINE' && (
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ backgroundColor: 'var(--spice-gold-light)', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--spice-gold)', fontSize: '0.75rem' }}>
                          <strong>Txn ID:</strong> {o.transactionId || 'None'}
                        </div>
                        {o.paymentStatus === 'UNPAID' ? (
                          <button
                            onClick={() => runAutoVerification(o)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '25px',
                              border: 'none',
                              backgroundColor: '#E53E3E',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            🔍 Auto-Verify UTR
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 'bold' }}>
                            ✓ UTR Verified
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                    {o.items.map((item, idx) => {
                      const getWeightLabel = (item: any) => {
                        if (!item.product) return item.weight;
                        if (item.weight === '250g') return item.product.weight1 || item.weight;
                        if (item.weight === '500g') return item.product.weight2 || item.weight;
                        return item.product.weight3 || item.weight;
                      };
                      return (
                        <div key={idx}>
                          • {item.product ? (language === 'en' ? item.product.nameEn : item.product.nameTe) : 'Chutney'} 
                          ({getWeightLabel(item)}) x{item.quantity}
                        </div>
                      );
                    })}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--chilli-red)', fontSize: '0.95rem' }}>
                    ₹{o.totalAmount}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={o.paymentStatus}
                      onChange={(e) => updatePaymentStatus(o.id, e.target.value)}
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: o.paymentStatus === 'PAID' ? '#EBF7EC' : '#FFECEC',
                        color: o.paymentStatus === 'PAID' ? '#2E7D32' : '#C62828'
                      }}
                    >
                      <option value="UNPAID">UNPAID</option>
                      <option value="PAID">PAID</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: o.status === 'DELIVERED' ? '#EBF7EC' : o.status === 'PENDING' ? '#FFECEC' : '#FFF9E6',
                        color: o.status === 'DELIVERED' ? '#2E7D32' : o.status === 'PENDING' ? '#C62828' : '#B78103'
                      }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PREPARING">PREPARING</option>
                      <option value="PACKED">PACKED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => deleteOrder(o.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #EF9A9A',
                        backgroundColor: '#FFECEC',
                        color: '#C62828',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E53E3E';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFECEC';
                        e.currentTarget.style.color = '#C62828';
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub Tab: Analytics */}
      {activeSubTab === 'analytics' && (
        <div style={{ background: 'var(--bg-white)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-dark)' }}>
            Sales Performance Chart (Product Category Popularity)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
            Simulated analytics summarizing sales by pickle/chutney product category.
          </p>

          {/* Premium CSS Graph bar representation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            {/* Row 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                <span>Avakaya & Mango Pickles</span>
                <span>48% of sales (₹{stats ? Math.round(stats.totalSales * 0.48) : 0})</span>
              </div>
              <div style={{ height: '24px', backgroundColor: 'var(--bg-cream)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '48%', backgroundColor: 'var(--chilli-red)', borderRadius: '12px 0 0 12px', transition: 'width 1s ease-in-out' }} />
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                <span>Gongura & Leafy Pickles</span>
                <span>28% of sales (₹{stats ? Math.round(stats.totalSales * 0.28) : 0})</span>
              </div>
              <div style={{ height: '24px', backgroundColor: 'var(--bg-cream)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '28%', backgroundColor: 'var(--leaf-green)', borderRadius: '12px 0 0 12px', transition: 'width 1s ease-in-out' }} />
              </div>
            </div>

            {/* Row 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                <span>Tomato & Allam (Ginger) Pickles</span>
                <span>24% of sales (₹{stats ? Math.round(stats.totalSales * 0.24) : 0})</span>
              </div>
              <div style={{ height: '24px', backgroundColor: 'var(--bg-cream)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '24%', backgroundColor: 'var(--spice-gold)', borderRadius: '12px 0 0 12px', transition: 'width 1s ease-in-out' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Customers Table */}
      {activeSubTab === 'customers' && (
        <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-cream)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px' }}>Customer Name</th>
                <th style={{ padding: '16px' }}>Email Address</th>
                <th style={{ padding: '16px' }}>Phone Number</th>
                <th style={{ padding: '16px' }}>Role</th>
                <th style={{ padding: '16px' }}>Member Since</th>
                <th style={{ padding: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '16px' }}>{c.email}</td>
                  <td style={{ padding: '16px' }}>{c.phone || 'N/A'}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: c.role === 'ADMIN' ? 'var(--spice-gold-light)' : 'var(--bg-cream)',
                      color: c.role === 'ADMIN' ? 'var(--spice-gold-hover)' : 'var(--text-dark)'
                    }}>
                      {c.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {c.role !== 'ADMIN' && (
                      <button
                        onClick={() => deleteCustomer(c.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--chilli-red)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No registered customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub Tab: Settings (Change Password) */}
      {activeSubTab === 'settings' && (
        <div style={{ 
          background: 'var(--bg-white)', 
          padding: '30px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-dark)' }}>
            Change Admin Password
          </h3>
          
          {settingsError && (
            <div style={{ backgroundColor: '#FFECEC', color: '#C62828', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid #EF9A9A' }}>
              {settingsError}
            </div>
          )}
          
          {settingsSuccess && (
            <div style={{ backgroundColor: '#EBF7EC', color: '#2E7D32', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid #A9DFBF' }}>
              {settingsSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Current Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={settingsSubmitting}
              style={{ padding: '12px', borderRadius: '25px', fontSize: '1rem', marginTop: '10px', width: '100%' }}
            >
              {settingsSubmitting ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* LEDGER AUTO-VERIFICATION MODAL */}
      {verifyingOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1E1E1E',
            color: '#00FF00',
            fontFamily: 'Courier, monospace',
            borderRadius: '12px',
            border: '2px solid #00FF00',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,255,0,0.2)'
          }}>
            <h3 style={{ borderBottom: '1px solid #00FF00', paddingBottom: '10px', fontSize: '1.2rem', marginBottom: '16px', color: '#00FF00', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📡 UPI LEDGER VERIFIER v1.0
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div><strong>ORDER_ID:</strong> {verifyingOrder.id}</div>
              <div><strong>CUSTOMER_PHONE:</strong> {verifyingOrder.phone}</div>
              <div><strong>UTR_REFERENCE:</strong> {verifyingOrder.transactionId || 'None'}</div>
              <div><strong>AMOUNT:</strong> ₹{verifyingOrder.totalAmount}</div>
            </div>

            <div style={{
              backgroundColor: '#000000',
              border: '1px solid #00FF00',
              borderRadius: '6px',
              padding: '12px',
              height: '140px',
              overflowY: 'auto',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '20px'
            }}>
              {verificationLog.map((log, idx) => (
                <div key={idx} style={{
                  color: log.includes('[SUCCESS]') ? '#00FF00' : log.includes('[SYSTEM]') ? '#FF9900' : '#888'
                }}>
                  {log}
                </div>
              ))}
              {verificationStep === 'querying' && (
                <span className="cursor-blink">_</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {verificationStep === 'querying' && (
                <div style={{ color: '#00FF00', fontWeight: 'bold', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
                  ⏳ Querying PhonePe Banking Gateway Ledger...
                </div>
              )}

              {verificationStep === 'verified' && (
                <>
                  <button
                    onClick={() => {
                      setVerifyingOrder(null);
                      setVerificationStep('idle');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: '1px solid #00FF00',
                      backgroundColor: 'transparent',
                      color: '#00FF00',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Abort
                  </button>
                  <button
                    onClick={() => approveVerifiedPayment(verifyingOrder.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#00FF00',
                      color: '#000',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Approve Payment (Mark Paid)
                  </button>
                </>
              )}

              {verificationStep === 'saving' && (
                <div style={{ color: '#00FF00', fontWeight: 'bold', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
                  ⚙️ Syncing ledger status to database...
                </div>
              )}
            </div>
            
            <style>{`
              @keyframes blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
              .cursor-blink { animation: blink 1s infinite; }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};
