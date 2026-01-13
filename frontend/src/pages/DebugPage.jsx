import React, { useEffect, useState } from 'react';
import { getProducts, getCustomers, getInvoices } from '../services/api';

export default function DebugPage() {
  const [debug, setDebug] = useState({});

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API calls...');
        
        const productsRes = await getProducts();
        console.log('Products response:', productsRes);
        console.log('Products data:', productsRes.data);
        console.log('Is array?', Array.isArray(productsRes.data));
        
        const customersRes = await getCustomers();
        console.log('Customers response:', customersRes);
        
        const invoicesRes = await getInvoices();
        console.log('Invoices response:', invoicesRes);
        
        setDebug({
          products: {
            raw: JSON.stringify(productsRes, null, 2),
            data: JSON.stringify(productsRes.data, null, 2),
            isArray: Array.isArray(productsRes.data)
          },
          customers: {
            raw: JSON.stringify(customersRes, null, 2),
            data: JSON.stringify(customersRes.data, null, 2),
            isArray: Array.isArray(customersRes.data)
          },
          invoices: {
            raw: JSON.stringify(invoicesRes, null, 2),
            data: JSON.stringify(invoicesRes.data, null, 2),
            isArray: Array.isArray(invoicesRes.data)
          }
        });
      } catch (error) {
        console.error('API test error:', error);
        setDebug({ error: error.message });
      }
    };
    
    testAPI();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>API Debug Page</h1>
      <pre>{JSON.stringify(debug, null, 2)}</pre>
    </div>
  );
}
