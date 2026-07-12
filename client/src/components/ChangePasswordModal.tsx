import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { X, Lock, Loader2, User, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { token, user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sync profile details when user is loaded or modal opens
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
    if (!isOpen) {
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update the user details in AuthContext
      updateUser(data.user);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setSubmitting(true);
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
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccessMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setSubmitting(false);
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
        
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 0
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          color: 'var(--chilli-red)',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          Account Settings
        </h3>

        {/* Tabs Header */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '20px',
          gap: '12px'
        }}>
          <button
            onClick={() => { 
              setActiveTab('profile'); 
              setErrorMsg(null); 
              setSuccessMsg(null); 
              setShowCurrent(false);
              setShowNew(false);
              setShowConfirm(false);
            }}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid var(--chilli-red)' : '2px solid transparent',
              color: activeTab === 'profile' ? 'var(--chilli-red)' : 'var(--text-dark)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            Profile Details
          </button>
          <button
            onClick={() => { 
              setActiveTab('password'); 
              setErrorMsg(null); 
              setSuccessMsg(null); 
              setShowCurrent(false);
              setShowNew(false);
              setShowConfirm(false);
            }}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'password' ? '2px solid var(--chilli-red)' : '2px solid transparent',
              color: activeTab === 'password' ? 'var(--chilli-red)' : 'var(--text-dark)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            Change Password
          </button>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#FFECEC',
            color: '#C62828',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            border: '1px solid #EF9A9A'
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: '#EBF7EC',
            color: '#2E7D32',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            border: '1px solid #A5D6A7',
            textAlign: 'center'
          }}>
            {successMsg}
          </div>
        )}

        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Full Name"
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address (Read-only)</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ width: '100%', backgroundColor: 'var(--bg-cream)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '12px', borderRadius: '25px', width: '100%', fontSize: '0.95rem', marginTop: '10px' }}
            >
              {submitting ? <Loader2 className="spin-animation" size={18} /> : 'Save Profile Details'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
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
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
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
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '12px', borderRadius: '25px', width: '100%', fontSize: '0.95rem', marginTop: '10px' }}
            >
              {submitting ? <Loader2 className="spin-animation" size={18} /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
