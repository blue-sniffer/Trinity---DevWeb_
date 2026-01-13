import React, { useState, useEffect } from 'react';
import { getProducts, getCustomers, getInvoices } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    averageInvoiceAmount: 0,
    inventoryValue: 0,
    recentInvoices: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, customersRes, invoicesRes] = await Promise.all([
        getProducts(),
        getCustomers(),
        getInvoices()
      ]);

      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
      const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];

      // Calculate KPIs
      const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const averageInvoiceAmount = invoices.length > 0 ? totalRevenue / invoices.length : 0;
      const inventoryValue = products.reduce((sum, prod) => sum + (parseFloat(prod.price) * prod.quantity), 0);

      // Get recent invoices (last 5)
      const recentInvoices = invoices
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      // Calculate top products by inventory value (price * quantity)
      const topProducts = products
        .map(p => ({
          ...p,
          inventoryValue: parseFloat(p.price) * p.quantity
        }))
        .sort((a, b) => b.inventoryValue - a.inventoryValue)
        .slice(0, 5);

      setKpis({
        totalRevenue,
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalInvoices: invoices.length,
        averageInvoiceAmount,
        inventoryValue,
        recentInvoices,
        topProducts
      });

      setError('');
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard - Key Performance Indicators</h1>

      {error && <div className="error">{error}</div>}

      <div className="kpi-cards">
        <div className="kpi-card revenue">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>Total Revenue</h3>
            <p className="kpi-value">{formatCurrency(kpis.totalRevenue)}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <h3>Total Products</h3>
            <p className="kpi-value">{kpis.totalProducts}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>Total Customers</h3>
            <p className="kpi-value">{kpis.totalCustomers}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🧾</div>
          <div className="kpi-content">
            <h3>Total Invoices</h3>
            <p className="kpi-value">{kpis.totalInvoices}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <h3>Average Invoice</h3>
            <p className="kpi-value">{formatCurrency(kpis.averageInvoiceAmount)}</p>
          </div>
        </div>

        <div className="kpi-card inventory">
          <div className="kpi-icon">🏪</div>
          <div className="kpi-content">
            <h3>Inventory Value</h3>
            <p className="kpi-value">{formatCurrency(kpis.inventoryValue)}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Recent Invoices</h2>
          {kpis.recentInvoices.length === 0 ? (
            <p className="no-data">No invoices yet</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {kpis.recentInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>#{invoice.id}</td>
                    <td className="amount">{formatCurrency(invoice.total)}</td>
                    <td>{formatDate(invoice.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Top Products by Inventory Value</h2>
          {kpis.topProducts.length === 0 ? (
            <p className="no-data">No products yet</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {kpis.topProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td className="amount">{formatCurrency(product.inventoryValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
