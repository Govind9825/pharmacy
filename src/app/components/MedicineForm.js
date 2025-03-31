'use client';
import { useState } from 'react';

export default function MedicineForm({ onAddMedicine, onCancel }) {
  const [medicine, setMedicine] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    duration: '7 days',
    instructions: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMedicine(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMedicine(medicine);
    setMedicine({
      name: '',
      dosage: '',
      frequency: 'daily',
      duration: '7 days',
      instructions: ''
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-3">Add Medicine</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Medicine Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={medicine.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
              Dosage
            </label>
            <input
              type="text"
              id="dosage"
              name="dosage"
              required
              value={medicine.dosage}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., 500mg"
            />
          </div>

          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              required
              value={medicine.frequency}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="daily">Daily</option>
              <option value="twice daily">Twice Daily</option>
              <option value="three times daily">Three Times Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as needed">As Needed</option>
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration
            </label>
            <select
              id="duration"
              name="duration"
              required
              value={medicine.duration}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="7 days">7 days</option>
              <option value="14 days">14 days</option>
              <option value="30 days">30 days</option>
              <option value="60 days">60 days</option>
              <option value="until finished">Until Finished</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
            Special Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            rows="3"
            value={medicine.instructions}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Take with food, Avoid alcohol, etc."
          />
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Medicine
          </button>
        </div>
      </form>
    </div>
  );
}