import React, { useEffect, useState } from "react";

export default function RandomCodingTipCard() {
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCodingTip() {
      setLoading(true);
      try {
        const res = await fetch("/api/coding_tip");
        if (!res.ok) throw new Error("Network error");

        const data = await res.json();
        setTip(data.tip);
      } catch (error) {
        setTip("Unable to fetch tip. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchCodingTip();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col justify-center">
      <h2 className="text-lg font-semibold mb-2">💡 AI Coding Tip of the Day</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading AI-generated tip...</p>
      ) : (
        <p className="text-sm text-gray-700">{tip}</p>
      )}
    </div>
  );
}
