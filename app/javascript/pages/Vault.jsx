import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { fetchItems, createItem, updateItem, deleteItem } from "../components/api";
import {
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

const DEFAULT_SORT = "recent";

const SORT_OPTIONS = [
  { value: "recent", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" }
];

const extractCategories = (items = []) => {
  const categories = new Set();
  items.forEach((item) => {
    if (item.category) {
      categories.add(item.category);
    }
  });
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
};

const extractTags = (items = []) => {
  const tags = new Set();
  items.forEach((item) => {
    const value = item?.tags;
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((tag) => {
        if (tag) tags.add(tag);
      });
    } else if (typeof value === "string") {
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
};

const Vault = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContent, setEditContent] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async (overrides = {}) => {
    const params = {
      q: overrides.q !== undefined ? overrides.q : searchQuery,
      categories:
        overrides.categories !== undefined ? overrides.categories : selectedCategories,
      tags: overrides.tags !== undefined ? overrides.tags : selectedTags,
      sort: overrides.sort !== undefined ? overrides.sort : sortOrder,
    };

    const requestParams = {};
    if (params.q) requestParams.q = params.q;
    if (Array.isArray(params.categories) && params.categories.length > 0) {
      requestParams.categories = params.categories;
    }
    if (Array.isArray(params.tags) && params.tags.length > 0) {
      requestParams.tags = params.tags;
    }
    if (params.sort) {
      requestParams.sort = params.sort;
    }

    try {
      const { data } = await fetchItems(requestParams);
      if (Array.isArray(data)) {
        setItems(data);
        setAvailableCategories(extractCategories(data));
        setAvailableTags(extractTags(data));
      } else {
        const nextItems = Array.isArray(data.items) ? data.items : [];
        setItems(nextItems);

        const categoriesFromResponse = Array.isArray(data.filters?.categories)
          ? data.filters.categories.filter(Boolean)
          : extractCategories(nextItems);
        const tagsFromResponse = Array.isArray(data.filters?.tags)
          ? data.filters.tags.filter(Boolean)
          : extractTags(nextItems);

        setAvailableCategories(categoriesFromResponse);
        setAvailableTags(tagsFromResponse);
      }
    } catch {
      setItems([]);
      setAvailableCategories([]);
      setAvailableTags([]);
    }
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    loadItems({ q });
  };

  const clearSearch = () => {
    setSearchQuery("");
    loadItems({ q: "" });
  };

  const toggleCategory = (category) => {
    const nextCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(nextCategories);
    loadItems({ categories: nextCategories });
  };

  const toggleTag = (tag) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(nextTags);
    loadItems({ tags: nextTags });
  };

  const updateSort = (value) => {
    setSortOrder(value);
    loadItems({ sort: value });
  };

  const handleSortChange = (e) => {
    updateSort(e.target.value);
  };

  const clearFilters = () => {
    if (
      selectedCategories.length === 0 &&
      selectedTags.length === 0 &&
      sortOrder === DEFAULT_SORT
    ) {
      return;
    }

    setSelectedCategories([]);
    setSelectedTags([]);
    setSortOrder(DEFAULT_SORT);
    loadItems({ categories: [], tags: [], sort: DEFAULT_SORT });
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
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      await createItem({
        title: newTitle.trim(),
        category: newCategory.trim(),
        content: newContent.trim()
      });
      toast.success("Item added successfully");
      closeModal();
      loadItems();
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

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdateItem = async (id) => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      await updateItem(id, {
        title: editTitle.trim(),
        category: editCategory.trim(),
        content: editContent.trim()
      });
      toast.success("Item updated successfully");
      setEditingId(null);
      loadItems();
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteItem(id);
      toast.success("Item deleted successfully");
      loadItems();
    } catch {
      toast.error("Failed to delete item");
    }
    setOpenMenuId(null);
  };

  const copyText = (key, text) => {
    if (!text) {
      toast.error("Nothing to copy");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Copied to clipboard");
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      },
      () => toast.error("Failed to copy")
    );
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const closeAllMenus = () => {
    setOpenMenuId(null);
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    sortOrder !== DEFAULT_SORT;

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortOrder)?.label || SORT_OPTIONS[0].label;

  const handleExportAll = () => {
    if (items.length === 0) return toast.error("No items to export");
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vault_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  // Categorize items
  const credentials = items.filter((i) => i.category === "Credential");
  const commands = items.filter((i) => i.category === "Command");
  const tokens = items.filter((i) => i.category === "Token");
  const others = items.filter(
    (i) => !["Credential", "Command", "Token"].includes(i.category)
  );

  // Render password field with toggle
  const renderPasswordField = (item) => (
    <div className="flex items-center mt-2">
      <span className="text-sm text-gray-600 mr-2">Password:</span>
      <span className="flex-grow break-all font-mono">
        {showPassword[item.id] ? (
          item.content
        ) : (
          <span className="tracking-widest">••••••••</span>
        )}
      </span>
      <button
        onClick={() => togglePasswordVisibility(item.id)}
        className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
        title={showPassword[item.id] ? "Hide password" : "Show password"}
      >
        {showPassword[item.id] ? (
          <EyeSlashIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        )}
      </button>
      <button
        className="ml-1 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 relative"
        onClick={() => copyText(`content-${item.id}`, item.content)}
        title="Copy password"
      >
        <DocumentDuplicateIcon className="h-5 w-5" />
        {copiedKey === `content-${item.id}` && (
          <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
        )}
      </button>
    </div>
  );

  // Render editable field
  const renderEditableField = (label, value, onChange, isTextarea = false) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {isTextarea ? (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={value}
          onChange={onChange}
        />
      ) : (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );

  // Render edit card
  const renderEditCard = (item) => (
    <div className="p-4 border rounded-lg bg-white shadow-sm mb-4">
      <div className="font-semibold mb-3 text-lg">Editing Item</div>
      {renderEditableField("Title", editTitle, (e) => setEditTitle(e.target.value))}
      {renderEditableField("Category", editCategory, (e) => setEditCategory(e.target.value))}
      {renderEditableField("Content", editContent, (e) => setEditContent(e.target.value), true)}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={cancelEditing}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          onClick={() => handleUpdateItem(item.id)}
        >
          Save Changes
        </button>
      </div>
    </div>
  );

  // Render item menu
  const renderItemMenu = (item) => (
    <div className="relative">
      <button
        className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        onClick={(e) => toggleMenu(item.id, e)}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {openMenuId === item.id && (
        <div
          className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => startEditing(item)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
            onClick={() => handleDeleteItem(item.id)}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  // Render credential card
  const renderCredential = (item) => (
    <div
      key={item.id}
      className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow relative"
      onClick={closeAllMenus}
    >
      {editingId === item.id ? (
        renderEditCard(item)
      ) : (
        <>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{item.title}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {item.category}
              </span>
            </div>
            {renderItemMenu(item)}
          </div>
          
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600 mr-2">Username:</span>
            <span className="flex-grow break-all">{item.title}</span>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 relative"
              onClick={() => copyText(`title-${item.id}`, item.title)}
              title="Copy username"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              {copiedKey === `title-${item.id}` && (
                <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </button>
          </div>
          
          {renderPasswordField(item)}
        </>
      )}
    </div>
  );

  // Render command/token card
  const renderCodeItem = (item) => (
    <div
      key={item.id}
      className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow relative"
      onClick={closeAllMenus}
    >
      {editingId === item.id ? (
        renderEditCard(item)
      ) : (
        <>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{item.title}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {item.category}
              </span>
            </div>
            {renderItemMenu(item)}
          </div>
          
          <div className="mt-2 flex items-start">
            <pre className="flex-grow bg-gray-50 p-3 rounded-md whitespace-pre-wrap break-words font-mono text-sm">
              {item.content}
            </pre>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 relative self-start"
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

  // Render other item card
  const renderOtherItem = (item) => (
    <div
      key={item.id}
      className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow relative"
      onClick={closeAllMenus}
    >
      {editingId === item.id ? (
        renderEditCard(item)
      ) : (
        <>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{item.title}</h3>
              {item.category && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {item.category}
                </span>
              )}
            </div>
            {renderItemMenu(item)}
          </div>
          
          <div className="mt-2 flex items-start group">
            <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap break-words flex-grow">
              {item.content.length > 150 ? (
                <>
                  {item.content.slice(0, 150)}
                  <span className="text-gray-400">...</span>
                </>
              ) : (
                item.content
              )}
            </div>
            <button
              className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity relative self-start"
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
    <div className="w-[90%] mx-auto px-4 py-6" onClick={closeAllMenus}>
      <Toaster position="top-right" />
      
      {/* Header and Search */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Secure Vault</h1>
            <p className="text-gray-600">Store and manage your sensitive information securely</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search items..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  type="button"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <button
              onClick={handleExportAll}
              type="button"
              className="flex items-center justify-center gap-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {availableCategories.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Filter by category</div>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => {
                  const isActive = selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-sm transition-colors ${
                        isActive
                          ? "bg-blue-100 border-blue-500 text-blue-700"
                          : "bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableTags.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Filter by tag</div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isActive = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-sm transition-colors ${
                        isActive
                          ? "bg-purple-100 border-purple-500 text-purple-700"
                          : "bg-white border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="vault-sort" className="text-sm font-medium text-gray-600">
                Sort by
              </label>
              <select
                id="vault-sort"
                value={sortOrder}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">Active filters:</span>
                {selectedCategories.map((category) => (
                  <button
                    key={`active-category-${category}`}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700"
                  >
                    {category}
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                ))}
                {selectedTags.map((tag) => (
                  <button
                    key={`active-tag-${tag}`}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700"
                  >
                    {tag}
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                ))}
                {sortOrder !== DEFAULT_SORT && (
                  <button
                    type="button"
                    onClick={() => updateSort(DEFAULT_SORT)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-200 text-gray-700"
                  >
                    {currentSortLabel}
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => openModal("Credential")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
          Add Credential
        </button>
        <button
          onClick={() => openModal("Command")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
          Add Command
        </button>
        <button
          onClick={() => openModal("Token")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
        >
          <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
          Add Token
        </button>
        <button
          onClick={() => openModal("")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
        >
          <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
          Add Other
        </button>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Credentials */}
        <div className="lg:w-1/2">
          {credentials.length > 0 ? (
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Credentials</h2>
                <span className="text-sm text-gray-500">
                  {credentials.length} {credentials.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="grid gap-4">
                {credentials.map(renderCredential)}
              </div>
            </section>
          ) : (
            <section className="mb-10 p-6 border border-dashed border-gray-300 rounded-lg text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Credentials</h2>
              <p className="text-gray-500 mb-4">Add your first credential to get started</p>
              <button
                onClick={() => openModal("Credential")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
                Add Credential
              </button>
            </section>
          )}
        </div>

        {/* Right Column - Commands */}
        <div className="lg:w-1/2">
          {commands.length > 0 ? (
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Commands</h2>
                <span className="text-sm text-gray-500">
                  {commands.length} {commands.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="grid gap-4">
                {commands.map(renderCodeItem)}
              </div>
            </section>
          ) : (
            <section className="mb-10 p-6 border border-dashed border-gray-300 rounded-lg text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Commands</h2>
              <p className="text-gray-500 mb-4">Add your first command to get started</p>
              <button
                onClick={() => openModal("Command")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
                Add Command
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Other Categories Below */}
      {/* Tokens Section */}
      {tokens.length > 0 && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tokens</h2>
            <span className="text-sm text-gray-500">
              {tokens.length} {tokens.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {tokens.map(renderCodeItem)}
          </div>
        </section>
      )}

      {/* Other Items Section */}
      {others.length > 0 && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Other Items</h2>
            <span className="text-sm text-gray-500">
              {others.length} {others.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {others.map(renderOtherItem)}
          </div>
        </section>
      )}

      {/* Empty State - when no items at all */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Get started by adding a new item"}
          </p>
          <button
            onClick={() => openModal("")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
            Add Item
          </button>
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New {modalCategory || "Item"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-4">
              {renderEditableField("Title", newTitle, (e) => setNewTitle(e.target.value))}
              {modalCategory ? (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    value={newCategory}
                    readOnly
                  />
                </div>
              ) : (
                renderEditableField("Category", newCategory, (e) => setNewCategory(e.target.value))
              )}
              {renderEditableField(
                "Content",
                newContent,
                (e) => setNewContent(e.target.value),
                true
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;