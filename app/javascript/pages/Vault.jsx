import React, { useEffect, useState } from "react";
import { fetchItems, createItem, deleteItem } from "../components/api";

const Vault = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", category: "", content: "" });

  const loadItems = async (q = "") => {
    try {
      const { data } = await fetchItems(q);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    await createItem(form);
    setForm({ title: "", category: "", content: "" });
    loadItems(search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await deleteItem(id);
    loadItems(search);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "items_export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mt-4 mb-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            loadItems(e.target.value);
          }}
          placeholder="Search..."
          className="border p-2 flex-grow mr-2"
        />
        <button onClick={handleExport} className="bg-gray-200 px-3 py-2 rounded">Export</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded mb-6">
        <input
          className="w-full border rounded p-2 mb-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="w-full border rounded p-2 mb-2"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <textarea
          className="w-full border rounded p-2 mb-2"
          rows="3"
          placeholder="Content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Add Item</button>
      </form>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Title</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Content</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="border p-2 align-top">{item.title}</td>
              <td className="border p-2 align-top">{item.category}</td>
              <td className="border p-2 whitespace-pre-wrap align-top">
                {item.content.length > 50 ? item.content.slice(0, 50) + "..." : item.content}
              </td>
              <td className="border p-2 align-top">
                <button onClick={() => handleCopy(item.content)} className="mr-2 text-sm text-blue-600">Copy</button>
                <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600">Delete</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="4" className="border p-2 text-center italic">No items</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Vault;
