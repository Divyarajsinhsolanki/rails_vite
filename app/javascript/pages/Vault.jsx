import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { fetchItems, createItem, updateItem, deleteItem } from "../components/api";
import {
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

const gridStyle = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

const Vault = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContent, setEditContent] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

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

  const openModal = (category = "") => {
    setModalCategory(category);
    setNewCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTitle("");
    setNewCategory("");
    setNewContent("");
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await createItem({ title: newTitle.trim(), category: newCategory.trim(), content: newContent.trim() });
      toast.success("Item added");
      closeModal();
      loadItems(searchQuery);
    } catch {
      toast.error("Failed to add item");
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category || "");
    setEditContent(item.content);
    setOpenMenuId(null);
  };

  const handleUpdateItem = async (id) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      await updateItem(id, { title: editTitle.trim(), category: editCategory.trim(), content: editContent.trim() });
      toast.success("Item updated");
    } catch {
      toast.error("Failed to update item");
    }
    setEditingId(null);
    loadItems(searchQuery);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteItem(id);
      toast.success("Item deleted");
      loadItems(searchQuery);
    } catch {
      toast.error("Failed to delete item");
    }
    setOpenMenuId(null);
  };

  const copyText = (key, text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Copied to clipboard");
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      },
      () => toast.error("Failed to copy")
    );
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleExportAll = () => {
    if (items.length === 0) return toast.error("No items to export.");
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
  const tokens = items.filter((i) => i.category === "Token");
  const others = items.filter(
    (i) => !["Credential", "Command", "Token"].includes(i.category)
  );

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
    <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
      {editingId === item.id ? (
        renderEditCard(item.id)
      ) : (
        <>
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold">{item.title}</div>
            <div className="relative">
              <button className="p-1 text-gray-500 hover:text-gray-700" onClick={() => toggleMenu(item.id)}>
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              {openMenuId === item.id && (
                <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow z-10">
                  <button className="flex items-center w-full px-2 py-1 text-sm hover:bg-gray-100" onClick={() => startEditing(item)}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button className="flex items-center w-full px-2 py-1 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDeleteItem(item.id)}>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center mb-1">
            <span className="flex-grow break-all">Username: {item.title}</span>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors relative"
              onClick={() => copyText(`title-${item.id}`, item.title)}
              title="Copy"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              {copiedKey === `title-${item.id}` && (
                <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </button>
          </div>
          <div className="flex items-center">
            <span className="flex-grow break-all">Password: <span className="tracking-widest">••••••••</span></span>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors relative"
              onClick={() => copyText(`content-${item.id}`, item.content)}
              title="Copy"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              {copiedKey === `content-${item.id}` && (
                <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderCommand = (item) => (
    <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
      {editingId === item.id ? (
        renderEditCard(item.id)
      ) : (
        <>
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold">{item.title}</div>
            <div className="relative">
              <button className="p-1 text-gray-500 hover:text-gray-700" onClick={() => toggleMenu(item.id)}>
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              {openMenuId === item.id && (
                <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow z-10">
                  <button className="flex items-center w-full px-2 py-1 text-sm hover:bg-gray-100" onClick={() => startEditing(item)}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button className="flex items-center w-full px-2 py-1 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDeleteItem(item.id)}>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start">
            <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap break-words flex-grow">{item.content}</pre>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors relative"
              onClick={() => copyText(`content-${item.id}`, item.content)}
              title="Copy"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              {copiedKey === `content-${item.id}` && (
                <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderToken = (item) => (
    <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
      {editingId === item.id ? (
        renderEditCard(item.id)
      ) : (
        <>
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold">{item.title}</div>
            <div className="relative">
              <button className="p-1 text-gray-500 hover:text-gray-700" onClick={() => toggleMenu(item.id)}>
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              {openMenuId === item.id && (
                <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow z-10">
                  <button className="flex items-center w-full px-2 py-1 text-sm hover:bg-gray-100" onClick={() => startEditing(item)}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button className="flex items-center w-full px-2 py-1 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDeleteItem(item.id)}>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start">
            <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap break-words flex-grow">{item.content}</pre>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors relative"
              onClick={() => copyText(`content-${item.id}`, item.content)}
              title="Copy"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              {copiedKey === `content-${item.id}` && (
                <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderOther = (item) => (
    <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
      {editingId === item.id ? (
        renderEditCard(item.id)
      ) : (
        <>
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold">{item.title}</div>
            <div className="relative">
              <button className="p-1 text-gray-500 hover:text-gray-700" onClick={() => toggleMenu(item.id)}>
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              {openMenuId === item.id && (
                <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow z-10">
                  <button className="flex items-center w-full px-2 py-1 text-sm hover:bg-gray-100" onClick={() => startEditing(item)}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button className="flex items-center w-full px-2 py-1 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDeleteItem(item.id)}>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-grow break-words whitespace-pre-wrap">{item.content.length > 100 ? item.content.slice(0, 100) + "..." : item.content}</div>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors relative"
              onClick={() => copyText(`content-${item.id}`, item.content)}
              title="Copy"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              {copiedKey === `content-${item.id}` && (
                <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-1xl  p-4 space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center">
        <input
          className="border p-2 flex-grow mr-2"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button onClick={handleExportAll} className="bg-gray-200 px-3 py-2 rounded">
          Export All
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-lg overflow-hidden shadow">
            <div className="bg-blue-500 text-white px-3 py-2 flex justify-between items-center">
              <span>Credentials</span>
              <div className="space-x-2">
                <button onClick={() => setShowCredentials((v) => !v)} className="text-sm underline">
                  {showCredentials ? 'Hide' : 'Expand'}
                </button>
                <button onClick={() => openModal('Credential')} className="font-bold">+</button>
              </div>
            </div>
            {showCredentials && (
              <div className="p-4 space-y-4">
                {credentials.map(renderCredential)}
                {credentials.length === 0 && <p className="italic text-sm">No credentials</p>}
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="rounded-lg overflow-hidden shadow">
            <div className="bg-green-500 text-white px-3 py-2 flex justify-between items-center">
              <span>Commands</span>
              <div className="space-x-2">
                <button onClick={() => setShowCommands((v) => !v)} className="text-sm underline">
                  {showCommands ? 'Hide' : 'Expand'}
                </button>
                <button onClick={() => openModal('Command')} className="font-bold">+</button>
              </div>
            </div>
            {showCommands && (
              <div className="p-4 space-y-4">
                {commands.map(renderCommand)}
                {commands.length === 0 && <p className="italic text-sm">No commands</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden shadow">
        <div className="bg-orange-500 text-white px-3 py-2 flex justify-between items-center">
          <span>Tokens</span>
          <div className="space-x-2">
            <button onClick={() => setShowTokens((v) => !v)} className="text-sm underline">
              {showTokens ? 'Hide' : 'Expand'}
            </button>
            <button onClick={() => openModal('Token')} className="font-bold">+</button>
          </div>
        </div>
        {showTokens && (
          <div className="p-4 space-y-4">
            {tokens.map(renderToken)}
            {tokens.length === 0 && <p className="italic text-sm">No tokens</p>}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div className="rounded-lg overflow-hidden shadow">
          <div className="bg-purple-500 text-white px-3 py-2 flex justify-between items-center">
            <span>Other Items</span>
            <div className="space-x-2">
              <button onClick={() => setShowOthers((v) => !v)} className="text-sm underline">
                {showOthers ? 'Hide' : 'Expand'}
              </button>
              <button onClick={() => openModal('')} className="font-bold">+</button>
            </div>
          </div>
          {showOthers && (
            <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map(renderOther)}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <p className="italic">No items yet. Use the add buttons above to create one.</p>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Add New {modalCategory || 'Item'}</h3>
              <button onClick={closeModal} className="text-gray-500">&times;</button>
            </div>
            <form onSubmit={handleAddItem} className="p-4 space-y-2">
              <input
                className="w-full border rounded p-2"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                className="w-full border rounded p-2"
                placeholder="Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <textarea
                className="w-full border rounded p-2"
                rows="3"
                placeholder="Content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;
