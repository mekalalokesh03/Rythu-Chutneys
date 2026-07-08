import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, User, Globe, Moon, Sun, Menu, X, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
  openChangePasswordModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, openAuthModal, openChangePasswordModal }) => {
  const { language, setLanguage, t } = useLanguage();
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rythu_theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      return 'dark';
    }
    return 'light';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('rythu_theme', newTheme);
  };

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="header-glass" style={{ display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => handleNav('home')}>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--chilli-red)', fontFamily: 'var(--font-serif)' }}>
            🌾 Rythu Chutneys
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            background: 'var(--spice-gold-light)', 
            color: 'var(--spice-gold-hover)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            border: '1px solid var(--spice-gold)',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            Premium
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="desktop-only">
          <a href="#home" 
             style={{ 
               fontWeight: currentTab === 'home' ? 700 : 500, 
               color: currentTab === 'home' ? 'var(--chilli-red)' : 'var(--text-dark)',
               transition: 'color 0.2s' 
             }}
             onClick={() => handleNav('home')}>
            {t('navHome')}
          </a>
          <a href="#shop" 
             style={{ 
               fontWeight: currentTab === 'shop' ? 700 : 500, 
               color: currentTab === 'shop' ? 'var(--chilli-red)' : 'var(--text-dark)',
               transition: 'color 0.2s' 
             }}
             onClick={() => handleNav('shop')}>
            {t('navShop')}
          </a>
          {(!user || user.role !== 'ADMIN') && (
            <a href="#track" 
               style={{ 
                 fontWeight: currentTab === 'track' ? 700 : 500, 
                 color: currentTab === 'track' ? 'var(--chilli-red)' : 'var(--text-dark)',
                 transition: 'color 0.2s' 
               }}
               onClick={() => handleNav('track')}>
              {t('navTrack')}
            </a>
          )}
          {user && user.role === 'ADMIN' && (
            <a href="#admin" 
               style={{ 
                 fontWeight: currentTab === 'admin' ? 700 : 500, 
                 color: currentTab === 'admin' ? 'var(--spice-gold-hover)' : 'var(--text-dark)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px'
               }}
               onClick={() => handleNav('admin')}>
              <ShieldAlert size={16} /> {t('navAdmin')}
            </a>
          )}
        </nav>

        {/* Toolbar (Lang, Theme, Cart, Profile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Language Switcher */}
          <button 
            onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
            className="desktop-only"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-color)', 
              borderRadius: '20px', 
              padding: '6px 12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-dark)',
              fontWeight: 600
            }}
          >
            <Globe size={16} />
            <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="desktop-only"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-dark)' 
            }}
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          {/* Cart Icon */}
          <button 
            onClick={() => handleNav('cart')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              position: 'relative',
              color: 'var(--text-dark)' 
            }}
          >
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--chilli-red)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-only">
              <span 
                onClick={openChangePasswordModal}
                style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }} 
                title="Change Password"
              >
                👤 {user.name.split(' ')[0]}
              </span>
              <button 
                onClick={logout}
                style={{ 
                  background: 'var(--chilli-red-light)', 
                  color: 'var(--chilli-red)', 
                  border: '1px solid var(--chilli-red)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer' 
                }}
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <button 
              onClick={openAuthModal}
              className="desktop-only"
              style={{ 
                background: 'var(--chilli-red)', 
                color: 'white', 
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <User size={16} />
              <span>{t('login')}</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-dark)',
              display: 'none' // Controlled in CSS media query below
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 'var(--header-height)',
          left: 0,
          right: 0,
          bottom: 0, // Fill viewport height for scrolling
          background: 'var(--bg-white)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 999,
          overflowY: 'auto'
        }} className="animate-fade-in">
          <a href="#home" onClick={() => handleNav('home')} style={{ fontSize: '1.2rem', fontWeight: 600, padding: '4px 0' }}>
            {t('navHome')}
          </a>
          <a href="#shop" onClick={() => handleNav('shop')} style={{ fontSize: '1.2rem', fontWeight: 600, padding: '4px 0' }}>
            {t('navShop')}
          </a>
          {(!user || user.role !== 'ADMIN') && (
            <a href="#track" onClick={() => handleNav('track')} style={{ fontSize: '1.2rem', fontWeight: 600, padding: '4px 0' }}>
              {t('navTrack')}
            </a>
          )}
          {user && user.role === 'ADMIN' && (
            <a href="#admin" onClick={() => handleNav('admin')} style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--spice-gold-hover)', padding: '4px 0' }}>
              {t('navAdmin')}
            </a>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

          {/* Mobile Settings Controls (Theme & Language) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => { setLanguage(language === 'en' ? 'te' : 'en'); setMobileMenuOpen(false); }}
              style={{ 
                background: 'transparent', 
                border: '1px solid var(--border-color)', 
                borderRadius: '20px', 
                padding: '10px 16px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-dark)',
                fontWeight: 600,
                flexGrow: 1,
                justifyContent: 'center'
              }}
            >
              <Globe size={16} />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            <button 
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              style={{ 
                background: 'transparent', 
                border: '1px solid var(--border-color)', 
                borderRadius: '20px',
                padding: '10px 16px',
                cursor: 'pointer', 
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flexGrow: 1
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>

          {/* Mobile Profile Details & Authentication */}
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <div 
                onClick={() => { openChangePasswordModal(); setMobileMenuOpen(false); }}
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center'
                }} 
              >
                👤 {user.name} (Settings)
              </div>
              <button 
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                style={{ 
                  background: 'var(--chilli-red-light)', 
                  color: 'var(--chilli-red)', 
                  border: '1px solid var(--chilli-red)',
                  padding: '12px 16px',
                  borderRadius: '20px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { openAuthModal(); setMobileMenuOpen(false); }}
              style={{ 
                background: 'var(--chilli-red)', 
                color: 'white', 
                border: 'none',
                padding: '12px 16px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                width: '100%'
              }}
            >
              <User size={16} />
              <span>{t('login')}</span>
            </button>
          )}
        </div>
      )}

      {/* Media query styling in line blocks */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};
