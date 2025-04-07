'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function MakeOrder() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const prescriptionId = searchParams.get('prescriptionId');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData || userData.role !== 'patient') {
      router.push('/login');
      return;
    }

    fetchPrescriptions(userData.id);
    fetchInventory();

  }, []);

  const fetchPrescriptions = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/prescriptions/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prescriptions');
      }

      const data = await response.json();
      const activePrescriptions = data.prescriptions.filter(
        p => p.status === 'active' && !p.is_expired
      );
      setPrescriptions(activePrescriptions);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
  
    const loadData = async () => {
        const userData = JSON.parse(localStorage.getItem('user'));
      const patientId = userData.id;
      const fetchedPrescriptions = await fetchPrescriptions(patientId);
      
      // Handle URL prescription ID after fetching prescriptions
      const searchParams = new URLSearchParams(window.location.search);
      const prescriptionId = searchParams.get('prescriptionId');
      
      if (prescriptionId && fetchedPrescriptions.length > 0) {
        const prescription = fetchedPrescriptions.find(p => p.id === parseInt(prescriptionId));
        if (prescription) {
          setSelectedPrescription(prescription);
          setShowDetails(true);
        }
      }
    };
  
    loadData();
  }, []); // Empty dependency array since we're using URLSearchParams

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await response.json();
      setInventory(data.inventory);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setError('');
    setSuccess('');
    
    // Initialize cart with prescription items that are available in inventory
    const initialCart = prescription.items
      .map(item => {
        const inventoryItem = inventory.find(
          inv => inv.medicine_name.toLowerCase() === item.medicine_name.toLowerCase()
        );
        return inventoryItem ? {
          ...item,
          inventory_id: inventoryItem.id,
          available: inventoryItem.stock,
          selectedQuantity: Math.min(item.quantity, inventoryItem.stock),
          price: inventoryItem.price
        } : null;
      })
      .filter(item => item !== null && item.available > 0);
    
    setCart(initialCart);
  };

  const handleQuantityChange = (index, quantity) => {
    const newCart = [...cart];
    const maxQuantity = Math.min(
      newCart[index].available,
      selectedPrescription.items.find(
        item => item.medicine_name.toLowerCase() === newCart[index].medicine_name.toLowerCase()
      ).quantity
    );
    
    newCart[index].selectedQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    setCart(newCart);
  };

  const handleRemoveItem = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (cart.length === 0) {
        throw new Error('Please select at least one medicine to order');
      }
      
      const totalPrice = cart.reduce(
        (sum, item) => sum + (item.price * item.selectedQuantity),
        0
      );
      
      const orderData = {
        patient_id: userData.id,
        prescription_id: selectedPrescription.id,
        total_price: totalPrice,
        items: cart.map(item => ({
          inventory_id: item.inventory_id,
          quantity: item.selectedQuantity,
          price: item.price
        }))
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }
      
      const data = await response.json();
      setSuccess('Order placed successfully!');
      setCart([]);
      setSelectedPrescription(null);
      
      // Redirect to order details after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/patient/orders/${data.order.id}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">PharmaCare</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard/patient"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/patient/prescriptions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Prescriptions
                </Link>
                <Link
                  href="/dashboard/patient/make-order"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Make Order
                </Link>
                <Link
                  href="/dashboard/patient/orders"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Orders
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Make New Order</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
                  {success}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Select Prescription</h3>
                {prescriptions.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500">No active prescriptions found</p>
                    <Link 
                      href="/dashboard/patient/prescriptions" 
                      className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
                    >
                      View all prescriptions
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <div 
                        key={prescription.id} 
                        className={`border rounded-lg overflow-hidden cursor-pointer ${selectedPrescription?.id === prescription.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                        onClick={() => handleSelectPrescription(prescription)}
                      >
                        <div className="px-4 py-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">
                              Prescription #{prescription.id}
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Prescribed by Dr. {prescription.doctor_name} on {new Date(prescription.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPrescription && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Order Items</h3>
                  {cart.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-gray-500">No available medications for this prescription</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.medicine_name}</h4>
                              <p className="text-sm text-gray-500">{item.dosage}</p>
                              <p className="text-sm text-gray-500">Available: {item.available}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.min(item.available, selectedPrescription.items.find(
                                    pItem => pItem.medicine_name.toLowerCase() === item.medicine_name.toLowerCase()
                                  ).quantity)}
                                  value={item.selectedQuantity}
                                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">${(item.price * item.selectedQuantity).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">${item.price} each</p>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {item.instructions && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Instructions</p>
                              <p className="text-sm whitespace-pre-line">{item.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className="mt-6 border-t border-gray-200 pt-4">
                        <div className="flex justify-between">
                          <span className="text-lg font-medium">Total:</span>
                          <span className="text-lg font-bold">
                            ${cart.reduce((sum, item) => sum + (item.price * item.selectedQuantity), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-4">
                          <button
                            onClick={handlePlaceOrder}
                            disabled={loading || cart.length === 0}
                            className={`w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${(loading || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {loading ? 'Placing Order...' : 'Place Order'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}