'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData || userData.role !== 'patient') {
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchFullPrescriptions(userData.id);
  }, []);

  const fetchFullPrescriptions = async (patientId) => {
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
      if (err.message.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (prescription) => {
    try {
      setSelectedPrescription(prescription);
      setShowDetails(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPrescription(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="text-center py-8">Loading prescriptions...</div>;

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
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/patient/prescriptions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Prescriptions
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
              <h2 className="text-2xl font-bold mb-6">Welcome, {user?.name}</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                  {error}
                </div>
              )}

              <div className="mb-8">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Active Prescriptions</h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    {prescriptions.length}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Current Prescriptions</h3>
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
                      <div key={prescription.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-indigo-600">
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
                        <div className="p-4">
                          {prescription.diagnosis && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h5>
                              <p className="text-sm text-gray-600">{prescription.diagnosis}</p>
                            </div>
                          )}
                          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-right">
                            <button
                              onClick={() => handleViewDetails(prescription)}
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View full details →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

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
                    <p><span className="font-medium">Status:</span> <span className="text-green-600">Active</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Medical Information</h3>
                  <div className="mt-4 space-y-2">
                    {selectedPrescription.diagnosis && (
                      <p><span className="font-medium">Diagnosis:</span> {selectedPrescription.diagnosis}</p>
                    )}
                    {selectedPrescription.notes && (
                      <p><span className="font-medium">Notes:</span> {selectedPrescription.notes}</p>
                    )}
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