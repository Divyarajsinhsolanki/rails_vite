import React, { useEffect, useState } from "react";
import { fetchNotes, createNote, updateNote, deleteNote } from "../components/api";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ id: null, title: "", body: "" });

  const loadNotes = async () => {
    try {
      const { data } = await fetchNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.id) {
      await updateNote(form.id, { title: form.title, body: form.body });
    } else {
      await createNote({ title: form.title, body: form.body });
    }
    setForm({ id: null, title: "", body: "" });
    loadNotes();
  };

  const handleEdit = (note) => {
    setForm(note);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    loadNotes();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Notes</h2>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-4 mb-6">
        <input
          className="w-full mb-2 border rounded p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="w-full mb-2 border rounded p-2"
          placeholder="Body"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          {form.id ? "Update Note" : "Add Note"}
        </button>
        {form.id && (
          <button
            type="button"
            className="ml-2 text-sm text-gray-500"
            onClick={() => setForm({ id: null, title: "", body: "" })}
          >
            Cancel
          </button>
        )}
      </form>

      <ul className="space-y-4">
        {notes.map((note) => (
          <li key={note.id} className="bg-white shadow-md p-4 rounded border">
            <h3 className="text-lg font-semibold">{note.title}</h3>
            <p className="text-gray-700 whitespace-pre-line">{note.body}</p>
            <div className="mt-2 flex justify-end space-x-2">
              <button
                className="text-sm text-blue-600"
                onClick={() => handleEdit(note)}
              >
                Edit
              </button>
              <button
                className="text-sm text-red-600"
                onClick={() => handleDelete(note.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notes;
