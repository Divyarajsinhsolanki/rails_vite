import React, { useEffect, useState } from "react";
import { fetchQuotes, createQuote } from "../components/api";

const QuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");

  const loadQuotes = async () => {
    try {
      const { data } = await fetchQuotes();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createQuote({ quote: { content, author } });
    setContent("");
    setAuthor("");
    loadQuotes();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 mt-10">
      <h2 className="text-2xl font-bold">Add a Quote</h2>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
        <input
          type="text"
          value={content}
          placeholder="Quote"
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded p-2 mb-2"
          required
        />
        <input
          type="text"
          value={author}
          placeholder="Author"
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        <button className="w-full bg-indigo-500 text-white rounded p-2 hover:bg-indigo-600">
          Save Quote
        </button>
      </form>

      <h2 className="text-2xl font-bold">Recent Quotes</h2>
      <ul className="space-y-4">
        {quotes.map((q) => (
          <li key={q.id} className="bg-white p-4 rounded shadow">
            <p className="text-gray-800">{q.content}</p>
            {q.author && <p className="text-sm text-gray-500">- {q.author}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuotesPage;
