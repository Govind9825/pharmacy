'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData || userData.role !== 'pharmacist') {
      router.push('/login');
      return;
    }

    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">Inventory management features coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
} 