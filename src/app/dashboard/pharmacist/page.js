'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PharmacistDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData || userData.role !== 'pharmacist') {
      router.push('/login');
      return;
    }

    fetchOrders(token);
  }, []);

  const fetchOrders = async (token) => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to process order');
      fetchOrders(token); // Refresh orders list
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price) => {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Pharmacist Dashboard</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          Order #{order.id}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Patient: {order.patient_name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Items: {order.item_count || 0}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Total: ${formatPrice(order.total_price)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Date: {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleProcessOrder(order.id)}
                            className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Process Order
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}