import React, { useEffect, useState } from 'react';
import { fetchSheetData } from '../components/api';

const Sheet = ({ sheetName, projectId, sheetId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!sheetId) {
        setError("Sheet integration is enabled, but no Sheet ID is configured. Add a Sheet ID in project settings.");
        setLoading(false);
        return;
      }

      try {
        const params = sheetName ? { sheet: sheetName, project_id: projectId } : { project_id: projectId };
        const { data } = await fetchSheetData(params);
        setRows(data.rows || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load sheet data. Please confirm the Sheet ID and permissions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sheetName, projectId, sheetId]);

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
