import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../components/ProductCard';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Search, Flame, Filter, RefreshCw, PlusCircle, X } from 'lucide-react';

interface ShopProps {
  setSelectedProduct: (product: Product) => void;
  setCurrentTab: (tab: string) => void;
}

export const Shop: React.FC<ShopProps> = ({ setSelectedProduct, setCurrentTab }) => {
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpice, setSelectedSpice] = useState<string>('');

  // Admin Modals & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // Add Product Form States
  const [nameEn, setNameEn] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTe, setDescTe] = useState('');
  const [price250, setPrice250] = useState('');
  const [price500, setPrice500] = useState('');
  const [price1000, setPrice1000] = useState('');
  const [spiceLevel, setSpiceLevel] = useState('MEDIUM');
  const [category, setCategory] = useState('PICKLE');
  const [imageUrl, setImageUrl] = useState('');
  const [weight1, setWeight1] = useState('250g');
  const [weight2, setWeight2] = useState('500g');
  const [weight3, setWeight3] = useState('1kg');

  // Edit Product Form States
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameTe, setEditNameTe] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editDescTe, setEditDescTe] = useState('');
  const [editPrice250, setEditPrice250] = useState('');
  const [editPrice500, setEditPrice500] = useState('');
  const [editPrice1000, setEditPrice1000] = useState('');
  const [editSpiceLevel, setEditSpiceLevel] = useState('MEDIUM');
  const [editCategory, setEditCategory] = useState('PICKLE');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editWeight1, setEditWeight1] = useState('250g');
  const [editWeight2, setEditWeight2] = useState('500g');
  const [editWeight3, setEditWeight3] = useState('1kg');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSpice) params.append('spiceLevel', selectedSpice);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product catalog');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while fetching products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSpice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentTab('product-detail');
  };

  // 1. Toggle stock status
  const handleToggleStock = async (product: Product) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inStock: !product.inStock })
      });
      if (response.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: !p.inStock } : p));
      } else {
        alert('Failed to update stock status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating stock status.');
    }
  };

  // 2. Delete product listing
  const handleDeleteProduct = async (product: Product) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== product.id));
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting product.');
    }
  };

  // 3. Add Product submit
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdmin(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nameEn,
          nameTe,
          descriptionEn: descEn,
          descriptionTe: descTe,
          price250g: parseFloat(price250),
          price500g: parseFloat(price500),
          price1kg: parseFloat(price1000),
          spiceLevel,
          category,
          imageUrl: imageUrl || '/images/roti.jpg',
          inStock: true,
          weight1,
          weight2,
          weight3
        })
      });
      if (response.ok) {
        setShowAddModal(false);
        setNameEn('');
        setNameTe('');
        setDescEn('');
        setDescTe('');
        setPrice250('');
        setPrice500('');
        setPrice1000('');
        setImageUrl('');
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add product');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding product.');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // 4. Edit Product submit
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmittingAdmin(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nameEn: editNameEn,
          nameTe: editNameTe,
          descriptionEn: editDescEn,
          descriptionTe: editDescTe,
          price250g: parseFloat(editPrice250),
          price500g: parseFloat(editPrice500),
          price1kg: parseFloat(editPrice1000),
          spiceLevel: editSpiceLevel,
          category: editCategory,
          imageUrl: editImageUrl,
          weight1: editWeight1,
          weight2: editWeight2,
          weight3: editWeight3
        })
      });
      if (response.ok) {
        setEditingProduct(null);
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating product.');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // Open edit modal and load product fields
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditNameEn(product.nameEn);
    setEditNameTe(product.nameTe);
    setEditDescEn(product.descriptionEn);
    setEditDescTe(product.descriptionTe);
    setEditPrice250(String(product.price250g));
    setEditPrice500(String(product.price500g));
    setEditPrice1000(String(product.price1kg));
    setEditSpiceLevel(product.spiceLevel);
    setEditCategory(product.category);
    setEditImageUrl(product.imageUrl);
    setEditWeight1(product.weight1 || (product.category === 'ROTI' ? '1 Roti' : '250g'));
    setEditWeight2(product.weight2 || (product.category === 'ROTI' ? '5 Rotis' : '500g'));
    setEditWeight3(product.weight3 || (product.category === 'ROTI' ? '10 Rotis' : '1kg'));
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '30px 0 60px 0' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--chilli-red)', margin: 0 }}>
            {t('navShop')}
          </h2>
          {user && user.role === 'ADMIN' && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'var(--chilli-red)',
                color: 'white',
                border: 'none',
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.2s',
                padding: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Add New Pickle / Chutney"
            >
              <PlusCircle size={26} />
            </button>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Handcrafted pickles with farm-fresh ingredients. Authentic Andhra flavor.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        backgroundColor: 'var(--bg-white)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '40px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexGrow: 1, maxWidth: '400px', position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            placeholder={t('allCategories') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingRight: '45px', width: '100%' }}
          />
          <button type="submit" style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}>
            <Search size={20} />
          </button>
        </form>

        {/* Filter Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Category Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control"
              style={{ padding: '8px 12px', minWidth: '150px' }}
            >
              <option value="">{t('allCategories')}</option>
              <option value="PICKLE">{t('categoryPickles')}</option>
              <option value="NON_VEG">{t('categoryNonVeg')}</option>
              <option value="DRY_CHUTNEY">Dry Chutneys</option>
              <option value="FRESH_CHUTNEY">{t('categoryChutneys')}</option>
              <option value="ROTI">{t('categoryRotis')}</option>
            </select>
          </div>

          {/* Spice Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} style={{ color: 'var(--chilli-red)' }} />
            <select
              value={selectedSpice}
              onChange={(e) => setSelectedSpice(e.target.value)}
              className="form-control"
              style={{ padding: '8px 12px', minWidth: '150px' }}
            >
              <option value="">{t('filterSpice')}</option>
              <option value="MILD">MILD</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HOT">HOT</option>
              <option value="ANDHRA_HOT">ANDHRA HOT 🔥</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div style={{ backgroundColor: '#FFECEC', color: '#C62828', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <RefreshCw size={40} className="spin-animation" style={{ color: 'var(--chilli-red)' }} />
          <p style={{ marginTop: '16px', fontWeight: 600 }}>Loading pickles catalogue...</p>
        </div>
      ) : (
        /* Products Grid */
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClickDetail={() => handleCardClick(product)}
                isAdmin={user?.role === 'ADMIN'}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteProduct}
                onToggleStock={handleToggleStock}
              />
            ))}
          </div>
          
          {products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              No chutneys match your filter criteria. Try resetting.
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes spin { 100% { transform:rotate(360deg); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          padding: 'calc(var(--header-height) + 20px) 20px 20px 20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-white)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            maxWidth: '550px',
            width: '100%',
            padding: '30px',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--chilli-red)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={22} /> Add New Pickle / Chutney
            </h3>

            <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="responsive-grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Name (English)</label>
                  <input type="text" className="form-control" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Name (Telugu)</label>
                  <input type="text" className="form-control" value={nameTe} onChange={(e) => setNameTe(e.target.value)} required />
                </div>
              </div>

              <div className="responsive-grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description (English)</label>
                  <textarea className="form-control" value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={2} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description (Telugu)</label>
                  <textarea className="form-control" value={descTe} onChange={(e) => setDescTe(e.target.value)} rows={2} required />
                </div>
              </div>

              <div className="responsive-grid-form-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Price ({category === 'ROTI' ? '1 Roti' : '250g'})</label>
                  <input type="number" className="form-control" value={price250} onChange={(e) => setPrice250(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Price ({category === 'ROTI' ? '5 Rotis' : '500g'})</label>
                  <input type="number" className="form-control" value={price500} onChange={(e) => setPrice500(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Price ({category === 'ROTI' ? '10 Rotis' : '1kg'})</label>
                  <input type="number" className="form-control" value={price1000} onChange={(e) => setPrice1000(e.target.value)} required />
                </div>
              </div>

              {/* Weight Labels configuration */}
              <div className="responsive-grid-form-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{category === 'ROTI' ? 'Option 1 Label' : 'Weight 1 Label'}</label>
                  <input type="text" className="form-control" value={weight1} onChange={(e) => setWeight1(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{category === 'ROTI' ? 'Option 2 Label' : 'Weight 2 Label'}</label>
                  <input type="text" className="form-control" value={weight2} onChange={(e) => setWeight2(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{category === 'ROTI' ? 'Option 3 Label' : 'Weight 3 Label'}</label>
                  <input type="text" className="form-control" value={weight3} onChange={(e) => setWeight3(e.target.value)} required />
                </div>
              </div>

              <div className="responsive-grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Spice Level</label>
                  <select className="form-control" value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)}>
                    <option value="MILD">Mild</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HOT">Hot</option>
                    <option value="ANDHRA_HOT">Andhra Hot</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
                  <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="PICKLE">Vegetarian Pickle</option>
                    <option value="NON_VEG">Non-Vegetarian Pickle</option>
                    <option value="DRY_CHUTNEY">Dry Chutney Powder</option>
                    <option value="FRESH_CHUTNEY">Fresh Chutney</option>
                    <option value="ROTI">Soft Roti</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Image URL</label>
                <input type="text" className="form-control" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="E.g., /images/roti.jpg" required />
              </div>

              <button
                type="submit"
                disabled={submittingAdmin}
                className="btn btn-primary"
                style={{ padding: '12px', borderRadius: '25px', fontSize: '1rem', marginTop: '10px', width: '100%' }}
              >
                {submittingAdmin ? 'Adding Pickle...' : 'Add Pickle / Chutney'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          padding: 'calc(var(--header-height) + 20px) 20px 20px 20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-white)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            maxWidth: '550px',
            width: '100%',
            padding: '30px',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <button 
              onClick={() => setEditingProduct(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--chilli-red)', marginBottom: '20px' }}>
              Edit Product: {editingProduct.nameEn}
            </h3>

            <form onSubmit={handleEditProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="responsive-grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Name (English)</label>
                  <input type="text" className="form-control" value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Name (Telugu)</label>
                  <input type="text" className="form-control" value={editNameTe} onChange={(e) => setEditNameTe(e.target.value)} required />
                </div>
              </div>

              <div className="responsive-grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description (English)</label>
                  <textarea className="form-control" value={editDescEn} onChange={(e) => setEditDescEn(e.target.value)} rows={2} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description (Telugu)</label>
                  <textarea className="form-control" value={editDescTe} onChange={(e) => setEditDescTe(e.target.value)} rows={2} required />
                </div>
              </div>

              <div className="responsive-grid-form-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Price ({editCategory === 'ROTI' ? '1 Roti' : '250g'})</label>
                  <input type="number" className="form-control" value={editPrice250} onChange={(e) => setEditPrice250(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Price ({editCategory === 'ROTI' ? '5 Rotis' : '500g'})</label>
                  <input type="number" className="form-control" value={editPrice500} onChange={(e) => setEditPrice500(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Price ({editCategory === 'ROTI' ? '10 Rotis' : '1kg'})</label>
                  <input type="number" className="form-control" value={editPrice1000} onChange={(e) => setEditPrice1000(e.target.value)} required />
                </div>
              </div>

              {/* Weight Labels configuration */}
              <div className="responsive-grid-form-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{editCategory === 'ROTI' ? 'Option 1 Label' : 'Weight 1 Label'}</label>
                  <input type="text" className="form-control" value={editWeight1} onChange={(e) => setEditWeight1(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{editCategory === 'ROTI' ? 'Option 2 Label' : 'Weight 2 Label'}</label>
                  <input type="text" className="form-control" value={editWeight2} onChange={(e) => setEditWeight2(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{editCategory === 'ROTI' ? 'Option 3 Label' : 'Weight 3 Label'}</label>
                  <input type="text" className="form-control" value={editWeight3} onChange={(e) => setEditWeight3(e.target.value)} required />
                </div>
              </div>

              <div className="responsive-grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Spice Level</label>
                  <select className="form-control" value={editSpiceLevel} onChange={(e) => setEditSpiceLevel(e.target.value)}>
                    <option value="MILD">Mild</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HOT">Hot</option>
                    <option value="ANDHRA_HOT">Andhra Hot</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
                  <select className="form-control" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                    <option value="PICKLE">Vegetarian Pickle</option>
                    <option value="NON_VEG">Non-Vegetarian Pickle</option>
                    <option value="DRY_CHUTNEY">Dry Chutney Powder</option>
                    <option value="FRESH_CHUTNEY">Fresh Chutney</option>
                    <option value="ROTI">Soft Roti</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Image URL</label>
                <input type="text" className="form-control" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} required />
              </div>

              <button
                type="submit"
                disabled={submittingAdmin}
                className="btn btn-primary"
                style={{ padding: '12px', borderRadius: '25px', fontSize: '1rem', marginTop: '10px', width: '100%' }}
              >
                {submittingAdmin ? 'Saving Changes...' : 'Save Product Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
