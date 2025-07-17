import React, { useEffect, useState } from 'react';
import { fetchSheetData } from '../components/api';

const Sheet = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchSheetData();
        setRows(data.rows || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="overflow-x-auto">
      <h1 className="text-2xl font-semibold mb-4">Google Sheet Data</h1>
      <table className="min-w-full border border-gray-200">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1 border-r">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Sheet;
