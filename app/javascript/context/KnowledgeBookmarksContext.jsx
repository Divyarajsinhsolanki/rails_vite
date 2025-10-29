import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KnowledgeBookmarksContext = createContext();

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
      collections,
      loading,
      error,
      findBookmark,
      createBookmark,
      deleteBookmark,
      updateBookmark,
      markReviewed,
      refresh: fetchBookmarks,
    }),
    [bookmarks, collections, loading, error, findBookmark, createBookmark, deleteBookmark, updateBookmark, markReviewed, fetchBookmarks]
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
