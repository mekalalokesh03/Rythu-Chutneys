import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../context/AuthContext';
import { ShoppingBag, Trash2, AlertTriangle, ArrowRight, ShieldCheck, CreditCard, RefreshCw } from 'lucide-react';
import { LocationChecker } from '../components/LocationChecker';

interface CheckoutProps {
  setCurrentTab: (tab: string) => void;
  setTrackedOrderId: (orderId: string) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ setCurrentTab, setTrackedOrderId }) => {
  const { language: langCode, t: translate } = useLanguage();
  const { cart, updateQuantity, removeFromCart, cartSubtotal, deliveryDetails, clearCart } = useCart();
  const { user } = useAuth();

  // Form Fields
  const [name, setName] = useState(user ? user.name : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(deliveryDetails?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [inputTxnId, setInputTxnId] = useState('');
  const [showOriginalQr, setShowOriginalQr] = useState(false);

  // Scheduled Delivery Slots
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [deliveryDate, setDeliveryDate] = useState(getTomorrowDateString());
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('10:00 AM - 01:00 PM');

  // Interactive Flow States
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const totalAmount = cartSubtotal + (deliveryDetails?.fee || 0);

  useEffect(() => {
    if (deliveryDetails) {
      setAddress(deliveryDetails.address);
    }
  }, [deliveryDetails]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryDetails || !deliveryDetails.eligible) {
      alert(langCode === 'en' ? 'Please verify your delivery eligibility using the location checker first.' : 'దయచేసి మొదట డెలివరీ అర్హతను తనిఖీ చేయండి.');
      return;
    }

    if (paymentMethod === 'ONLINE') {
      // Open mock payment gateway modal
      setShowPaymentGateway(true);
      setPaymentStep('details');
    } else {
      // Direct Cash on Delivery submission
      await submitOrder();
    }
  };

  const submitOrder = async (isPaid = false, transactionId?: string) => {
    setSubmitting(true);
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.productId,
        weight: item.weight,
        quantity: item.quantity
      }));

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id || null,
          items: itemsPayload,
          address,
          phone,
          paymentMethod: isPaid ? 'ONLINE' : 'COD',
          latitude: deliveryDetails?.latitude || 16.2268,
          longitude: deliveryDetails?.longitude || 77.8080,
          transactionId: transactionId || null,
          deliveryDate,
          deliveryTimeSlot
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to place order');
      }

      const orderResult = await response.json();
      setCreatedOrderId(orderResult.id);
      
      if (paymentMethod === 'ONLINE') {
        setPaymentStep('success');
      } else {
        // Complete checkout for COD
        setTrackedOrderId(orderResult.id);
        clearCart();
        setCurrentTab('track');
        sendDetailsToWhatsApp(orderResult.id, false);
      }

    } catch (error: any) {
      alert(error.message || 'An error occurred during checkout.');
      setShowPaymentGateway(false);
    } finally {
      setSubmitting(false);
    }
  };

  const sendDetailsToWhatsApp = (orderId: string, isPaidOnline: boolean, refId?: string) => {
    const paymentStr = isPaidOnline 
      ? `Online Payment (Verified UTR: ${refId || 'N/A'})` 
      : 'Cash on Delivery';
      
    const itemsText = cart.map(item => {
      const name = langCode === 'en' ? item.nameEn : item.nameTe;
      const absoluteImgUrl = item.imageUrl.startsWith('http')
        ? item.imageUrl
        : `${window.location.origin}${item.imageUrl}`;
      return `- ${name} (${item.weightLabel || item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}\n  Product Image: ${absoluteImgUrl}`;
    }).join('\n');

    const message = `*Rythu Chutneys - Order Confirmation* 🌾\n\n` +
      `*Order ID:* ${orderId}\n` +
      `*Customer Name:* ${name}\n` +
      `*Phone Number:* ${phone}\n` +
      `*Delivery Address:* ${address}\n` +
      `*Scheduled Date:* ${deliveryDate}\n` +
      `*Preferred Time Slot:* ${deliveryTimeSlot}\n` +
      `*Payment Method:* ${paymentStr}\n` +
      `*Delivery Charge:* ${deliveryDetails?.fee === 0 ? 'FREE' : `₹${deliveryDetails?.fee}`}\n` +
      `*Total Amount:* ₹${totalAmount}\n\n` +
      `*Items Ordered:* \n${itemsText}\n\n` +
      `Thank you for ordering with Rythu Chutneys!`;

    const waUrl = `https://wa.me/916309574197?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleConfirmQrPayment = async () => {
    if (!inputTxnId.trim()) {
      alert(langCode === 'en' ? 'Please enter the UPI Transaction ID to confirm your payment.' : 'దయచేసి మీ పేమెంట్ నిర్ధారించడానికి యుపిఐ లావాదేవీల ఐడి (Transaction ID) నమోదు చేయండి.');
      return;
    }
    setPaymentStep('processing');
    // Simulate server side verification latency
    setTimeout(async () => {
      await submitOrder(true, inputTxnId);
    }, 2000);
  };

  const closeSuccessAndTrack = () => {
    if (createdOrderId) {
      setTrackedOrderId(createdOrderId);
      clearCart();
      setShowPaymentGateway(false);
      setCurrentTab('track');
      sendDetailsToWhatsApp(createdOrderId, true, inputTxnId);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container animate-fade-in" style={{ padding: '60px 0', textAlign: 'center' }}>
        <ShoppingBag size={64} style={{ color: 'var(--chilli-red)', marginBottom: '24px' }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '12px' }}>
          {translate('cartTitle')}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          {translate('cartEmpty')}
        </p>
        <button className="btn btn-primary" onClick={() => setCurrentTab('shop')}>
          {translate('orderNow')}
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '30px 0 60px 0' }}>
      <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--chilli-red)', marginBottom: '30px', textAlign: 'center' }}>
        {translate('navCart')} & Checkout
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'start'
      }}>
        {/* Left Side: Cart Items Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: 'var(--bg-white)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '20px' }}>
              Review Items
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.map((item) => (
                <div key={`${item.productId}-${item.weight}`} style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  {/* Image */}
                  <img
                    src={item.imageUrl}
                    alt={item.nameEn}
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  />

                  {/* Details */}
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {langCode === 'en' ? item.nameEn : item.nameTe}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(item.weightLabel?.toLowerCase().includes('roti') || item.weightLabel?.toLowerCase().includes('pc')) ? '' : 'Weight: '}{item.weightLabel || item.weight} | Price: ₹{item.price}
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}
                      style={{ border: '1px solid var(--border-color)', background: 'var(--bg-cream)', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}
                      style={{ border: '1px solid var(--border-color)', background: 'var(--bg-cream)', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.productId, item.weight)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Subtotal Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>Delivery Charge</span>
                <span>
                  {deliveryDetails ? (
                    deliveryDetails.fee === 0 ? 'FREE (within 5 km)' : `₹${deliveryDetails.fee}`
                  ) : (
                    'Not calculated'
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', color: 'var(--chilli-red)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Delivery Details & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <LocationChecker />
          <div style={{
            backgroundColor: 'var(--bg-white)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '20px' }}>
              {translate('checkoutTitle')}
            </h3>

            {/* Verification Alert */}
            {!deliveryDetails && (
              <div style={{
                backgroundColor: '#FFF9E6',
                color: '#B78103',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #FFE082',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '16px',
                fontSize: '0.85rem'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>Please verify your delivery address in the checker above.</span>
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem' }}>{translate('fullName')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem' }}>{translate('phoneNum')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem' }}>{translate('address')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={address}
                  placeholder="Verify your address in the checker above"
                  readOnly
                  required
                />
              </div>

              {/* Delivery Schedule Date & Time */}
              <div className="responsive-grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Delivery Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={deliveryDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Time Slot</label>
                  <select
                    className="form-control"
                    value={deliveryTimeSlot}
                    onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                    required
                    style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', backgroundColor: '#fff', fontSize: '0.9rem' }}
                  >
                    <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM</option>
                    <option value="01:00 PM - 04:00 PM">01:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM</option>
                    <option value="07:00 PM - 10:00 PM">07:00 PM - 10:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Payment Methods selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                  {translate('paymentMethod')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: paymentMethod === 'COD' ? 'var(--spice-gold-light)' : 'transparent',
                    borderColor: paymentMethod === 'COD' ? 'var(--spice-gold)' : 'var(--border-color)'
                  }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      style={{ accentColor: 'var(--chilli-red)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{translate('cod')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pay cash when rider arrives.</div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: paymentMethod === 'ONLINE' ? 'var(--spice-gold-light)' : 'transparent',
                    borderColor: paymentMethod === 'ONLINE' ? 'var(--spice-gold)' : 'var(--border-color)'
                  }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'ONLINE'}
                      onChange={() => setPaymentMethod('ONLINE')}
                      style={{ accentColor: 'var(--chilli-red)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{translate('onlinePay')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credit Card, UPI, Wallets.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Checkout Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !deliveryDetails || !deliveryDetails.eligible}
                style={{ padding: '14px', borderRadius: '25px', fontSize: '1rem', width: '100%', marginTop: '10px' }}
              >
                <span>{submitting ? 'Placing Order...' : translate('placeOrder')}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MOCK PAYMENT GATEWAY DIALOG */}
      {showPaymentGateway && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          padding: '20px',
          overflowY: 'auto'
        }} className="animate-fade-in">
          <div style={{
            backgroundColor: 'var(--bg-white)',
            borderRadius: '16px',
            border: '2px solid var(--spice-gold)',
            maxWidth: '450px',
            width: '100%',
            padding: '24px 16px',
            margin: '40px auto',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {paymentStep === 'details' && (() => {
              const upiUrl = `upi://pay?pa=7207324983-2@ibl&pn=MEKALA%20LOKESH&am=${totalAmount}&cu=INR&mc=0000&mode=02&purpose=00`;
              const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <CreditCard size={28} style={{ color: 'var(--chilli-red)' }} />
                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Scan & Pay (UPI QR)</span>
                  </div>
                  
                  <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-cream)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan to pay the exact order amount:</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--chilli-red)', marginTop: '4px' }}>
                      ₹{totalAmount}
                    </div>
                  </div>

                  {/* QR Image Display */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    {showOriginalQr ? (
                      <img 
                        src="/images/qr_code.png" 
                        alt="PhonePe QR Code" 
                        style={{ width: '180px', height: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '4px', backgroundColor: '#fff' }}
                      />
                    ) : (
                      <img 
                        src={dynamicQrUrl} 
                        alt="Dynamic UPI QR Code" 
                        style={{ width: '180px', height: '180px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '4px', backgroundColor: '#fff' }}
                      />
                    )}
                    
                    <div style={{ textAlign: 'center' }}>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-dark)' }}>MEKALA LOKESH</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                        {showOriginalQr ? 'Original PhonePe QR' : 'Dynamic QR (Autofills Amount)'}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--chilli-red)', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                        Payment Number: 7207324983
                      </span>
                      
                      {/* Toggle Link */}
                      <button
                        type="button"
                        onClick={() => setShowOriginalQr(!showOriginalQr)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--chilli-red)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          textDecoration: 'underline',
                          fontWeight: 'bold',
                          marginTop: '6px',
                          display: 'inline-block'
                        }}
                      >
                        {showOriginalQr ? 'Show Dynamic QR (Autofills Amount)' : 'Show Original PhonePe QR'}
                      </button>

                      {/* Clickable Mobile Payment Link */}
                      <a 
                        href={upiUrl}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          textDecoration: 'none',
                          borderRadius: '25px',
                          padding: '10px 16px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: '#5850EC',
                          color: '#FFFFFF',
                          marginTop: '12px',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        📱 Open GPay / PhonePe (Autofill Amount)
                      </a>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                      UPI Transaction ID / Ref Number (UTR)
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter 12-digit transaction number"
                      value={inputTxnId}
                      onChange={(e) => setInputTxnId(e.target.value)}
                      required
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      You can find this in your payment app transaction history.
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button
                      onClick={() => setShowPaymentGateway(false)}
                      style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '25px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmQrPayment}
                      className="btn btn-primary"
                      style={{ flex: 2, padding: '12px', borderRadius: '25px', fontSize: '0.9rem' }}
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              );
            })()}

            {paymentStep === 'processing' && (
              <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <RefreshCw size={48} className="spin-animation" style={{ color: 'var(--spice-gold-hover)' }} />
                <h3 style={{ fontSize: '1.25rem' }}>Verifying Transaction...</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Please do not reload or close this window.
                </p>
                <style>{`
                  @keyframes spin { 100% { transform:rotate(360deg); } }
                  .spin-animation { animation: spin 1s linear infinite; }
                `}</style>
              </div>
            )}

            {paymentStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#EBF7EC', color: 'var(--leaf-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={40} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--leaf-green)', marginBottom: '8px' }}>
                    Payment Successful!
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Your order ID is: <strong style={{ color: 'var(--text-dark)' }}>{createdOrderId}</strong>
                  </p>
                </div>
                <button
                  onClick={closeSuccessAndTrack}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', borderRadius: '25px' }}
                >
                  Track Order Status
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
