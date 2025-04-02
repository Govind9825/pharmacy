'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PrescriptionDetailPage() {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to extract ID from URL
  const getPrescriptionId = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.length - 1]; // Get the last part of the URL
    }
    return null;
  };

  useEffect(() => {
    const prescriptionId = getPrescriptionId();
    if (!prescriptionId || isNaN(prescriptionId)) {
      setLoading(false);
      return;
    }

    const fetchPrescription = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
    
        const response = await fetch(`/api/prescriptions/patient/${prescriptionId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
    
        if (response.status === 401) {
          // Token expired or invalid - redirect to login
          handleLogout();
          return;
        }
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch prescription details');
        }
    
        const data = await response.json();
        if (!data.success) {
          throw new Error('Failed to load prescription data');
        }
    
        setPrescription(data.prescription);
        
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [router]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (!prescription) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Prescription not found</h3>
        <Link href="/dashboard/patient/prescriptions" className="mt-4 text-indigo-600 hover:text-indigo-500">
          Back to prescriptions list
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard/patient/prescriptions" className="inline-flex items-center text-indigo-600 hover:text-indigo-500">
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to prescriptions
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Prescription Details
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  #{prescription.id} - {prescription.patient_name}
                </p>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                prescription.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {prescription.is_expired ? 'Expired' : 'Active'}
              </span>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Prescription ID</dt>
                <dd className="mt-1 text-sm text-gray-900">#{prescription.id}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Date Issued</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(prescription.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Prescribed By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Dr. {prescription.doctor_name}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {prescription.is_expired ? (
                    <span className="text-red-600">Expired</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {prescription.diagnosis || 'No diagnosis provided'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Doctor's Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {prescription.notes || 'No additional notes'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Prescribed Medicines
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {prescription.items?.length || 0} medicines prescribed
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {prescription.items && prescription.items.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {prescription.items.map((item, index) => (
                  <li key={index} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.medicine_name}</p>
                        <p className="text-sm text-gray-500">{item.dosage}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Frequency</p>
                        <p className="text-sm text-gray-900">{item.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm text-gray-900">{item.duration}</p>
                      </div>
                    </div>
                    {item.instructions && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Special Instructions</p>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{item.instructions}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines prescribed</h3>
                <p className="mt-1 text-sm text-gray-500">This prescription doesn't contain any medicines.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Prescription
          </button>
        </div>
      </div>
    </div>
  );
}