import React, { useState, useEffect } from "react";
import { fetchItems, createItem, updateItem, deleteItem } from "../components/api";

const gridStyle = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

const Vault = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newContent, setNewContent] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async (q = "") => {
    try {
      const { data } = await fetchItems(q);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    loadItems(q);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    await createItem({ title: newTitle.trim(), category: newCategory.trim(), content: newContent.trim() });
    setNewTitle("");
    setNewCategory("");
    setNewContent("");
    loadItems(searchQuery);
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category || "");
    setEditContent(item.content);
  };

  const handleUpdateItem = async (id) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    await updateItem(id, { title: editTitle.trim(), category: editCategory.trim(), content: editContent.trim() });
    setEditingId(null);
    loadItems(searchQuery);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await deleteItem(id);
    loadItems(searchQuery);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
  };

  const handleExportAll = () => {
    if (items.length === 0) return alert("No items to export.");
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my_items_export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const credentials = items.filter((i) => i.category === "Credential");
  const commands = items.filter((i) => i.category === "Command");
  const others = items.filter((i) => i.category !== "Credential" && i.category !== "Command");

  const renderEditCard = (id) => (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="font-semibold mb-2">Editing</div>
      <input className="w-full border rounded p-1 mb-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
      <input className="w-full border rounded p-1 mb-2" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Category" />
      <textarea className="w-full border rounded p-1 mb-2" rows="3" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
      <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={() => handleUpdateItem(id)}>Save</button>
      <button className="ml-2 text-sm" onClick={() => setEditingId(null)}>Cancel</button>
    </div>
  );

  const renderCredential = (item) => (
    <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm">
      {editingId === item.id ? (
        renderEditCard(item.id)
      ) : (
        <>
          <div className="font-semibold mb-1">{item.title}</div>
          <div className="mb-2">Password: <span className="tracking-widest">••••••••</span></div>
          <div className="space-x-2">
            <button className="text-sm text-blue-600" onClick={() => copyText(item.title)}>Copy Username</button>
            <button className="text-sm text-blue-600" onClick={() => copyText(item.content)}>Copy Password</button>
          </div>
          <div className="mt-2 space-x-2">
            <button className="text-sm" onClick={() => startEditing(item)}>Edit</button>
            <button className="text-sm text-red-600" onClick={() => handleDeleteItem(item.id)}>Delete</button>
          </div>
        </>
      )}
    </div>
  );

  const renderCommand = (item) => (
    <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm">
      {editingId === item.id ? (
        renderEditCard(item.id)
      ) : (
        <>
          <div className="font-semibold mb-1">{item.title}</div>
          <pre className="bg-gray-100 p-2 rounded mb-2 whitespace-pre-wrap break-words">{item.content}</pre>
          <button className="text-sm text-blue-600" onClick={() => copyText(item.content)}>Copy Command</button>
          <div className="mt-2 space-x-2">
            <button className="text-sm" onClick={() => startEditing(item)}>Edit</button>
            <button className="text-sm text-red-600" onClick={() => handleDeleteItem(item.id)}>Delete</button>
          </div>
        </>
      )}
    </div>
  );

  const renderOther = (item) => (
    <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm">
      {editingId === item.id ? (
        renderEditCard(item.id)
      ) : (
        <>
          <div className="font-semibold mb-1">{item.title}</div>
          <div className="mb-2 break-words">{item.content.length > 100 ? item.content.slice(0, 100) + "..." : item.content}</div>
          <button className="text-sm text-blue-600" onClick={() => copyText(item.content)}>Copy Content</button>
          <div className="mt-2 space-x-2">
            <button className="text-sm" onClick={() => startEditing(item)}>Edit</button>
            <button className="text-sm text-red-600" onClick={() => handleDeleteItem(item.id)}>Delete</button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mt-4 mb-2">
        <input className="border p-2 flex-grow mr-2" placeholder="Search..." value={searchQuery} onChange={handleSearchChange} />
        <button onClick={handleExportAll} className="bg-gray-200 px-3 py-2 rounded">Export All</button>
      </div>

      <form onSubmit={handleAddItem} className="bg-white shadow p-4 rounded mb-6">
        <h3 className="text-lg font-semibold mb-2">Add New Item</h3>
        <input className="w-full border rounded p-2 mb-2" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <input className="w-full border rounded p-2 mb-2" placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
        <textarea className="w-full border rounded p-2 mb-2" rows="3" placeholder="Content" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Add Item</button>
      </form>

      {credentials.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Credentials</h2>
          <div className={gridStyle}>
            {credentials.map(renderCredential)}
          </div>
        </div>
      )}

      {commands.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Commands</h2>
          <div className={gridStyle}>
            {commands.map(renderCommand)}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Other Items</h2>
          <div className={gridStyle}>
            {others.map(renderOther)}
          </div>
        </div>
      )}

      {items.length === 0 && searchQuery === "" && (
        <p className="italic">No items yet. Add a new credential, command, or snippet above!</p>
      )}
      {items.length === 0 && searchQuery !== "" && (
        <p className="italic">No items match your search.</p>
      )}
    </div>
  );
};

export default Vault;
