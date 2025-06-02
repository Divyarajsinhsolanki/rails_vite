import React, { useEffect, useState } from "react";

const API_KEYS = {
  WORDNIK: "YOUR_WORDNIK_KEY", // primary
};

const fetchers = [
  // 1) Wordnik Word of the Day
  () =>
    fetch(`https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${API_KEYS.WORDNIK}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.word) return data;
        throw new Error("Invalid Wordnik response");
      }),

  // 2) OwlBot (free, no key needed, random word fallback)
  () =>
    fetch("https://owlbot.info/api/v4/dictionary/example")
      .then((res) => res.json())
      .then((data) => {
        if (data?.word && data?.definitions?.length)
          return {
            word: data.word,
            note: "Example word from OwlBot",
            definitions: data.definitions,
          };
        throw new Error("Invalid OwlBot response");
      }),

  // 3) Datamuse + Dictionary API combo (fetch random word then definition)
  async () => {
    const wordRes = await fetch("https://api.datamuse.com/words?sp=?????&max=1");
    const wordData = await wordRes.json();
    if (!wordData.length) throw new Error("Datamuse no words");

    const word = wordData[0].word;
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const dictData = await dictRes.json();
    if (!dictData[0]?.meanings?.length) throw new Error("DictionaryAPI no meanings");

    return {
      word,
      note: "Random word from Datamuse & DictionaryAPI",
      definitions: [
        {
          text: dictData[0].meanings[0].definitions[0].definition,
          partOfSpeech: dictData[0].meanings[0].partOfSpeech,
        },
      ],
    };
  },
];

export default function WordOfTheDayCard() {
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
  
    async function fetchWithFallback() {
      setLoading(true);
      const dayIndex = new Date().getDate() % fetchers.length; // Rotate daily
      const todayFetchers = [...fetchers.slice(dayIndex), ...fetchers.slice(0, dayIndex)];
  
      for (const fetcher of todayFetchers) {
        try {
          const data = await fetcher();
          if (mounted) {
            setWordData(data);
            setLoading(false);
          }
          return;
        } catch (e) {
          console.warn("Word fetch failed, trying next:", e.message);
        }
      }
  
      if (mounted) {
        setWordData({ word: "No word available", note: "", definitions: [{ text: "", partOfSpeech: "" }] });
        setLoading(false);
      }
    }
  
    fetchWithFallback();
  
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-2">🧠 Word of the Day</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="text-sm text-gray-700 space-y-1">
          <div>
            <strong>{wordData.word}</strong> ({wordData.note || "No note"})
          </div>
          <div className="italic">“{wordData.definitions?.[0]?.text}”</div>
          <div className="text-gray-500">— {wordData.definitions?.[0]?.partOfSpeech}</div>
        </div>
      )}
    </div>
  );
}
