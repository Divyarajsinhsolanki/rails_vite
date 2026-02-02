import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchSheetData } from '../components/api';
import {
  FiRefreshCw,
  FiExternalLink,
  FiSearch,
  FiTable,
  FiAlertCircle,
  FiLoader,
  FiFileText
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Sheet = ({ sheetName, projectId, sheetId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (!sheetId) {
      setError("Sheet integration is enabled, but no Sheet ID is configured. Add a Sheet ID in project settings.");
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const params = sheetName ? { sheet: sheetName, project_id: projectId } : { project_id: projectId };
      const { data } = await fetchSheetData(params);
      setRows(data.rows || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load sheet data. Please confirm the Sheet ID and permissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sheetName, projectId, sheetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter((row, index) => {
      if (index === 0) return true; // Always keep header
      return row.some(cell => String(cell).toLowerCase().includes(query));
    });
  }, [rows, searchQuery]);

  const headerRow = rows.length > 0 ? rows[0] : [];
  const bodyRows = filteredRows.length > 1 ? filteredRows.slice(1) : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <FiLoader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Fetching sheet data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-4">
        <FiAlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Sheet Connection Error</h3>
          <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shadow-inner">
              <FiTable className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Google Sheet</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{sheetName ? `Showing: ${sheetName}` : 'Spreadsheet data'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
              <input
                type="text"
                placeholder="Find in sheet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-64 transition-all"
              />
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-blue-500 dark:hover:text-blue-400 transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-500/25 active:scale-95 transform"
            >
              <FiExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open in Drive</span>
            </a>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto max-h-[70vh] relative custom-scrollbar">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-full mb-6">
                <FiFileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No Data Available</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-xs">This sheet appears to be empty or the data couldn't be retrieved.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm text-left">
              <thead className="sticky top-0 z-20">
                <tr className="bg-zinc-50/90 dark:bg-zinc-800/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-700">
                  {headerRow.map((cell, i) => (
                    <th key={i} className="px-6 py-4.5 font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider text-[11px] whitespace-nowrap">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.length > 0 ? (
                  bodyRows.map((row, i) => (
                    <tr
                      key={i}
                      className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/5 transition-colors"
                    >
                      {row.map((cell, j) => (
                        <td key={j} className="px-6 py-4 text-zinc-600 dark:text-zinc-400 border-r border-zinc-100/50 last:border-r-0 dark:border-zinc-800/30">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headerRow.length} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FiSearch className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
                        <p className="text-zinc-500 font-medium">
                          {searchQuery ? `No matches found for "${searchQuery}"` : 'No data records found.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer/Stats */}
        {rows.length > 0 && (
          <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                {bodyRows.length} Rows
              </span>
              {searchQuery && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                  Filtered Result
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-medium italic tracking-wide">
              Data synchronized with project Google Sheet integration
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sheet;
