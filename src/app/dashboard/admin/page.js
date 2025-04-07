// app/dashboard/admin/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminStats from '@/app/components/AdminStats';
import UserManagement from '@/app/components/UserManagement';

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]); // Add this line
  const [doctors, setDoctors] = useState([]); // Add this line
  const [pharmacists, setPharmacists] = useState([]); // Add this line
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminData = JSON.parse(localStorage.getItem('user'));

    if (!token || !adminData || adminData.role !== 'admin') {
      router.push('/login');
      return;
    }

    setAdmin(adminData);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [statsRes, usersRes, doctorsRes, pharmacistsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/doctors', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/pharmacists', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!doctorsRes.ok) throw new Error('Failed to fetch doctors');
      if (!pharmacistsRes.ok) throw new Error('Failed to fetch pharmacists');

      const [statsData, usersData, doctorsData, pharmacistsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        doctorsRes.json(),
        pharmacistsRes.json()
      ]);

      setStats(statsData);
      setUsers(usersData); // Add this line
      setDoctors(doctorsData); // Add this line
      setPharmacists(pharmacistsData); // Add this line
      
    } catch (error) {
      setError(error.message);
      if (error.message.includes('401') || error.message.includes('403')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <AdminStats stats={stats} />
            <UserManagement users={users} doctors={doctors} pharmacists={pharmacists} />
          </div>
        </div>
      </main>
    </div>
  );
}