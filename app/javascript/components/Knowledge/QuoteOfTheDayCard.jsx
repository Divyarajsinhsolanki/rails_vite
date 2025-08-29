import React, { useEffect, useState } from "react";

const fetchers = [
  // 1) ZenQuotes
  () =>
    fetch("https://zenquotes.io/api/today")
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]?.q) return data[0];
        throw new Error("Invalid ZenQuotes response");
      }),

  // 2) Quotable API
  () =>
    fetch("https://api.quotable.io/random")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) return { q: data.content, a: data.author };
        throw new Error("Invalid Quotable response");
      }),

  // 3) They Said So Quotes API (free tier)
  () =>
    fetch("https://quotes.rest/qod?language=en")
      .then((res) => res.json())
      .then((data) => {
        const qod = data?.contents?.quotes?.[0];
        if (qod?.quote) return { q: qod.quote, a: qod.author };
        throw new Error("Invalid They Said So response");
      }),
];

const fallbackQuotes = [
  { q: "Practice makes perfect.", a: "Unknown" },
  { q: "Code is like humor. When you have to explain it, it's bad.", a: "Cory House" },
  { q: "First, solve the problem. Then, write the code.", a: "John Johnson" },
  { q: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", a: "Martin Fowler" },
];

export default function QuoteOfTheDayCard() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      for (const fetcher of fetchers) {
        try {
          const result = await fetcher();
          if (mounted) {
            setQuote(result);
            setLoading(false);
          }
          return;
        } catch (e) {
          console.warn("Quote fetch failed, trying next:", e.message);
        }
      }
      // all failed fallback
      if (mounted) {
        setQuote(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]);
        setLoading(false);
      }
    }

    fetchWithFallback();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-2">🧘 Quote of the Day</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <blockquote className="text-sm italic text-gray-700">
          “{quote.q}”
          {quote.a && <footer className="mt-2 text-right text-gray-500">– {quote.a}</footer>}
        </blockquote>
      )}
    </div>
  );
}
