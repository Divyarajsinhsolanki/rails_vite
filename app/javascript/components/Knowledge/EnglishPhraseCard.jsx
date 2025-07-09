import React, { useEffect, useState } from "react";

export default function EnglishPhraseCard() {
  const [phrase, setPhrase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPhrase() {
      try {
        const res = await fetch("/api/english_phrase");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setPhrase(data);
      } catch (err) {
        setPhrase({ phrase: "Unable to fetch phrase" });
      } finally {
        setLoading(false);
      }
    }

    loadPhrase();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-2">English Phrase</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="text-sm text-gray-700">
          <p>“{phrase.phrase}”</p>
          {phrase.author && (
            <p className="text-right text-gray-500">— {phrase.author}</p>
          )}
        </div>
      )}
    </div>
  );
}
