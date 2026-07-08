import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import type { Product } from '../components/ProductCard';
import { Flame, ArrowLeft, ShieldCheck, Award, Heart, Check, ShoppingBag } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  setCurrentTab: (tab: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, setCurrentTab }) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const [selectedWeight, setSelectedWeight] = useState<'250g' | '500g' | '1kg'>('250g');
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);

  const getPrice = () => {
    if (selectedWeight === '250g') return product.price250g;
    if (selectedWeight === '500g') return product.price500g;
    return product.price1kg;
  };

  const getSpiceBadgeClass = () => {
    switch (product.spiceLevel) {
      case 'MILD': return 'badge-mild';
      case 'MEDIUM': return 'badge-medium';
      case 'HOT': return 'badge-hot';
      case 'ANDHRA_HOT': return 'badge-andhra';
      default: return 'badge-medium';
    }
  };

  const handleAddToCart = () => {
    const weightLabel = selectedWeight === '250g' 
      ? (product.weight1 || (product.category === 'ROTI' ? '1 Roti' : '250g'))
      : selectedWeight === '500g'
        ? (product.weight2 || (product.category === 'ROTI' ? '5 Rotis' : '500g'))
        : (product.weight3 || (product.category === 'ROTI' ? '10 Rotis' : '1kg'));

    addToCart({
      productId: product.id,
      nameEn: product.nameEn,
      nameTe: product.nameTe,
      weight: selectedWeight,
      weightLabel,
      price: getPrice(),
      imageUrl: product.imageUrl
    }, quantity);

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Curated premium ingredients list
  const ingredients = [
    language === 'en' ? 'Farm-fresh Handpicked produce' : 'పండించిన తాజా కూరగాయలు',
    language === 'en' ? 'Guntur stone-ground red chilli powder' : 'గుంటూరు కారం పొడి',
    language === 'en' ? 'Wood-pressed mustard oil / peanut oil' : 'గానుగ ఆవనూనె / వేరుశనగ నూనె',
    language === 'en' ? 'Unrefined sea salt' : 'సముద్రపు ఉప్పు',
    language === 'en' ? 'Hand-roasted fenugreek & mustard seeds' : 'మెంతులు మరియు ఆవాల పోపు'
  ];

  return (
    <div className="container animate-fade-in" style={{ padding: '30px 0 60px 0' }}>
      {/* Back Navigation */}
      <button
        onClick={() => setCurrentTab('shop')}
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
          fontSize: '1rem'
        }}
      >
        <ArrowLeft size={20} /> Back to Pickles Catalog
      </button>

      {/* Main Detail Grid */}
      <div className="product-detail-card">
        {/* Left Side: Product Image */}
        <div className="product-detail-image-wrapper">
          <img
            src={product.imageUrl}
            alt={product.nameEn}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600';
            }}
          />
          <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
            <span className={`badge ${getSpiceBadgeClass()}`} style={{ gap: '6px', padding: '6px 16px', fontSize: '0.9rem' }}>
              <Flame size={14} fill="currentColor" />
              {product.spiceLevel === 'ANDHRA_HOT' ? 'Andhra Hot 🔥' : product.spiceLevel}
            </span>
          </div>
        </div>

        {/* Right Side: Description and Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--spice-gold-hover)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {product.category}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginTop: '4px' }}>
              {language === 'en' ? product.nameEn : product.nameTe}
            </h1>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.7' }}>
            {language === 'en' ? product.descriptionEn : product.descriptionTe}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* Weight Select Option */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px', textTransform: 'uppercase' }}>
              {product.category === 'ROTI' ? (language === 'en' ? 'Select Option' : 'ఎంపికను ఎంచుకోండి') : t('selectWeight')}
            </label>
            <div style={{ display: 'flex', gap: '12px', maxWidth: '360px' }}>
              {(['250g', '500g', '1kg'] as const).map((weight) => (
                <button
                  key={weight}
                  onClick={() => setSelectedWeight(weight)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: selectedWeight === weight ? '2px solid var(--chilli-red)' : '1px solid var(--border-color)',
                    backgroundColor: selectedWeight === weight ? 'var(--chilli-red-light)' : 'var(--bg-white)',
                    color: selectedWeight === weight ? 'var(--chilli-red)' : 'var(--text-dark)',
                    transition: 'all 0.15s'
                  }}
                >
                  {weight === '250g' 
                    ? (product.weight1 || (product.category === 'ROTI' ? '1 Roti' : '250g'))
                    : weight === '500g'
                      ? (product.weight2 || (product.category === 'ROTI' ? '5 Rotis' : '500g'))
                      : (product.weight3 || (product.category === 'ROTI' ? '10 Rotis' : '1kg'))}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector & Add To Cart Button */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
            {/* Quantity */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--border-color)',
              borderRadius: '25px',
              padding: '6px 12px',
              background: 'var(--bg-cream)'
            }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ background: 'transparent', border: 'none', padding: '0 8px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                -
              </button>
              <span style={{ width: '32px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{ background: 'transparent', border: 'none', padding: '0 8px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                +
              </button>
            </div>

            {/* Price display */}
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--chilli-red)' }}>
                ₹{getPrice() * quantity}
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || added}
              className="btn btn-primary"
              style={{
                flexGrow: 1,
                padding: '14px 28px',
                borderRadius: '25px',
                backgroundColor: added ? 'var(--leaf-green)' : 'var(--chilli-red)',
                color: 'white',
                minWidth: '200px'
              }}
            >
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              <span style={{ marginLeft: '8px' }}>{added ? t('addedToCart') : t('addToCart')}</span>
            </button>
          </div>

          {/* Premium trust badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={18} style={{ color: 'var(--leaf-green)' }} />
              <span>Hygienic small batches</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Award size={18} style={{ color: 'var(--spice-gold-hover)' }} />
              <span>Zero chemical colors</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Heart size={18} style={{ color: 'var(--chilli-red)' }} />
              <span>100% Traditional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients & Preparation Details */}
      <div style={{
        marginTop: '50px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '40px'
      }}>
        {/* Ingredients Card */}
        <div style={{
          backgroundColor: 'var(--bg-white)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginBottom: '16px', fontSize: '1.3rem' }}>
            Ingredients & Spices Used
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ingredients.map((ing, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                <Check size={16} style={{ color: 'var(--leaf-green)', flexShrink: 0 }} />
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Nutritional advice */}
        <div style={{
          backgroundColor: 'var(--bg-white)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginBottom: '16px', fontSize: '1.3rem' }}>
            Storage & Serving Instructions
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '12px' }}>
            Store in a cool dry place. Do not use wet spoons. For maximum freshness, keep under dry room temperature or refrigeration. Enjoy it traditionally with hot rice, ghee, or standard South Indian breakfasts (idli/dosa).
          </p>
          <div style={{
            background: 'var(--spice-gold-light)',
            padding: '12px 16px',
            borderRadius: '8px',
            borderLeft: '4px solid var(--spice-gold)',
            fontSize: '0.85rem',
            color: 'var(--spice-gold-hover)',
            fontWeight: 600
          }}>
            🌟 Hand-prepared and packed with organic sun-dried ingredients.
          </div>
        </div>
      </div>
    </div>
  );
};
