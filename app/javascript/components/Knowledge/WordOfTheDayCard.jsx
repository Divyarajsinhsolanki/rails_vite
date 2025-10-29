import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const API_KEYS = {
  WORDNIK: "YOUR_WORDNIK_KEY",
};

const fetchers = [
  () =>
    fetch(`https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${API_KEYS.WORDNIK}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.word) return data;
        throw new Error("Invalid Wordnik response");
      }),
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

export default function WordOfTheDayCard({
  cardType = "word_of_the_day",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [wordData, setWordData] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      const dayIndex = new Date().getDate() % fetchers.length;
      const todayFetchers = [...fetchers.slice(dayIndex), ...fetchers.slice(0, dayIndex)];

      for (const fetcher of todayFetchers) {
        try {
          const data = await fetcher();
          if (mounted) {
            setWordData({ ...data, fetched_at: new Date().toISOString() });
            setLoading(false);
          }
          return;
        } catch (error) {
          console.warn("Word fetch failed, trying next:", error.message);
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
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!wordData?.word) return null;
    return {
      cardType,
      sourceId: wordData.word,
      payload: wordData,
      title: "Word of the Day",
      subtitle: wordData.definitions?.[0]?.text || wordData.word,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, wordData, savedBookmark]);

  const existingBookmark = bookmarkPayload
    ? bookmarkHelpers?.find?.(bookmarkPayload) || savedBookmark
    : savedBookmark;
  const isBookmarked = Boolean(existingBookmark);

  const handleToggle = () => {
    if (!bookmarkPayload) return;
    bookmarkHelpers?.toggle?.({
      ...bookmarkPayload,
      collectionName: existingBookmark?.collection_name ?? bookmarkPayload.collectionName,
    });
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between min-h-[220px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">🧠 Word of the Day</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="text-sm text-gray-700 space-y-2">
          <div>
            <strong>{wordData?.word}</strong> ({wordData?.note || "No note"})
          </div>
          <div className="italic">“{wordData?.definitions?.[0]?.text}”</div>
          <div className="text-gray-500">— {wordData?.definitions?.[0]?.partOfSpeech}</div>
        </div>
      )}
    </div>
  );
}
