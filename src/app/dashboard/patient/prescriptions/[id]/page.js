'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';

export default function PrescriptionDetails({ params }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const resolvedParams = use(params);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData || userData.role !== 'patient') {
      router.push('/login');
      return;
    }

    fetchPrescription(resolvedParams.id, token);
  }, [resolvedParams.id]);

  const fetchPrescription = async (id, token) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch prescription');
      setPrescription(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!prescription) return <div>Prescription not found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/dashboard/patient/prescriptions"
              className="text-indigo-600 hover:text-indigo-900 mb-4 inline-block"
            >
              ← Back to Prescriptions
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Prescription Details</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {prescription && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    Prescription #{prescription.id}
                  </h2>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    prescription.is_expired 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {prescription.is_expired ? 'Expired' : 'Active'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Prescribed by Dr. {prescription.doctor_name} on {new Date(prescription.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Medications
                    </h3>
                    {prescription.items && prescription.items.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Medication
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dosage
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Frequency
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duration
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {prescription.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.medicine_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.dosage}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.frequency}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.duration}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No medications found for this prescription.</p>
                    )}
                  </div>

                  {!prescription.is_expired && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => router.push(`/dashboard/patient/orders/new?prescription=${prescription.id}`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Order Medications
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 