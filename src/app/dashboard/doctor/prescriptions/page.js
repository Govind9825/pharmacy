'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!token || !userData || userData.role !== 'doctor') {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/prescriptions/doctor/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }

        const data = await response.json();
        setPrescriptions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
          <Link
            href="/dashboard/doctor/create-prescription"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create New Prescription
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {prescriptions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No prescriptions found</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {prescriptions.map((prescription) => (
                <li key={prescription.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <Link href={`/dashboard/doctor/prescriptions/${prescription.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          Prescription #{prescription.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Patient: {prescription.patient_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Date: {new Date(prescription.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                          prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prescription.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}