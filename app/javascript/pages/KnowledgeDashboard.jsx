import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TodayInHistoryCard from "../components/Knowledge/TodayInHistoryCard";
import QuoteOfTheDayCard from "../components/Knowledge/QuoteOfTheDayCard";
import TopNewsCard from "../components/Knowledge/TopNewsCard";
import DailyFactCard from "../components/Knowledge/DailyFactCard";
import WordOfTheDayCard from "../components/Knowledge/WordOfTheDayCard";
import RandomCodingTipCard from "../components/Knowledge/RandomCodingTipCard";
import ScienceNewsCard from "../components/Knowledge/ScienceNewsCard";
import TechNewsCard from "../components/Knowledge/TechNewsCard";
import TopGainersCard from "../components/Knowledge/TopGainersCard";
import TopVolumeStocksCard from "../components/Knowledge/TopVolumeStocksCard";
import TopBuyingStocksCard from "../components/Knowledge/TopBuyingStocksCard";
import IndianStockNewsCard from "../components/Knowledge/IndianStockNewsCard";
import CommonEnglishWordCard from "../components/Knowledge/CommonEnglishWordCard";
import EnglishTenseCard from "../components/Knowledge/EnglishTenseCard";
import EnglishPhraseCard from "../components/Knowledge/EnglishPhraseCard";
import ImageOfTheDayCard from "../components/Knowledge/ImageOfTheDayCard";
import { KnowledgeBookmarksProvider, useKnowledgeBookmarks } from "../context/KnowledgeBookmarksContext";

function KnowledgeDashboardContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [uiLoading, setUiLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingBookmark, setPendingBookmark] = useState(null);
  const [collectionName, setCollectionName] = useState("");
  const [lastCollectionName, setLastCollectionName] = useState("");
  const [reminderIntervalDays, setReminderIntervalDays] = useState(7);
  const [feedback, setFeedback] = useState(null);

  const {
    bookmarks,
    collections,
    loading: bookmarksLoading,
    createBookmark,
    deleteBookmark,
    findBookmark,
    markReviewed,
  } = useKnowledgeBookmarks();

  useEffect(() => {
    const timer = setTimeout(() => setUiLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const dueBookmarks = useMemo(() => {
    const now = new Date();
    return bookmarks.filter((bookmark) => bookmark.next_reminder_at && new Date(bookmark.next_reminder_at) <= now);
  }, [bookmarks]);

  const savedCount = bookmarks.length;
  const dueCount = dueBookmarks.length;

  const categories = useMemo(
    () => [
      { id: "all", name: "All", icon: "🌐" },
      { id: "news", name: "News", icon: "📰" },
      { id: "learning", name: "Learning", icon: "🎓" },
      { id: "stocks", name: "Stocks", icon: "📈" },
      { id: "tech", name: "Tech", icon: "💻" },
      { id: "saved", name: `Saved (${savedCount})`, icon: "⭐" },
      { id: "due", name: `Due (${dueCount})`, icon: "🔔" },
    ],
    [savedCount, dueCount]
  );

  const cardDefinitions = useMemo(
    () => [
      { key: "today-history", cardType: "today_in_history", category: "learning", Component: TodayInHistoryCard },
      { key: "quote-of-day", cardType: "quote_of_the_day", category: "learning", Component: QuoteOfTheDayCard },
      { key: "image-day", cardType: "image_of_the_day", category: "learning", Component: ImageOfTheDayCard },
      { key: "top-news", cardType: "top_news", category: "news", Component: TopNewsCard },
      { key: "daily-fact", cardType: "daily_fact", category: "learning", Component: DailyFactCard },
      { key: "word-day", cardType: "word_of_the_day", category: "learning", Component: WordOfTheDayCard },
      { key: "common-word", cardType: "common_english_word", category: "learning", Component: CommonEnglishWordCard },
      { key: "english-tense", cardType: "english_tense", category: "learning", Component: EnglishTenseCard },
      { key: "english-phrase", cardType: "english_phrase", category: "learning", Component: EnglishPhraseCard },
      { key: "coding-tip", cardType: "coding_tip", category: "tech", Component: RandomCodingTipCard },
      { key: "science-news", cardType: "science_news", category: "news", Component: ScienceNewsCard },
      { key: "tech-news", cardType: "tech_news", category: "tech", Component: TechNewsCard },
      { key: "top-gainers", cardType: "top_gainers", category: "stocks", Component: TopGainersCard },
      { key: "top-volume", cardType: "top_volume", category: "stocks", Component: TopVolumeStocksCard },
      { key: "top-buying", cardType: "top_buying", category: "stocks", Component: TopBuyingStocksCard },
      { key: "indian-news", cardType: "indian_stock_news", category: "stocks", Component: IndianStockNewsCard },
    ],
    []
  );

  const cardTypeMap = useMemo(() => {
    const map = new Map();
    cardDefinitions.forEach((definition) => {
      map.set(definition.cardType, definition);
    });
    return map;
  }, [cardDefinitions]);

  const handleBookmarkToggle = async (bookmarkData) => {
    if (!bookmarkData) return;
    const existing = findBookmark(bookmarkData);
    try {
      if (existing) {
        await deleteBookmark(existing.id);
        setFeedback({ type: "info", message: "Removed from saved" });
      } else {
        setPendingBookmark(bookmarkData);
        setCollectionName(bookmarkData.collectionName || lastCollectionName || "");
        setReminderIntervalDays(bookmarkData.reminderIntervalDays || 7);
        setModalOpen(true);
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const bookmarkHelpers = useMemo(
    () => ({
      toggle: handleBookmarkToggle,
      find: (bookmarkPayload) => findBookmark(bookmarkPayload),
      markReviewed: async (bookmark) => {
        try {
          await markReviewed(bookmark.id);
          setFeedback({ type: "success", message: "Marked as reviewed" });
        } catch (err) {
          setFeedback({ type: "error", message: err.message });
        }
      },
    }),
    [findBookmark, handleBookmarkToggle, markReviewed]
  );

  const filteredCards = useMemo(() => {
    if (activeCategory === "saved") {
      return bookmarks.map((bookmark) => {
        const definition = cardTypeMap.get(bookmark.card_type);
        return {
          key: `bookmark-${bookmark.id}`,
          Component: definition?.Component ?? SavedBookmarkFallback,
          cardType: bookmark.card_type,
          props: {
            bookmarkHelpers,
            initialData: bookmark.payload,
            savedBookmark: bookmark,
            isSavedView: true,
            cardType: bookmark.card_type,
          },
          bookmark,
        };
      });
    }

    if (activeCategory === "due") {
      return dueBookmarks.map((bookmark) => {
        const definition = cardTypeMap.get(bookmark.card_type);
        return {
          key: `due-${bookmark.id}`,
          Component: definition?.Component ?? SavedBookmarkFallback,
          cardType: bookmark.card_type,
          props: {
            bookmarkHelpers,
            initialData: bookmark.payload,
            savedBookmark: bookmark,
            isSavedView: true,
            cardType: bookmark.card_type,
          },
          bookmark,
        };
      });
    }

    return cardDefinitions
      .filter((definition) => activeCategory === "all" || definition.category === activeCategory)
      .map((definition) => ({
        key: definition.key,
        Component: definition.Component,
        cardType: definition.cardType,
        props: {
          bookmarkHelpers,
          cardType: definition.cardType,
        },
      }));
  }, [activeCategory, bookmarks, bookmarkHelpers, cardDefinitions, cardTypeMap, dueBookmarks]);

  const isLoading = uiLoading || (bookmarksLoading && activeCategory !== "saved" && activeCategory !== "due");

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[rgb(var(--theme-color-rgb)/0.1)] text-gray-900">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color-dark)] bg-clip-text text-transparent">
              Knowledge Hub
            </h1>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[var(--theme-color)] text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {feedback && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "bg-red-100 text-red-700"
                : feedback.type === "info"
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {feedback.message}
            <button className="ml-4 text-xs underline" onClick={() => setFeedback(null)}>
              dismiss
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="h-64 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
            <AnimatePresence>
              {filteredCards.map((item) => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="mb-6 break-inside-avoid rounded-2xl overflow-hidden"
                >
                  <div className="border bg-white border-gray-200 hover:border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                    <item.Component {...item.props} />
                    {item.bookmark && (
                      <SavedBookmarkFooter
                        bookmark={item.bookmark}
                        onRemove={() => handleBookmarkToggle({
                          cardType: item.bookmark.card_type,
                          sourceId: item.bookmark.source_id,
                          payload: item.bookmark.payload,
                        })}
                        onMarkReviewed={() => bookmarkHelpers.markReviewed(item.bookmark)}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredCards.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🧐</div>
            <h3 className="text-xl font-medium mb-2">No items in this category</h3>
            <p className="text-gray-500">Try selecting a different category above</p>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Knowledge Hub • Updated daily • {new Date().toLocaleDateString()}</p>
        </div>
      </footer>

      <BookmarkModal
        open={modalOpen}
        bookmark={pendingBookmark}
        collectionName={collectionName}
        reminderIntervalDays={reminderIntervalDays}
        collections={collections}
        onCollectionChange={setCollectionName}
        onReminderChange={setReminderIntervalDays}
        onClose={() => {
          setModalOpen(false);
          setPendingBookmark(null);
        }}
        onSubmit={async () => {
          if (!pendingBookmark) return;
          try {
            const created = await createBookmark({
              cardType: pendingBookmark.cardType,
              sourceId: pendingBookmark.sourceId,
              payload: pendingBookmark.payload,
              collectionName: collectionName || null,
              reminderIntervalDays,
            });
            setModalOpen(false);
            setPendingBookmark(null);
            setLastCollectionName(collectionName || "");
            setFeedback({ type: "success", message: "Saved to your knowledge collections" });
            return created;
          } catch (err) {
            setFeedback({ type: "error", message: err.message });
          }
        }}
      />
    </div>
  );
}

function SavedBookmarkFooter({ bookmark, onRemove, onMarkReviewed }) {
  const nextReminder = bookmark.next_reminder_at ? new Date(bookmark.next_reminder_at) : null;
  const lastViewed = bookmark.last_viewed_at ? new Date(bookmark.last_viewed_at) : null;
  const isDue = nextReminder ? nextReminder <= new Date() : false;

  return (
    <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600 bg-gray-50 rounded-b-2xl">
      <div className="flex flex-wrap justify-between gap-2">
        <div className="space-y-1">
          {bookmark.collection_name && <div className="font-medium">Collection: {bookmark.collection_name}</div>}
          {lastViewed && <div>Last reviewed: {lastViewed.toLocaleDateString()}</div>}
          {nextReminder && (
            <div className={isDue ? "text-red-600 font-medium" : ""}>
              Next reminder: {nextReminder.toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkReviewed}
            className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition"
          >
            Mark reviewed
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function BookmarkModal({
  open,
  bookmark,
  collectionName,
  reminderIntervalDays,
  collections,
  onCollectionChange,
  onReminderChange,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">Save to your collection</h2>
            <p className="text-sm text-gray-500">Organize this card and choose how often you want reminders.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {bookmark?.title && <div className="text-sm font-medium">{bookmark.title}</div>}
        {bookmark?.subtitle && <div className="text-xs text-gray-500">{bookmark.subtitle}</div>}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Collection</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={collectionName || ""}
            onChange={(event) => onCollectionChange(event.target.value)}
          >
            <option value="">No collection</option>
            {collections.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Or create a new collection"
            value={collectionName || ""}
            onChange={(event) => onCollectionChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Reminder frequency (days)</label>
          <input
            type="number"
            min="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={reminderIntervalDays}
            onChange={(event) => onReminderChange(Number(event.target.value) || 1)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-[var(--theme-color)] rounded-lg hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function SavedBookmarkFallback({ savedBookmark }) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Saved item</h3>
          <p className="text-sm text-gray-500">We couldn't find a renderer for this card type.</p>
        </div>
      </div>
      <pre className="bg-gray-100 rounded-lg p-3 text-xs overflow-auto max-h-60">{JSON.stringify(savedBookmark?.payload, null, 2)}</pre>
    </div>
  );
}

export default function KnowledgeDashboard() {
  return (
    <KnowledgeBookmarksProvider>
      <KnowledgeDashboardContent />
    </KnowledgeBookmarksProvider>
  );
}
