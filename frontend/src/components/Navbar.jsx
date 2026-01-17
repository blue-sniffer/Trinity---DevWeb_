import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/api';
import '../styles/Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('user_role');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={userRole === 'admin' ? '/dashboard' : '/customer'} className="brand-logo">
          🏪 Trinity Store
        </Link>
      </div>

      {userRole && (
        <>
          <div className="navbar-menu">
            {userRole === 'admin' && (
              <>
                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                  📊 Dashboard
                </Link>
                <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                  📦 Products
                </Link>
                <Link to="/customers" className={`nav-link ${isActive('/customers')}`}>
                  👥 Customers
                </Link>
                <Link to="/invoices" className={`nav-link ${isActive('/invoices')}`}>
                  🧾 Invoices
                </Link>
              </>
            )}
            {userRole === 'customer' && (
              <>
                <Link to="/customer" className={`nav-link ${isActive('/customer')}`}>
                  🛍️ Shop
                </Link>
                <Link to="/invoices" className={`nav-link ${isActive('/invoices')}`}>
                  🧾 My Orders
                </Link>
              </>
            )}
          </div>

          <div className="navbar-user">
            <span className="username">👤 {username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
