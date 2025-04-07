'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientDetails({ params }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const patientId = await Promise.resolve(params.id);
        const response = await fetch(`/api/patients/${patientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch patient details');
        }
        
        setPatient(data);
      } catch (err) {
        console.error('Error fetching patient details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.id, router]);

  const formatPrice = (price) => {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
            <Link href="/dashboard/doctor/patients" className="text-indigo-600 hover:text-indigo-900">
              ← Back to Patients
            </Link>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
            <Link href="/dashboard/doctor/patients" className="text-indigo-600 hover:text-indigo-900">
              ← Back to Patients
            </Link>
          </div>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
            <p>Patient not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
            <Link href="/dashboard/doctor/patients" className="text-indigo-600 hover:text-indigo-900">
              ← Back to Patients
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.email}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.address}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(patient.date_of_birth).toLocaleDateString()}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.gender}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Medical History</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.medical_history || 'No significant medical history'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Prescriptions</h2>
            {patient.prescriptions?.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="divide-y divide-gray-200">
                  {patient.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-4">
                      <div className="mb-2">
                        <span className="font-medium">Date: </span>
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Doctor: </span>
                        {prescription.doctor_name}
                      </div>
                      {prescription.diagnosis && (
                        <div className="mb-2">
                          <span className="font-medium">Diagnosis: </span>
                          {prescription.diagnosis}
                        </div>
                      )}
                      {prescription.notes && (
                        <div className="mb-2">
                          <span className="font-medium">Notes: </span>
                          {prescription.notes}
                        </div>
                      )}
                      <div className="mt-4">
                        <span className="font-medium">Medicines:</span>
                        <div className="mt-2 overflow-x-auto">
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
                              {prescription.items.map((item, index) => (
                                <tr key={item.id || index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.medicine_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dosage}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.frequency}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No recent prescriptions</p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
            {patient.recent_orders?.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {patient.recent_orders.map((order) => (
                    <li key={order.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600">
                          Order #{order.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.pharmacist_name ? `Handled by ${order.pharmacist_name}` : 'Pending'}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-gray-500">
                        <div>Status: {order.status}</div>
                        <div>Date: {new Date(order.order_date).toLocaleDateString()}</div>
                      </div>
                      {order.items?.length > 0 && (
                        <div className="mt-4">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {order.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.medicine_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dosage}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatPrice(item.price)}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">Total:</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatPrice(order.total_price)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500">No recent orders</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}