import React, { useState, useEffect, Fragment } from 'react';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { getMeta, getRecords, createRecord, updateRecord, deleteRecord } from '../api';

function DynamicAdminTable({ table }) {
  const [columns, setColumns] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentRecord, setCurrentRecord] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Metadata
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const metaRes = await getMeta(table);
        const cols = metaRes.data;
        setColumns(cols);
        setCurrentPage(1);
        setFilters({});
      } catch (error) {
        console.error("Failed to fetch meta:", error);
        toast.error('Failed to load table metadata');
      }
    }
    fetchData();
  }, [table]);

  // Fetch Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: perPage };
      if (Object.keys(filters).length) params.filters = filters;

      const recRes = await getRecords(table, params);
      setRecords(recRes.data.records);
      setTotalPages(recRes.data.pagination.total_pages);
    } catch (error) {
      toast.error('Failed to load table data');
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (columns.length > 0) {
      fetchRecords();
    }
  }, [table, currentPage, perPage, columns]);

  // Modal Handlers
  const openCreateModal = () => {
    setModalMode('create');
    const defaults = {};
    columns.forEach(col => {
      if (col.name !== 'id') {
        if (col.type.includes('int') || col.type === 'decimal') defaults[col.name] = 0;
        else if (col.type === 'boolean') defaults[col.name] = false;
        else defaults[col.name] = '';
      }
    });
    setCurrentRecord(defaults);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setModalMode('edit');
    setCurrentRecord({ ...record });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRecord({});
  };

  const handleInputChange = (e, col) => {
    const value = col.type === 'boolean' ? e.target.checked : e.target.value;
    setCurrentRecord(prev => ({ ...prev, [col.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createRecord(table, currentRecord);
        toast.success('Record created successfully');
      } else {
        await updateRecord(table, currentRecord.id, currentRecord);
        toast.success('Record updated successfully');
      }
      closeModal();
      fetchRecords();
    } catch (error) {
      toast.error(`Failed to ${modalMode} record`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    try {
      await deleteRecord(table, id);
      toast.success('Record deleted successfully');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-140px)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter records..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : null}

        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase font-semibold text-gray-500">
            <tr>
              {columns.map(col => (
                <th key={col.name} className="px-6 py-3 border-b border-gray-200 whitespace-nowrap bg-gray-50">
                  {col.name}
                </th>
              ))}
              <th className="px-6 py-3 border-b border-gray-200 text-right bg-gray-50 sticky right-0 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length > 0 ? (
              records.map((rec) => (
                <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors group">
                  {columns.map(col => (
                    <td key={col.name} className="px-6 py-3 whitespace-nowrap max-w-xs truncate">
                      {col.type === 'boolean' ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rec[col.name] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {rec[col.name] ? 'True' : 'False'}
                        </span>
                      ) : (
                        rec[col.name]
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-blue-50/30 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
        <span className="text-sm text-gray-500">
          Showing page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center mb-6 border-b pb-4">
                    {modalMode === 'create' ? 'Create New Record' : 'Edit Record'}
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {columns.map(col => {
                        if (col.name === 'id' || col.name === 'created_at' || col.name === 'updated_at') return null;

                        return (
                          <div key={col.name} className={col.type === 'text' || col.type === 'varchar' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              {col.name.replace(/_/g, ' ')}
                            </label>
                            {col.type === 'boolean' ? (
                              <SwitchToggle
                                checked={currentRecord[col.name] || false}
                                onChange={(val) => setCurrentRecord(prev => ({ ...prev, [col.name]: val }))}
                              />
                            ) : (
                              <input
                                type={col.type.includes('int') || col.type === 'decimal' ? 'number' : col.type.includes('date') ? 'date' : 'text'}
                                value={currentRecord[col.name] || ''}
                                onChange={(e) => handleInputChange(e, col)}
                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm"
                                placeholder={`Enter ${col.name}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </form>

                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-wait"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>Saving...</>
                      ) : (
                        <>{modalMode === 'create' ? 'Create Record' : 'Save Changes'}</>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

function SwitchToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`${checked ? 'bg-blue-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      onClick={() => onChange(!checked)}
    >
      <span className={`${checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
    </button>
  );
}

export default DynamicAdminTable;
