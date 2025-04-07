'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

export default function PrescriptionDetailPage({ params }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Properly unwrap the params using React.use()
  const unwrappedParams = use(params);
  const prescriptionId = unwrappedParams?.id;

  useEffect(() => {
    let isMounted = true;

    const fetchPrescription = async () => {
      try {
        // Don't proceed if we don't have a valid ID
        if (!prescriptionId) {
          if (isMounted) {
            setLoading(false);
            setError('Invalid prescription ID');
          }
          return;
        }

        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!token || !userData || userData.role !== 'doctor') {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Prescription not found');
          }
          throw new Error('Failed to fetch prescription');
        }

        const data = await response.json();
        if (isMounted) {
          setPrescription(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrescription();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [prescriptionId, router]);

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/dashboard/doctor/prescriptions"
              className="text-indigo-600 hover:text-indigo-900"
            >
              ← Back to Prescriptions
            </Link>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/doctor/prescriptions"
            className="text-indigo-600 hover:text-indigo-900"
          >
            ← Back to Prescriptions
          </Link>
        </div>

        {prescription ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Prescription Details
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Prescription #{prescription.id}
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Patient</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {prescription.patient_name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {prescription.diagnosis}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {prescription.notes || 'No additional notes'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(prescription.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Medicines</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {prescription.medicines?.map((medicine, index) => (
                        <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">
                              {medicine.medicine_name} - {medicine.dosage}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="text-gray-500">
                              {medicine.frequency} for {medicine.duration}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">Prescription not found</p>
          </div>
        )}
      </div>
    </div>
  );
}