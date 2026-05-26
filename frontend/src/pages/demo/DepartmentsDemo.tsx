import React, { useEffect, useState } from 'react';

interface Department {
  id?: number;
  department_id?: string;
  name: string;
}

export default function DepartmentsDemo() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_ORIGIN || '').trim();
        const response = await fetch(`${baseUrl}/api/v1/departments`);
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
          const text = await response.text();
          throw new Error(`Expected JSON but got HTML/text. Status: ${response.status}. Make sure the backend server is running and the proxy/URL is correct. Prefix snippet: ${text.substring(0, 30)}`);
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDepartments(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Cloud Setup Demo: Departments API</h1>
      
      {loading && <p className="text-slate-500">Loading departments...</p>}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">ID / Code</th>
                <th className="px-4 py-3 font-medium">Department Name</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{dept.id || dept.department_id || '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{dept.name}</td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                    No departments found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="mt-8 p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 font-mono">
            <strong className="block mb-2 text-slate-800">Debug Info:</strong>
            Attempted API URL: <span className="text-blue-600">{import.meta.env.VITE_API_ORIGIN || '(relative layout)'}/api/v1/departments</span>
          </div>
        </div>
      )}
    </div>
  );
}
