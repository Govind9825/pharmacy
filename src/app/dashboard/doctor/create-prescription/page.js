'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MedicineForm from '@/app/components/MedicineForm';
import Link from 'next/link';

export default function CreatePrescriptionPage() {
  const [patient, setPatient] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  const patientId = searchParams.get('patientId');

  useEffect(() => {
    if (patientId) {
      const fetchPatient = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/patients/${patientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!response.ok) throw new Error('Failed to fetch patient');
          const data = await response.json();
          setPatient(data);
        } catch (error) {
          console.error(error);
          setError('Failed to load patient data');
        }
      };

      fetchPatient();
    }
  }, [patientId]);

  const handleAddMedicine = (medicine) => {
    setMedicines([...medicines, medicine]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (medicines.length === 0) {
      setError('Please add at least one medicine');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/prescriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: patientId || patient?.id,
          diagnosis,
          notes,
          medicines
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create prescription');
      }

      const data = await response.json();
      
      if (!data.prescriptionId) {
        throw new Error('Failed to get prescription ID from response');
      }
      
      router.replace(`/dashboard/doctor/prescriptions/${data.prescriptionId}`);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard/doctor/prescriptions" className="inline-flex items-center text-indigo-600 hover:text-indigo-500">
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to prescriptions
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Create New Prescription
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details below to create a new prescription
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {patient && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Patient Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone: {patient.phone || 'N/A'}</p>
                      <p className="text-sm text-gray-500">DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 mb-8">
                <div>
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    id="diagnosis"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor's Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Prescribed Medicines</h4>
                
                <MedicineForm onAddMedicine={handleAddMedicine} />

                {medicines.length > 0 ? (
                  <div className="mt-6">
                    <ul className="divide-y divide-gray-200">
                      {medicines.map((medicine, index) => (
                        <li key={index} className="py-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{medicine.name} - {medicine.dosage}</p>
                              <p className="text-sm text-gray-500">{medicine.frequency} for {medicine.duration}</p>
                              {medicine.instructions && (
                                <p className="text-xs text-gray-500 mt-1">Instructions: {medicine.instructions}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines added</h3>
                    <p className="mt-1 text-sm text-gray-500">Add medicines using the form above</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || medicines.length === 0}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${(loading || medicines.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Prescription'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}