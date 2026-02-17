import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiUserPlus,
  FiX,
  FiCheck,
} from "react-icons/fi";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  getUsers,
  updateDepartment,
  updateDepartmentMembers,
} from "../components/api";

const emptyForm = { name: "" };

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [memberModal, setMemberModal] = useState({ open: false, department: null });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, usersRes] = await Promise.all([fetchDepartments(), getUsers()]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((department) => department.name.toLowerCase().includes(term));
  }, [departments, search]);

  const unassignedUsersCount = useMemo(
    () => users.filter((user) => !user.department_id).length,
    [users]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Department name is required.");

    setSaving(true);
    try {
      if (editingId) {
        await updateDepartment(editingId, { name: form.name.trim() });
        toast.success("Department updated.");
      } else {
        await createDepartment({ name: form.name.trim() });
        toast.success("Department created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.errors?.[0] || "Unable to save department.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (department) => {
    setEditingId(department.id);
    setForm({ name: department.name });
  };

  const onDelete = async (department) => {
    if (!window.confirm(`Delete ${department.name}? Users will become unassigned.`)) return;
    try {
      await deleteDepartment(department.id);
      toast.success("Department deleted.");
      if (editingId === department.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.errors?.[0] || "Unable to delete department.");
    }
  };

  const openMembersModal = (department) => {
    setMemberModal({ open: true, department });
    setSelectedUserIds(users.filter((u) => u.department_id === department.id).map((u) => u.id));
  };

  const closeMembersModal = () => {
    setMemberModal({ open: false, department: null });
    setSelectedUserIds([]);
  };

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const saveMembers = async () => {
    if (!memberModal.department) return;
    setSavingMembers(true);
    try {
      await updateDepartmentMembers(memberModal.department.id, selectedUserIds);
      toast.success("Department members saved.");
      closeMembersModal();
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.errors?.[0] || "Unable to update members.");
    } finally {
      setSavingMembers(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow">
          <h1 className="text-2xl font-bold">Department Management</h1>
          <p className="mt-1 text-sm text-blue-100">Create teams by department and bulk-assign users in one place.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/20 px-3 py-1">{departments.length} Departments</span>
            <span className="rounded-full bg-white/20 px-3 py-1">{users.length} Total Users</span>
            <span className="rounded-full bg-white/20 px-3 py-1">{unassignedUsersCount} Unassigned</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <FiBriefcase /> {editingId ? "Edit Department" : "Create Department"}
            </h2>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Department Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                placeholder="e.g., Engineering"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                <FiPlus /> {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Department Directory</h2>
              <div className="relative w-full max-w-xs">
                <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search department"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">Loading departments...</p>
              ) : filteredDepartments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No departments found.</p>
              ) : (
                filteredDepartments.map((department) => (
                  <div key={department.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{department.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FiUsers /> {department.users_count || 0} members</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openMembersModal(department)} className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200">
                          <FiUserPlus /> Members
                        </button>
                        <button onClick={() => onEdit(department)} className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200">
                          <FiEdit2 /> Edit
                        </button>
                        <button onClick={() => onDelete(department)} className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200">
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {memberModal.open && memberModal.department && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Manage Members · {memberModal.department.name}</h3>
              <button onClick={closeMembersModal} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"><FiX /></button>
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {users.map((user) => {
                const checked = selectedUserIds.includes(user.id);
                return (
                  <label key={user.id} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${checked ? "border-indigo-300 bg-indigo-50" : "border-gray-200"}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button type="button" onClick={() => toggleUser(user.id)} className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${checked ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <FiCheck className="text-sm" />
                    </button>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeMembersModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
              <button disabled={savingMembers} onClick={saveMembers} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {savingMembers ? "Saving..." : "Save Members"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
