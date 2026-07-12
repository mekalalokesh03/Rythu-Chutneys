import React, { useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, KeyRound, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  setCurrentTab: (tab: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ setCurrentTab }) => {
  const { login, error, clearError } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert('Please enter your email address in the field above first.');
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
      alert(data.message || 'Password reset request submitted successfully.');
    } catch (err) {
      console.error(err);
      alert('Error connecting to authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(false);
    clearError();

    if (!email || !password) return;

    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);

    if (success) {
      setCurrentTab('admin'); // unlock dashboard
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Back button */}
      <button
        onClick={() => setCurrentTab('home')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-dark)',
          fontWeight: 600,
          marginBottom: '30px',
          alignSelf: 'flex-start'
        }}
      >
        <ArrowLeft size={18} /> {t('navHome')}
      </button>

      {/* Admin Login Card */}
      <div style={{
        backgroundColor: 'var(--bg-white)',
        border: '2px solid var(--spice-gold)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center'
      }}>
        {/* Lock Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--spice-gold-light)',
          color: 'var(--spice-gold-hover)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <Lock size={32} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '8px' }}>
          Owner & Admin Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: '1.4' }}>
          Access restricted to Rythu Chutneys kitchen managers and riders. Authorized personnel only.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#FFECEC',
            color: '#C62828',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            border: '1px solid #EF9A9A',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder="mekalalokesh2003@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px', width: '100%' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Security Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
              />
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ padding: '12px', borderRadius: '25px', width: '100%', fontSize: '0.95rem', marginTop: '10px' }}
          >
            {submitting ? <Loader2 className="spin-animation" size={18} /> : 'Unlock Admin Panel'}
          </button>
        </form>

        {/* Credentials box */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'var(--spice-gold-light)',
          color: 'var(--spice-gold-hover)',
          borderRadius: '8px',
          border: '1px dashed var(--spice-gold)',
          fontSize: '0.8rem',
          lineHeight: '1.5',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '4px' }}>
            <ShieldCheck size={16} /> Testing Access Credentials
          </div>
          Email: <code>mekalalokesh2003@gmail.com</code><br />
          Password: <code>Admin@Rythu2026</code>
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform:rotate(360deg); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};
