'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const updateAuthState = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsLoggedIn(false);
      }
    } else {
      // Clear any partial data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    // Initial check
    updateAuthState();

    // Listen for auth state changes
    const handleAuthChange = () => {
      updateAuthState();
    };

    // Add event listener for auth state changes
    window.addEventListener('authStateChange', handleAuthChange);

    // Cleanup
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Reset state
    setUser(null);
    setIsLoggedIn(false);
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('authStateChange'));
    // Redirect to login page
    router.replace('/login');
  };

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                PharmaCare
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user.role === 'doctor' && (
                <>
                  <Link
                    href="/dashboard/doctor"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/doctor/prescriptions"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Prescriptions
                  </Link>
                  <Link
                    href="/dashboard/doctor/patients"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Patients
                  </Link>
                </>
              )}
              {user.role === 'patient' && (
                <>
                  <Link
                    href="/dashboard/patient"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/patient/prescriptions"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    My Prescriptions
                  </Link>
                  <Link
                    href="/dashboard/patient/orders"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    My Orders
                  </Link>
                </>
              )}
              {user.role === 'pharmacist' && (
                <>
                  <Link
                    href="/dashboard/pharmacist"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/pharmacist/inventory"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Inventory
                  </Link>
                  <Link
                    href="/dashboard/pharmacist/orders"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Orders
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center">
                <span className="text-gray-700 mr-4">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 