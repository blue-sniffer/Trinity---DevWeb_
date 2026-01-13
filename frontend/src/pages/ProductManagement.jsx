import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, searchOpenFoodFacts } from '../services/api';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    brand: '',
    picture: '',
    category: '',
    quantity: '',
    nutritional_info: {}
  });

  // Helper: compute a short nutrition summary (calories, fat, carbs, sugars, proteins, salt)
  const computeNutritionPerQuantity = (nutritional_info = {}, quantity) => {
    try {
      const nutr = nutritional_info || {};
      const n = nutr.nutriments || nutr; // accept either the raw nutriments object or a wrapper
      const qty = parseFloat(quantity) || 0;

      const pick = (key100g, keyServing) => {
        // prefer per 100g value and scale by quantity assuming quantity is grams
        const val100g = n[`${key100g}_100g`] ?? n[key100g];
        const valServing = n[`${keyServing}_serving`] ?? n[`${keyServing}_100g`];
        if (val100g != null && !isNaN(val100g) && qty > 0) {
          return (parseFloat(val100g) * (qty / 100));
        }
        if (valServing != null && !isNaN(valServing)) return parseFloat(valServing);
        return null;
      };

      const kcal = pick('energy-kcal', 'energy-kcal');
      const fat = pick('fat', 'fat');
      const sat = pick('saturated-fat', 'saturated-fat');
      const carbs = pick('carbohydrates', 'carbohydrates');
      const sugars = pick('sugars', 'sugars');
      const proteins = pick('proteins', 'proteins');
      const salt = pick('salt', 'salt');

      return { kcal, fat, sat, carbs, sugars, proteins, salt };
    } catch (err) {
      console.error('computeNutrition error', err);
      return {};
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Load products error:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      setShowModal(false);
      resetForm();
      loadProducts();
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete product');
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      brand: product.brand || '',
      picture: product.picture || '',
      category: product.category || '',
      quantity: product.quantity || '',
      nutritional_info: product.nutritional_info || {}
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      brand: '',
      picture: '',
      category: '',
      quantity: '',
      nutritional_info: {}
    });
    setEditingProduct(null);
  };

  // Nutrition sheet state
  const [showNutritionSheet, setShowNutritionSheet] = useState(false);
  const [selectedNutritionProduct, setSelectedNutritionProduct] = useState(null);

  const closeNutritionSheet = () => {
    setShowNutritionSheet(false);
    setSelectedNutritionProduct(null);
  };

  const handleOpenFoodFactsSearch = async (query) => {
    try {
      // searchOpenFoodFacts returns an array of products (or empty array)
      const results = await searchOpenFoodFacts(query);
      if (!Array.isArray(results) || results.length === 0) {
        alert('No results from OpenFoodFacts');
        return;
      }

      const ofProduct = results[0]; // pick first result

      const nutriments = ofProduct.nutriments || {};

      setFormData({
        ...formData,
        name: ofProduct.product_name || formData.name,
        brand: ofProduct.brands || formData.brand,
        picture: ofProduct.image_url || formData.picture || ofProduct.image_small_url || '',
        category: ofProduct.categories || formData.category,
        nutritional_info: { nutriments: nutriments, serving_size: ofProduct.serving_size }
      });
    } catch (err) {
      console.error('OpenFoodFacts error:', err);
      alert('Failed to fetch product data');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading products...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Product Management</h1>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '20px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Name</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Brand</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Price</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Quantity</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Category</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!Array.isArray(products) || products.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No products found. Click "Add Product" to create one.
              </td>
            </tr>
          ) : (
            products.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>{product.name}</td>
                <td style={{ padding: '12px' }}>{product.brand}</td>
                <td style={{ padding: '12px' }}>${parseFloat(product.price || 0).toFixed(2)}</td>
                <td style={{ padding: '12px' }}>{product.quantity}</td>
                <td style={{ padding: '12px' }}>{product.category}</td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => handleEdit(product)}
                    style={{ marginRight: '8px', padding: '5px 10px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => { setSelectedNutritionProduct(product); setShowNutritionSheet(true); }}
                    title="View nutrition per 1 quantity"
                    style={{ marginLeft: '8px', padding: '5px 8px', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Nutrition
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Search OpenFoodFacts (barcode or name):</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    id="barcode-input"
                    placeholder="Enter barcode or product name (e.g. 'nutella')"
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const barcode = document.getElementById('barcode-input').value;
                      if (barcode) handleOpenFoodFactsSearch(barcode);
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Search
                  </button>
                </div>
              </div>
              {/* Nutrition preview from OpenFoodFacts (if available) */}
              {formData.nutritional_info && formData.nutritional_info.nutriments && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <strong>OpenFoodFacts suggestion:</strong>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#495057' }}>
                    {(() => {
                      const s = computeNutritionPerQuantity(formData.nutritional_info, formData.quantity || 100);
                      return (
                        <div>
                          {s.kcal != null && <div>Calories (est): {Number(s.kcal).toFixed(0)} kcal</div>}
                          {s.fat != null && <div>Fat: {Number(s.fat).toFixed(1)} g</div>}
                          {s.carbs != null && <div>Carbs: {Number(s.carbs).toFixed(1)} g</div>}
                          {s.sugars != null && <div>Sugars: {Number(s.sugars).toFixed(1)} g</div>}
                          {s.proteins != null && <div>Protein: {Number(s.proteins).toFixed(1)} g</div>}
                          {s.salt != null && <div>Salt: {Number(s.salt).toFixed(2)} g</div>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Name *:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Brand:</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Price *:</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Quantity *:</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Picture URL:</label>
                <input
                  type="url"
                  value={formData.picture}
                  onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNutritionSheet && selectedNutritionProduct && (
        <div style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.15)',
          zIndex: 1200,
          maxHeight: '60vh',
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{selectedNutritionProduct.name} — Nutrition (per 1 quantity)</h3>
            <button onClick={closeNutritionSheet} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#333' }}>
            <div><strong>Quantity:</strong> {selectedNutritionProduct.quantity || '—'}</div>
            <div style={{ marginTop: '10px' }}>
              {selectedNutritionProduct.nutritional_info && selectedNutritionProduct.nutritional_info.nutriments ? (
                (() => {
                  // Compute nutrition per one unit: interpret 'per 1 quantity' as nutrition for the product's quantity value
                  const perOne = computeNutritionPerQuantity(selectedNutritionProduct.nutritional_info, selectedNutritionProduct.quantity || 1);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {perOne.kcal != null && <div><strong>Calories</strong><div>{Number(perOne.kcal).toFixed(0)} kcal</div></div>}
                      {perOne.fat != null && <div><strong>Fat</strong><div>{Number(perOne.fat).toFixed(1)} g</div></div>}
                      {perOne.sat != null && <div><strong>Saturated</strong><div>{Number(perOne.sat).toFixed(1)} g</div></div>}
                      {perOne.carbs != null && <div><strong>Carbs</strong><div>{Number(perOne.carbs).toFixed(1)} g</div></div>}
                      {perOne.sugars != null && <div><strong>Sugars</strong><div>{Number(perOne.sugars).toFixed(1)} g</div></div>}
                      {perOne.proteins != null && <div><strong>Protein</strong><div>{Number(perOne.proteins).toFixed(1)} g</div></div>}
                      {perOne.salt != null && <div><strong>Salt</strong><div>{Number(perOne.salt).toFixed(2)} g</div></div>}
                      {(!perOne.kcal && !perOne.fat && !perOne.carbs) && <div style={{ gridColumn: '1 / -1', color: '#6c757d' }}>No nutrition data available for this product.</div>}
                    </div>
                  );
                })()
              ) : (
                <div style={{ color: '#6c757d' }}>No nutrition data available for this product.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
