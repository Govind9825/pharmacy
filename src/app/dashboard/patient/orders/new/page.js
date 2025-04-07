'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function NewOrder() {
  const [pharmacists, setPharmacists] = useState([]);
  const [selectedPharmacist, setSelectedPharmacist] = useState('');
  const [prescriptionDetails, setPrescriptionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const prescriptionId = searchParams.get('prescription');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData || userData.role !== 'patient') {
      router.push('/login');
      return;
    }

    fetchPharmacists(token);
    if (prescriptionId) {
      fetchPrescriptionDetails(prescriptionId, token);
    }
  }, [prescriptionId]);

  const fetchPharmacists = async (token) => {
    try {
      const response = await fetch('/api/pharmacists', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch pharmacists');
      setPharmacists(data);
    } catch (err) {
      console.error('Error fetching pharmacists:', err);
      setError(err.message);
    }
  };

  const fetchPrescriptionDetails = async (id, token) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch prescription details');
      setPrescriptionDetails(data);
    } catch (err) {
      console.error('Error fetching prescription details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPharmacist) {
      setError('Please select a pharmacist');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pharmacist_id: selectedPharmacist,
          prescription_id: prescriptionId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create order');
      
      router.push('/dashboard/patient/orders');
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
            <Link href="/dashboard/patient/orders" className="text-indigo-600 hover:text-indigo-900">
              ← Back to Orders
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {prescriptionDetails && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Prescription Details</h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Doctor</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Dr. {prescriptionDetails.doctor_name}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Prescribed Medicines</dt>
                    <dd className="mt-1">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {prescriptionDetails.items?.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.medicine_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dosage}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.frequency}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select a Pharmacist</h3>
              <form onSubmit={handleSubmit}>
                <div className="mt-2 max-w-xl">
                  <select
                    value={selectedPharmacist}
                    onChange={(e) => setSelectedPharmacist(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a pharmacist</option>
                    {pharmacists.map((pharmacist) => (
                      <option key={pharmacist.id} value={pharmacist.id}>
                        {pharmacist.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-5">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 