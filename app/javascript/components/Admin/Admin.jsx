import React, { useState, useEffect } from 'react';
import { getTables } from '../api';
import DynamicAdminTable from './DynamicAdminTable';

function Admin() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');

  // Fetch available table names on mount
  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await getTables();
        setTables(res.data);
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      }
    }
    fetchTables();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-4">
        <label className="mr-2 font-medium">Select Table:</label>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">-- Choose a table --</option>
          {tables.map((tbl) => (
            <option key={tbl} value={tbl}>{tbl}</option>
          ))}
        </select>
      </div>
      {selectedTable && (
        <DynamicAdminTable table={selectedTable} />
      )}
    </div>
  );
}

export default Admin;
