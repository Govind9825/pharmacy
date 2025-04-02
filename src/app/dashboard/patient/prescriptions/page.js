'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        console.log(user);
        
        const response = await fetch(`/api/prescriptions/patient/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch prescriptions');
        
        const data = await response.json();
        // Ensure data is an array
        console.log(data);
        setPrescriptions(data.prescriptions);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPrescription(null);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Prescriptions</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Prescription Records
              </h3>
              <span className="text-sm text-gray-500">
                {prescriptions.length} prescriptions
              </span>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {prescriptions.length > 0 ? (
              prescriptions.map(prescription => (
                <li key={prescription.id}>
                  <div 
                    className="block hover:bg-gray-50 cursor-pointer p-4" 
                    onClick={() => handleViewDetails(prescription)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">
                          Prescription #{prescription.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Prescribed by: Dr. {prescription.doctor_name}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        prescription.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {prescription.is_expired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Date: {new Date(prescription.created_at).toLocaleDateString()}
                    </div>
                    {prescription.diagnosis && (
                      <div className="mt-1 text-sm text-gray-500">
                        Diagnosis: {prescription.diagnosis}
                      </div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h3>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {showDetails && selectedPrescription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold mb-4">Prescription Details</h2>
                <button 
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  <div className="mt-4 space-y-2">
                    <p><span className="font-medium">Prescription ID:</span> #{selectedPrescription.id}</p>
                    <p><span className="font-medium">Date Issued:</span> {new Date(selectedPrescription.created_at).toLocaleDateString()}</p>
                    <p><span className="font-medium">Prescribed By:</span> Dr. {selectedPrescription.doctor_name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Medical Information</h3>
                  <div className="mt-4 space-y-2">
                    <p><span className="font-medium">Diagnosis:</span> {selectedPrescription.diagnosis || 'No diagnosis provided'}</p>
                    <p><span className="font-medium">Notes:</span> {selectedPrescription.notes || 'No additional notes'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prescribed Medications</h3>
                {selectedPrescription.items?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedPrescription.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{item.medicine_name}</h4>
                            <p className="text-sm text-gray-500">{item.dosage}</p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Frequency</p>
                            <p className="text-sm">{item.frequency}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="text-sm">{item.duration}</p>
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
                  </div>
                ) : (
                  <p className="text-gray-500">No medications prescribed</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Print Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}