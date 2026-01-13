import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => 
  axios.post(`${API_URL}/token/`, { username, password });

export const refreshToken = (refresh) => 
  axios.post(`${API_URL}/token/refresh/`, { refresh });

// Products
export const getProducts = () => api.get('/products/');
export const createProduct = (data) => api.post('/products/', data);
export const updateProduct = (id, data) => api.put(`/products/${id}/`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}/`);

// Customers
export const getCustomers = () => api.get('/customers/');
export const createCustomer = (data) => api.post('/customers/', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}/`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}/`);

// Invoices
export const getInvoices = () => api.get('/invoices/');
export const createInvoice = (data) => api.post('/invoices/', data);
export const updateInvoice = (id, data) => api.put(`/invoices/${id}/`, data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}/`);

// OpenFoodFacts
export const searchOpenFoodFacts = async (query) => {
  try {
    const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl`, {
      params: {
        search_terms: query,
        search_simple: 1,
        json: 1,
        page_size: 10
      }
    });
    return response.data.products || [];
  } catch (error) {
    console.error('OpenFoodFacts error:', error);
    return [];
  }
};

export default api;
