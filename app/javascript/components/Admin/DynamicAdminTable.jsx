import React, { useState, useEffect } from 'react';
import { getMeta, getRecords, createRecord, updateRecord, deleteRecord } from '../api';

function DynamicAdminTable({ table }) {
  const [columns, setColumns] = useState([]);
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editedRecord, setEditedRecord] = useState({});

  // Fetch table metadata and records when the selected table changes
  useEffect(() => {
    async function fetchData() {
      try {
        const metaRes = await getMeta(table);
        const cols = metaRes.data;
        setColumns(cols);

        // Initialize default values for new record inputs
        const defaults = {};
        cols.forEach(col => {
          if (col.name !== 'id') {
            if (col.type.includes('int') || col.type === 'decimal') {
              defaults[col.name] = 0;
            } else if (col.type === 'boolean') {
              defaults[col.name] = false;
            } else {
              defaults[col.name] = '';
            }
          }
        });
        setNewRecord(defaults);

        // Load existing records
        const recRes = await getRecords(table);
        setRecords(recRes.data);
      } catch (error) {
        console.error("Failed to fetch meta or records:", error);
      }
    }
    fetchData();
    setEditingId(null);
  }, [table]);

  // Handle input change for new record form
  const handleNewChange = (e, col) => {
    const value = col.type === 'boolean' ? e.target.checked : e.target.value;
    setNewRecord({ ...newRecord, [col.name]: value });
  };

  // Handle input change for editing an existing record
  const handleEditChange = (e, col) => {
    const value = col.type === 'boolean' ? e.target.checked : e.target.value;
    setEditedRecord({ ...editedRecord, [col.name]: value });
  };

  // Create a new record via POST
  const handleCreate = async () => {
    try {
      await createRecord(table, newRecord);
      const recRes = await getRecords(table);
      setRecords(recRes.data);
      // Reset newRecord form
      const reset = {};
      columns.forEach(col => {
        if (col.name !== 'id') {
          if (col.type.includes('int') || col.type === 'decimal') {
            reset[col.name] = 0;
          } else if (col.type === 'boolean') {
            reset[col.name] = false;
          } else {
            reset[col.name] = '';
          }
        }
      });
      setNewRecord(reset);
    } catch (error) {
      console.error("Failed to create record:", error);
    }
  };

  // Begin editing a record (populate form fields)
  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditedRecord(record);
  };

  // Save changes to an existing record via PATCH
  const handleSave = async (id) => {
    try {
      await updateRecord(table, id, editedRecord);
      const recRes = await getRecords(table);
      setRecords(recRes.data);
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update record:", error);
    }
  };

  // Cancel editing mode
  const handleCancel = () => {
    setEditingId(null);
  };

  // Delete a record via DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteRecord(table, id);
      // Optimistically update UI
      setRecords(records.filter(rec => rec.id !== id));
    } catch (error) {
      console.error("Failed to delete record:", error);
    }
  };

  return (
    <div className="p-4">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {columns.map(col => (
              <th key={col.name} className="px-4 py-2 text-left">{col.name}</th>
            ))}
            <th className="px-4 py-2">Actions</th>
          </tr>
          {/* New record input row */}
          <tr className="bg-gray-50">
            {columns.map(col => (
              <td key={col.name} className="border px-4 py-2">
                {col.name === 'id' ? null : (
                  col.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={newRecord[col.name] || false}
                      onChange={(e) => handleNewChange(e, col)}
                      className="form-checkbox"
                    />
                  ) : (
                    <input
                      type={col.type.includes('int') || col.type === 'decimal' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                      value={newRecord[col.name] || ''}
                      onChange={(e) => handleNewChange(e, col)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  )
                )}
              </td>
            ))}
            <td className="border px-4 py-2">
              <button
                onClick={handleCreate}
                className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded"
              >
                Create
              </button>
            </td>
          </tr>
        </thead>
        <tbody>
          {records.map(rec => (
            <tr key={rec.id} className="odd:bg-white even:bg-gray-100">
              {columns.map(col => (
                <td key={col.name} className="border px-4 py-2">
                  {editingId === rec.id && col.name !== 'id' ? (
                    col.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={editedRecord[col.name] || false}
                        onChange={(e) => handleEditChange(e, col)}
                        className="form-checkbox"
                      />
                    ) : (
                      <input
                        type={col.type.includes('int') || col.type === 'decimal' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        value={editedRecord[col.name] || ''}
                        onChange={(e) => handleEditChange(e, col)}
                        className="border rounded px-2 py-1 w-full"
                      />
                    )
                  ) : (
                    // Display read-only value
                    col.type === 'boolean' ? (
                      rec[col.name] ? 'True' : 'False'
                    ) : (
                      rec[col.name]
                    )
                  )}
                </td>
              ))}
              <td className="border px-4 py-2">
                {editingId === rec.id ? (
                  <>
                    <button
                      onClick={() => handleSave(rec.id)}
                      className="bg-green-500 hover:bg-green-700 text-white px-2 py-1 rounded mr-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-700 text-white px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(rec)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white px-2 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DynamicAdminTable;
