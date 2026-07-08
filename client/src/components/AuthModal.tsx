import React, { useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Lock, Mail, User, Phone, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, error, clearError } = useAuth();
  const { t } = useLanguage();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTabChange = (isLogin: boolean) => {
    setIsLoginTab(isLogin);
    clearError();
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert('Please enter your email address or phone number in the field first.');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      alert(data.message || 'If that account exists, recovery instructions have been sent.');
    } catch (err) {
      console.error(err);
      alert('Error connecting to authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let success = false;

    if (isLoginTab) {
      success = await login(email, password);
    } else {
      success = await register(name, email, password, phone);
    }

    setSubmitting(false);
    if (success) {
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      onClose();
    }
  };

  return (
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
    }} className="animate-fade-in" onClick={onClose}>
      
      {/* Modal Card */}
      <div style={{
        backgroundColor: 'var(--bg-white)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        maxWidth: '450px',
        width: '100%',
        padding: '24px 16px',
        margin: '40px auto',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={24} />
        </button>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => handleTabChange(true)}
            style={{
              padding: '8px 12px 12px 12px',
              background: 'transparent',
              border: 'none',
              borderBottom: isLoginTab ? '3px solid var(--chilli-red)' : '3px solid transparent',
              color: isLoginTab ? 'var(--chilli-red)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            {t('login')}
          </button>
          <button
            onClick={() => handleTabChange(false)}
            style={{
              padding: '8px 12px 12px 12px',
              background: 'transparent',
              border: 'none',
              borderBottom: !isLoginTab ? '3px solid var(--chilli-red)' : '3px solid transparent',
              color: !isLoginTab ? 'var(--chilli-red)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            {t('register')}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            backgroundColor: '#FFECEC',
            color: '#C62828',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            border: '1px solid #EF9A9A'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Name Field (Sign up only) */}
          {!isLoginTab && (
            <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('fullName')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g. Lokesh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ paddingLeft: '40px' }}
                />
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          {/* Email / Identifier Field */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {isLoginTab ? 'Email Address or Phone Number' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={isLoginTab ? 'text' : 'email'}
                className="form-control"
                placeholder={isLoginTab ? 'e.g. lokesh@example.com or 916309574197' : 'e.g. lokesh@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Phone Field (Sign up only) */}
          {!isLoginTab && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('phoneNum')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 916309574197"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {isLoginTab && (
            <div style={{ textAlign: 'right', marginTop: '2px' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--chilli-red)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ padding: '12px', borderRadius: '25px', fontSize: '1rem', marginTop: '10px', width: '100%' }}
          >
            {submitting ? (
              <Loader2 className="spin-animation" size={18} />
            ) : (
              isLoginTab ? t('login') : t('register')
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { 100% { transform:rotate(360deg); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};
