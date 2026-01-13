import React, { useState, useEffect } from 'react';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getCustomers, getProducts } from '../services/api';
import jsPDF from 'jspdf';

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  
  const [formData, setFormData] = useState({
    customer: '',
    total: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes] = await Promise.all([
        getInvoices(),
        getCustomers()
      ]);
      
      const invoicesData = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
      
      setInvoices(invoicesData);
      setCustomers(customersData);
      setError('');
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load data');
      setInvoices([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, formData);
      } else {
        await createInvoice(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save invoice');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await deleteInvoice(id);
        loadData();
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete invoice');
      }
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      customer: invoice.customer,
      total: invoice.total
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      total: ''
    });
    setEditingInvoice(null);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
  };

  const downloadInvoicePDF = (invoice) => {
    const doc = new jsPDF();
    const customer = customers.find(c => c.id === invoice.customer);
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 123, 255);
    doc.text('TRINITY GROCERY', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 105, 32, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.id}`, 20, 50);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 57);
    
    // Customer details
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 70);
    doc.setFontSize(10);
    if (customer) {
      doc.text(`${customer.first_name} ${customer.last_name}`, 20, 77);
      doc.text(`${customer.phone}`, 20, 84);
      if (customer.address) doc.text(`${customer.address}`, 20, 91);
      if (customer.city) doc.text(`${customer.city}, ${customer.zip_code || ''}`, 20, 98);
      if (customer.country) doc.text(`${customer.country}`, 20, 105);
    }
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 115, 190, 115);
    
    // Total
    doc.setFontSize(14);
    doc.text('Total Amount:', 20, 130);
    doc.setFontSize(18);
    doc.setTextColor(0, 123, 255);
    doc.text(`$${parseFloat(invoice.total).toFixed(2)}`, 80, 130);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', 105, 270, { align: 'center' });
    doc.text('Trinity Grocery Store Management System', 105, 277, { align: 'center' });
    
    // Save PDF
    doc.save(`Invoice_${invoice.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading invoices...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Invoice Management</h1>
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
          + Create Invoice
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
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Invoice #</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Customer</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Total</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!Array.isArray(invoices) || invoices.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No invoices found. Click "Create Invoice" to add one.
              </td>
            </tr>
          ) : (
            invoices.map(invoice => (
              <tr key={invoice.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>#{invoice.id}</td>
                <td style={{ padding: '12px' }}>{getCustomerName(invoice.customer)}</td>
                <td style={{ padding: '12px' }}>${parseFloat(invoice.total || 0).toFixed(2)}</td>
                <td style={{ padding: '12px' }}>{new Date(invoice.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => downloadInvoicePDF(invoice)}
                    style={{ 
                      marginRight: '8px', 
                      padding: '5px 10px', 
                      cursor: 'pointer',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    📄 PDF
                  </button>
                  <button 
                    onClick={() => handleEdit(invoice)}
                    style={{ marginRight: '8px', padding: '5px 10px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(invoice.id)}
                    style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Delete
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2>{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Customer *:</label>
                <select
                  required
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Total Amount *:</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="0.00"
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
                  {editingInvoice ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
