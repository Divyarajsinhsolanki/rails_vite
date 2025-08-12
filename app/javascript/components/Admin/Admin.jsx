import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { getTables } from '../api';
import DynamicAdminTable from './DynamicAdminTable';

function Admin() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch available table names on mount
  useEffect(() => {
    async function fetchTables() {
      setLoading(true);
      try {
        const res = await getTables();
        setTables(res.data);
        toast.success('Tables loaded');
      } catch (error) {
        toast.error('Failed to fetch tables');
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, []);

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4 text-theme">Admin Dashboard</h1>
      <div className="mb-4">
        <label className="mr-2 font-medium">Select Table:</label>
        {loading ? (
          <span>Loading tables...</span>
        ) : (
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="border border-theme rounded px-2 py-1 focus:ring-2 focus:ring-[var(--theme-color)]"
            disabled={loading}
          >
            <option value="">-- Choose a table --</option>
            {tables.map((tbl) => (
              <option key={tbl} value={tbl}>{tbl}</option>
            ))}
          </select>
        )}
      </div>
      {selectedTable && (
        <DynamicAdminTable table={selectedTable} />
      )}
    </div>
  );
}

export default Admin;
