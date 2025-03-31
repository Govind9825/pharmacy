export default function AdminStats({ stats }) {
    if (!stats) return <div className="text-center py-8">Loading statistics...</div>;
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Doctors</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.doctors}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pharmacists</h3>
          <p className="text-3xl font-bold text-green-600">{stats.pharmacists}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Patients</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.patients}</p>
        </div>
      </div>
    );
  }