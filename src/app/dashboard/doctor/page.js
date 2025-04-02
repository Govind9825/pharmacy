// app/dashboard/doctor/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const doctorData = JSON.parse(localStorage.getItem('user'));

    if (!token || !doctorData || doctorData.role !== 'doctor') {
      router.push('/login');
      return;
    }

    setDoctor(doctorData);
    fetchData(doctorData.id);
  }, []);

  const fetchData = async (doctorId) => {
    try {
      const token = localStorage.getItem('token');
      
      const [patientsRes, prescriptionsRes] = await Promise.all([
        fetch('/api/patients', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/prescriptions/doctor/${doctorId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!patientsRes.ok) throw new Error('Failed to fetch patients');
      if (!prescriptionsRes.ok) throw new Error('Failed to fetch prescriptions');

      const [patientsData, prescriptionsData] = await Promise.all([
        patientsRes.json(),
        prescriptionsRes.json()
      ]);

      setPatients(patientsData);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      setError(error.message);
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">PharmaCare</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard/doctor"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/doctor/patients"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Patients
                </Link>
                <Link
                  href="/dashboard/doctor/prescriptions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Prescriptions
                </Link>
                <Link
                  href="/dashboard/doctor/create-prescription"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  New Prescription
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Dr. {doctor?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Welcome, Dr. {doctor?.name}</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                  {error}
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-indigo-50 p-6 rounded-lg shadow border border-indigo-100">
                  <h3 className="text-lg font-medium text-indigo-800 mb-2">Total Patients</h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    {patients.length}
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg shadow border border-green-100">
                  <h3 className="text-lg font-medium text-green-800 mb-2">Active Prescriptions</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {prescriptions.filter(p => !p.is_expired).length}
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg shadow border border-red-100">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Expired Prescriptions</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {prescriptions.filter(p => p.is_expired).length}
                  </p>
                </div>
              </div>

              {/* Recent Patients and Prescriptions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Patients */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Recent Patients
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your most recently added patients
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {patients.slice(0, 5).map(patient => (
                      <li key={patient.user_id || patient.id}>
                        <Link
                          href={`/dashboard/doctor/patients/${patient.user_id || patient.id}`}
                          className="block hover:bg-gray-50 transition duration-150 ease-in-out"
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-indigo-600 truncate">
                                    {patient.name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {patient.email}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {patient.phone}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  {patient.address?.split(',')[0]}
                                </p>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                    <Link
                      href="/dashboard/doctor/patients"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all patients →
                    </Link>
                  </div>
                </div>

                {/* Recent Prescriptions */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Recent Prescriptions
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your most recent prescriptions
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {prescriptions.slice(0, 5).map(prescription => (
                      <li key={prescription.id}>
                        <Link
                          href={`/dashboard/doctor/prescriptions/${prescription.id}`}
                          className="block hover:bg-gray-50 transition duration-150 ease-in-out"
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-indigo-600">
                                    Prescription #{prescription.id}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {prescription.diagnosis}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  prescription.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {prescription.is_expired ? 'Expired' : 'Active'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  {prescription.patient_name}
                                </p>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {new Date(prescription.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            {prescription.medicines && prescription.medicines.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Medicines:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {prescription.medicines.map((medicine, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {medicine.name} ({medicine.dosage})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                    <Link
                      href="/dashboard/doctor/prescriptions"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all prescriptions →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}