import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const QUIZ_MIN_OPTIONS = 3;
const QUIZ_OPTION_LIMIT = 4;

const KnowledgeBookmarksContext = createContext();

function shuffleArray(items) {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function getCSRFToken() {
  const meta = document.querySelector("meta[name='csrf-token']");
  return meta?.getAttribute("content");
}

export function KnowledgeBookmarksProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/knowledge_bookmarks", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load bookmarks");
      const data = await response.json();
      setBookmarks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const collections = useMemo(() => {
    return Array.from(new Set(bookmarks.map((b) => b.collection_name).filter(Boolean))).sort();
  }, [bookmarks]);

  const dueBookmarks = useMemo(() => {
    const now = Date.now();
    return bookmarks
      .filter((bookmark) => bookmark.next_reminder_at)
      .filter((bookmark) => {
        const reminderTime = new Date(bookmark.next_reminder_at).getTime();
        return !Number.isNaN(reminderTime) && reminderTime <= now;
      })
      .sort((a, b) => new Date(a.next_reminder_at).getTime() - new Date(b.next_reminder_at).getTime());
  }, [bookmarks]);

  const upcomingReminders = useMemo(() => {
    const now = Date.now();
    const horizon = now + 7 * 24 * 60 * 60 * 1000;
    return bookmarks
      .filter((bookmark) => bookmark.next_reminder_at)
      .map((bookmark) => ({ bookmark, time: new Date(bookmark.next_reminder_at).getTime() }))
      .filter(({ time }) => !Number.isNaN(time) && time > now && time <= horizon)
      .sort((a, b) => a.time - b.time)
      .map(({ bookmark }) => bookmark);
  }, [bookmarks]);

  const getLearningQuizQuestion = useCallback(async () => {
    const wordCandidates = bookmarks
      .filter((bookmark) => bookmark.card_type === "word_of_the_day")
      .map((bookmark) => {
        const definitionEntry = bookmark.payload?.definitions?.[0];
        const definition =
          typeof definitionEntry === "string"
            ? definitionEntry
            : definitionEntry?.text || definitionEntry?.definition || "";
        const word = bookmark.payload?.word;
        const note = bookmark.payload?.note;

        return {
          bookmark,
          word: typeof word === "string" ? word : undefined,
          definition: typeof definition === "string" ? definition : undefined,
          note: typeof note === "string" && note.trim().length ? note : undefined,
        };
      })
      .filter((entry) => entry.word && entry.definition);

    if (wordCandidates.length >= QUIZ_MIN_OPTIONS) {
      const shuffled = shuffleArray(wordCandidates);
      const [correct, ...others] = shuffled;
      const incorrectWords = others.map((entry) => entry.word).filter(Boolean);
      const uniqueOptions = Array.from(new Set([correct.word, ...incorrectWords]));
      if (uniqueOptions.length >= QUIZ_MIN_OPTIONS) {
        const optionSlice = uniqueOptions.slice(0, Math.min(QUIZ_OPTION_LIMIT, uniqueOptions.length));
        const options = shuffleArray(optionSlice);
        return {
          id: `bookmark-word-${correct.bookmark.id}`,
          question: `Which word matches this definition?\n“${correct.definition}”`,
          options,
          correctAnswer: correct.word,
          explanation: correct.note ? `Saved note: ${correct.note}` : undefined,
          source: "bookmarks",
          createdAt: new Date().toISOString(),
          relatedBookmarkId: correct.bookmark.id,
        };
      }
    }

    const tenseCandidates = bookmarks
      .filter((bookmark) => bookmark.card_type === "english_tense")
      .map((bookmark) => {
        const tense = bookmark.payload?.tense;
        const example = bookmark.payload?.example;
        const description = bookmark.payload?.description;
        return {
          bookmark,
          tense: typeof tense === "string" ? tense : undefined,
          example: typeof example === "string" ? example : undefined,
          description: typeof description === "string" ? description : undefined,
        };
      })
      .filter((entry) => entry.tense && entry.example);

    if (tenseCandidates.length >= QUIZ_MIN_OPTIONS) {
      const shuffled = shuffleArray(tenseCandidates);
      const [correct, ...others] = shuffled;
      const incorrectTenses = others.map((entry) => entry.tense).filter(Boolean);
      const uniqueOptions = Array.from(new Set([correct.tense, ...incorrectTenses]));
      if (uniqueOptions.length >= QUIZ_MIN_OPTIONS) {
        const optionSlice = uniqueOptions.slice(0, Math.min(QUIZ_OPTION_LIMIT, uniqueOptions.length));
        const options = shuffleArray(optionSlice);
        return {
          id: `bookmark-tense-${correct.bookmark.id}`,
          question: `Which tense is demonstrated by this example?\n“${correct.example}”`,
          options,
          correctAnswer: correct.tense,
          explanation: correct.description,
          source: "bookmarks",
          createdAt: new Date().toISOString(),
          relatedBookmarkId: correct.bookmark.id,
        };
      }
    }

    return null;
  }, [bookmarks]);

  const upsertBookmarkInState = useCallback((bookmark) => {
    setBookmarks((prev) => {
      const existingIndex = prev.findIndex((b) => b.id === bookmark.id);
      if (existingIndex >= 0) {
        const clone = [...prev];
        clone[existingIndex] = bookmark;
        return clone;
      }
      return [bookmark, ...prev];
    });
  }, []);

  const removeBookmarkFromState = useCallback((id) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
  }, []);

  const findBookmark = useCallback(
    ({ cardType, sourceId, payload }) => {
      return bookmarks.find((bookmark) => {
        if (bookmark.card_type !== cardType) return false;
        if (sourceId && bookmark.source_id) {
          return bookmark.source_id === sourceId;
        }
        if (sourceId && !bookmark.source_id) {
          return false;
        }
        if (!sourceId && bookmark.source_id) {
          return false;
        }
        return JSON.stringify(bookmark.payload) === JSON.stringify(payload);
      });
    },
    [bookmarks]
  );

  const createBookmark = useCallback(
    async ({ cardType, sourceId, payload, collectionName, reminderIntervalDays }) => {
      const response = await fetch("/api/knowledge_bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken(),
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          card_type: cardType,
          source_id: sourceId,
          payload,
          collection_name: collectionName,
          reminder_interval_days: reminderIntervalDays,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.errors?.join(", ") || "Unable to save bookmark");
      }

      const data = await response.json();
      upsertBookmarkInState(data);
      return data;
    },
    [upsertBookmarkInState]
  );

  const deleteBookmark = useCallback(async (id) => {
    const response = await fetch(`/api/knowledge_bookmarks/${id}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": getCSRFToken(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Unable to delete bookmark");
    }

    removeBookmarkFromState(id);
  }, [removeBookmarkFromState]);

  const updateBookmark = useCallback(
    async (id, payload) => {
      const response = await fetch(`/api/knowledge_bookmarks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken(),
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.errors?.join(", ") || "Unable to update bookmark");
      }

      const data = await response.json();
      upsertBookmarkInState(data);
      return data;
    },
    [upsertBookmarkInState]
  );

  const markReviewed = useCallback(
    async (id) => {
      const response = await fetch(`/api/knowledge_bookmarks/${id}/mark_reviewed`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": getCSRFToken(),
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.errors?.join(", ") || "Unable to mark bookmark as reviewed");
      }

      const data = await response.json();
      upsertBookmarkInState(data);
      return data;
    },
    [upsertBookmarkInState]
  );

  const value = useMemo(
    () => ({
      bookmarks,
      dueBookmarks,
      upcomingReminders,
      collections,
      loading,
      error,
      findBookmark,
      createBookmark,
      deleteBookmark,
      updateBookmark,
      markReviewed,
      getLearningQuizQuestion,
      refresh: fetchBookmarks,
    }),
    [
      bookmarks,
      dueBookmarks,
      upcomingReminders,
      collections,
      loading,
      error,
      findBookmark,
      createBookmark,
      deleteBookmark,
      updateBookmark,
      markReviewed,
      getLearningQuizQuestion,
      fetchBookmarks,
    ]
  );

  return (
    <KnowledgeBookmarksContext.Provider value={value}>
      {children}
    </KnowledgeBookmarksContext.Provider>
  );
}

export function useKnowledgeBookmarks() {
  const context = useContext(KnowledgeBookmarksContext);
  if (!context) {
    throw new Error("useKnowledgeBookmarks must be used within a KnowledgeBookmarksProvider");
  }
  return context;
}
