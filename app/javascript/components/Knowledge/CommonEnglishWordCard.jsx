import React, { useEffect, useState } from "react";

export default function CommonEnglishWordCard() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWord() {
      try {
        const res = await fetch("/api/english_word");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setWord(data.word);
      } catch (err) {
        setWord("Unable to fetch word");
      } finally {
        setLoading(false);
      }
    }

    loadWord();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-2">Common English Word</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="text-sm text-gray-700">{word}</div>
      )}
    </div>
  );
}
