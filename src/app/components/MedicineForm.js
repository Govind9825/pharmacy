'use client';
import { useState, useEffect } from 'react';

export default function MedicineForm({ onAddMedicine, prescriptionId, patientId }) {
  const [medicine, setMedicine] = useState({
    prescription_id: prescriptionId || '',
    medicine_name: '',
    dosage: '',
    frequency: 'daily',
    duration: '7 days',
    instructions: '',
    patient_id: patientId || ''
  });

  const [doctorId, setDoctorId] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch doctor ID from localStorage when component mounts
  useEffect(() => {
    const storedDoctorId = localStorage.getItem('doctorId');
    if (storedDoctorId) {
      setDoctorId(storedDoctorId);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMedicine(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = () => {
    if (!medicine.medicine_name || !medicine.dosage || !medicine.patient_id) return;
    
    // Include the doctorId from localStorage in the submitted data
    const medicineWithIds = {
      ...medicine,
      doctor_id: doctorId
    };
    
    onAddMedicine(medicineWithIds);
    
    // Reset form
    setMedicine({
      prescription_id: prescriptionId || '',
      medicine_name: '',
      dosage: '',
      frequency: 'daily',
      duration: '7 days',
      instructions: '',
      patient_id: patientId || ''
    });
    
    setShowForm(false);
  };

  return (
    <div>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Medicine
        </button>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Medicine</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="medicine_name" className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name*
              </label>
              <input
                type="text"
                id="medicine_name"
                name="medicine_name"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={medicine.medicine_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 mb-1">
                Dosage*
              </label>
              <input
                type="text"
                id="dosage"
                name="dosage"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={medicine.dosage}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                id="frequency"
                name="frequency"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={medicine.frequency}
                onChange={handleChange}
              >
                <option value="daily">Daily</option>
                <option value="twice daily">Twice Daily</option>
                <option value="three times daily">Three Times Daily</option>
                <option value="weekly">Weekly</option>
                <option value="as needed">As Needed</option>
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={medicine.duration}
                onChange={handleChange}
              >
                <option value="7 days">7 days</option>
                <option value="14 days">14 days</option>
                <option value="30 days">30 days</option>
                <option value="60 days">60 days</option>
                <option value="until finished">Until Finished</option>
              </select>
            </div>
            <div>
              <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID*
              </label>
              <input
                type="number"
                id="patient_id"
                name="patient_id"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={medicine.patient_id}
                onChange={handleChange}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={medicine.instructions}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Medicine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}