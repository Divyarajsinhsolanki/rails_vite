import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBook,
  FiBookmark,
  FiClock,
  FiFolder,
  FiSearch,
  FiStar,
  FiX,
  FiBell,
  FiCheckCircle,
} from "react-icons/fi";
import TodayInHistoryCard from "../components/Knowledge/TodayInHistoryCard";
import QuoteOfTheDayCard from "../components/Knowledge/QuoteOfTheDayCard";
import TopNewsCard from "../components/Knowledge/TopNewsCard";
import LocalHeadlinesCard from "../components/Knowledge/LocalHeadlinesCard";
import DailyFactCard from "../components/Knowledge/DailyFactCard";
import WordOfTheDayCard from "../components/Knowledge/WordOfTheDayCard";
import RandomCodingTipCard from "../components/Knowledge/RandomCodingTipCard";
import ScienceNewsCard from "../components/Knowledge/ScienceNewsCard";
import TechNewsCard from "../components/Knowledge/TechNewsCard";
import PolicyBriefCard from "../components/Knowledge/PolicyBriefCard";
import DevToolOfTheDayCard from "../components/Knowledge/DevToolOfTheDayCard";
import OpenIssueSpotlightCard from "../components/Knowledge/OpenIssueSpotlightCard";
import TopGainersCard from "../components/Knowledge/TopGainersCard";
import TopVolumeStocksCard from "../components/Knowledge/TopVolumeStocksCard";
import TopBuyingStocksCard from "../components/Knowledge/TopBuyingStocksCard";
import IndianStockNewsCard from "../components/Knowledge/IndianStockNewsCard";
import CommonEnglishWordCard from "../components/Knowledge/CommonEnglishWordCard";
import EnglishTenseCard from "../components/Knowledge/EnglishTenseCard";
import EnglishPhraseCard from "../components/Knowledge/EnglishPhraseCard";
import ImageOfTheDayCard from "../components/Knowledge/ImageOfTheDayCard";
import DailyQuizCard from "../components/Knowledge/DailyQuizCard";
import StudyReminderCard from "../components/Knowledge/StudyReminderCard";
import { KnowledgeBookmarksProvider, useKnowledgeBookmarks } from "../context/KnowledgeBookmarksContext";

// Category Tab Component
const CategoryTab = ({ category, isActive, onClick, index }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    onClick={onClick}
    className={`relative flex items-center gap-1.5 rounded-[18px] border px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
      isActive
        ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_34px_rgb(15_23_42_/_0.18)]"
        : "border-white/70 bg-white/68 text-slate-600 hover:bg-white hover:text-slate-950"
    }`}
  >
    <span className="text-lg">{category.icon}</span>
    <span>{category.name}</span>
    {isActive && (
      <motion.div
        layoutId="activeTabIndicator"
        className="absolute inset-0 -z-10 rounded-2xl bg-slate-950"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </motion.button>
);

function KnowledgeDashboardContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [uiLoading, setUiLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ reminderDue: false, hasNotes: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingBookmark, setPendingBookmark] = useState(null);
  const [collectionName, setCollectionName] = useState("");
  const [lastCollectionName, setLastCollectionName] = useState("");
  const [reminderIntervalDays, setReminderIntervalDays] = useState(7);
  const [feedback, setFeedback] = useState(null);

  const {
    bookmarks,
    dueBookmarks,
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
      {
        key: "today-history",
        cardType: "today_in_history",
        category: "learning",
        Component: TodayInHistoryCard,
        title: "Today in History",
        summary: "Historical events that happened on this day.",
      },
      {
        key: "quote-of-day",
        cardType: "quote_of_the_day",
        category: "learning",
        Component: QuoteOfTheDayCard,
        title: "Quote of the Day",
        summary: "A dose of inspiration to start your day.",
      },
      {
        key: "image-day",
        cardType: "image_of_the_day",
        category: "learning",
        Component: ImageOfTheDayCard,
        title: "Image of the Day",
        summary: "Discover a stunning astronomy image curated daily.",
      },
      {
        key: "daily-quiz",
        cardType: "daily_quiz",
        category: "learning",
        Component: DailyQuizCard,
        title: "Daily Quiz",
        summary: "Test yourself with a quick knowledge check.",
      },
      {
        key: "study-reminder",
        cardType: "study_reminder",
        category: "learning",
        Component: StudyReminderCard,
        title: "Study Reminders",
        summary: "Review what you've saved before reminders are due.",
      },
      {
        key: "top-news",
        cardType: "top_news",
        category: "news",
        Component: TopNewsCard,
        title: "Top News",
        summary: "Catch the top headlines from trusted sources.",
      },
      {
        key: "local-headlines",
        cardType: "local_headlines",
        category: "news",
        Component: LocalHeadlinesCard,
        title: "Local Headlines",
        summary: "Get the latest headlines tailored to your selected region.",
      },
      {
        key: "policy-briefs",
        cardType: "policy_briefs",
        category: "news",
        Component: PolicyBriefCard,
        title: "Policy Briefs",
        summary: "Review concise policy updates curated from trusted institutions.",
      },
      {
        key: "daily-fact",
        cardType: "daily_fact",
        category: "learning",
        Component: DailyFactCard,
        title: "Daily Fact",
        summary: "Learn an interesting fact every day.",
      },
      {
        key: "word-day",
        cardType: "word_of_the_day",
        category: "learning",
        Component: WordOfTheDayCard,
        title: "Word of the Day",
        summary: "Expand your vocabulary with a new word.",
      },
      {
        key: "common-word",
        cardType: "common_english_word",
        category: "learning",
        Component: CommonEnglishWordCard,
        title: "Common English Word",
        summary: "Master everyday words with practical usage tips.",
      },
      {
        key: "english-tense",
        cardType: "english_tense",
        category: "learning",
        Component: EnglishTenseCard,
        title: "English Tense",
        summary: "Review English tenses with quick refreshers.",
      },
      {
        key: "english-phrase",
        cardType: "english_phrase",
        category: "learning",
        Component: EnglishPhraseCard,
        title: "English Phrase",
        summary: "Understand helpful phrases and how to use them.",
      },
      {
        key: "coding-tip",
        cardType: "coding_tip",
        category: "tech",
        Component: RandomCodingTipCard,
        title: "Coding Tip",
        summary: "Sharpen your skills with a bite-sized coding tip.",
      },
      {
        key: "dev-tool-of-day",
        cardType: "dev_tool_of_the_day",
        category: "tech",
        Component: DevToolOfTheDayCard,
        title: "Dev Tool of the Day",
        summary: "Discover a developer tool to streamline your workflow.",
      },
      {
        key: "science-news",
        cardType: "science_news",
        category: "news",
        Component: ScienceNewsCard,
        title: "Science News",
        summary: "Stay curious with the latest science discoveries.",
      },
      {
        key: "tech-news",
        cardType: "tech_news",
        category: "tech",
        Component: TechNewsCard,
        title: "Tech News",
        summary: "Follow the newest stories in technology.",
      },
      {
        key: "open-issue-spotlight",
        cardType: "open_issue_spotlight",
        category: "tech",
        Component: OpenIssueSpotlightCard,
        title: "Open Issue Spotlight",
        summary: "Tackle a curated open source issue and give back.",
      },
      {
        key: "top-gainers",
        cardType: "top_gainers",
        category: "stocks",
        Component: TopGainersCard,
        title: "Top Gainers",
        summary: "See which stocks are climbing fastest today.",
      },
      {
        key: "top-volume",
        cardType: "top_volume",
        category: "stocks",
        Component: TopVolumeStocksCard,
        title: "Top Volume",
        summary: "Track the stocks with the highest trading volume.",
      },
      {
        key: "top-buying",
        cardType: "top_buying",
        category: "stocks",
        Component: TopBuyingStocksCard,
        title: "Top Buying",
        summary: "Monitor the most actively bought stocks.",
      },
      {
        key: "indian-news",
        cardType: "indian_stock_news",
        category: "stocks",
        Component: IndianStockNewsCard,
        title: "Indian Stock News",
        summary: "Follow the latest stories from Indian markets.",
      },
    ],
    []
  );

  const filterOptions = useMemo(
    () => [
      { key: "reminderDue", label: "Reminder due", icon: FiBell },
      { key: "hasNotes", label: "Has notes", icon: FiBook },
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
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const hasSearch = normalizedSearch.length > 0;

    const matchesSearch = (metadata) => {
      if (!hasSearch) return true;
      const title = metadata?.title?.toLowerCase() ?? "";
      const summary = metadata?.summary?.toLowerCase() ?? "";
      return title.includes(normalizedSearch) || summary.includes(normalizedSearch);
    };

    const isReminderDue = (bookmark) => {
      if (!bookmark) return false;
      const nextReminder = bookmark.next_reminder_at ? new Date(bookmark.next_reminder_at) : null;
      if (!nextReminder) return false;
      return nextReminder <= new Date();
    };

    const bookmarkHasNotes = (bookmark) => {
      if (!bookmark) return false;
      const notes = bookmark.notes ?? bookmark.payload?.notes;
      if (Array.isArray(notes)) return notes.length > 0;
      if (typeof notes === "string") return notes.trim().length > 0;
      if (notes && typeof notes === "object") return Object.keys(notes).length > 0;
      return Boolean(notes);
    };

    const matchesFilterFlags = (bookmark) => {
      if (filters.reminderDue && !isReminderDue(bookmark)) {
        return false;
      }
      if (filters.hasNotes && !bookmarkHasNotes(bookmark)) {
        return false;
      }
      return true;
    };

    if (activeCategory === "saved") {
      return bookmarks
        .map((bookmark) => {
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
            metadata: definition ?? { title: "Saved item", summary: "" },
          };
        })
        .filter((item) => matchesSearch(item.metadata) && matchesFilterFlags(item.bookmark));
    }

    if (activeCategory === "due") {
      return dueBookmarks
        .map((bookmark) => {
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
            metadata: definition ?? { title: "Saved item", summary: "" },
          };
        })
        .filter((item) => matchesSearch(item.metadata) && matchesFilterFlags(item.bookmark));
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
        bookmark: null,
        metadata: definition,
      }))
      .filter((item) => matchesSearch(item.metadata) && matchesFilterFlags(item.bookmark));
  }, [
    activeCategory,
    bookmarks,
    bookmarkHelpers,
    cardDefinitions,
    cardTypeMap,
    dueBookmarks,
    filters.hasNotes,
    filters.reminderDue,
    searchQuery,
  ]);

  const isLoading = uiLoading || (bookmarksLoading && activeCategory !== "saved" && activeCategory !== "due");
  const hasSearch = searchQuery.trim().length > 0;
  const filtersActive = Object.values(filters).some(Boolean);
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen pb-16 text-slate-900">
      <div className="mx-auto max-w-[98%] space-y-6 px-4 pt-10 sm:px-6 lg:px-8">
        <section className="shell-panel shell-panel-strong sticky top-[6rem] z-20 mb-4 overflow-hidden rounded-[32px]">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

          <div className="space-y-4 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="shell-chip mb-3">
                  <span className="shell-chip-dot" />
                  Knowledge Signal Matrix
                </div>
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">
                  Curated discovery with active memory built in.
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  Search the deck, filter quickly, and move between saved collections and due reviews without the extra promo UI.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:max-w-[32rem] xl:justify-end">
                <span className="shell-chip">
                  <span className="shell-chip-dot" />
                  {currentDate}
                </span>
                <span className="shell-chip">
                  <span className="shell-chip-dot" />
                  {filteredCards.length} visible
                </span>
                <span className="shell-chip">
                  <span className="shell-chip-dot" />
                  Saved {savedCount}
                </span>
                <span className="shell-chip">
                  <span className="shell-chip-dot" />
                  Due {dueCount}
                </span>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={() => setFilters({ reminderDue: false, hasNotes: false })}
                    className="rounded-full border border-white/70 bg-white/72 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-white hover:text-slate-950"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,_1fr)_auto] xl:items-center">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search the knowledge deck..."
                  className="w-full rounded-[22px] border border-white/70 bg-white/80 py-3 pl-12 pr-12 text-sm text-slate-700 outline-none ring-0 transition focus:border-sky-200 focus:bg-white focus:shadow-[0_18px_34px_rgb(15_23_42_/_0.08)]"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                {filterOptions.map((option) => {
                  const isActive = filters[option.key];
                  const IconComponent = option.icon;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          [option.key]: !prev[option.key],
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 rounded-[18px] border px-3 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_34px_rgb(15_23_42_/_0.18)]"
                          : "border-white/70 bg-white/72 text-slate-600 hover:bg-white hover:text-slate-950"
                      }`}
                      aria-pressed={isActive}
                    >
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat, index) => (
                <CategoryTab
                  key={cat.id}
                  category={cat}
                  isActive={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        <AnimatePresence>
          {feedback ? (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed left-1/2 top-24 z-50"
            >
              <div
                className={`flex items-center gap-3 rounded-[22px] border px-5 py-3 shadow-[0_24px_64px_rgb(15_23_42_/_0.2)] backdrop-blur-xl ${
                  feedback.type === "error"
                    ? "border-rose-200 bg-rose-500 text-white"
                    : feedback.type === "info"
                      ? "border-sky-200 bg-sky-500 text-white"
                      : "border-emerald-200 bg-emerald-500 text-white"
                }`}
              >
                {feedback.type === "success" && <FiCheckCircle className="h-5 w-5" />}
                {feedback.type === "error" && <FiX className="h-5 w-5" />}
                {feedback.type === "info" && <FiBookmark className="h-5 w-5" />}
                <span className="font-medium">{feedback.message}</span>
                <button
                  className="ml-2 rounded-lg p-1 hover:bg-white/20"
                  onClick={() => setFeedback(null)}
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="space-y-6">
          <div className="px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Signal Overview</p>
              <p className="mt-1 text-sm text-slate-600">
                {filteredCards.length} card{filteredCards.length === 1 ? "" : "s"} in view
                {hasSearch ? ` for "${searchQuery.trim()}"` : ""}
                {filtersActive ? " with active filters applied" : ""}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="overflow-hidden rounded-[28px] border border-white/70 bg-white/76 shadow-[0_20px_44px_rgb(15_23_42_/_0.08)]"
                >
                  <div className="h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400" />
                  <div className="space-y-4 p-5">
                    <div className="h-6 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                    <div className="h-20 animate-pulse rounded-2xl bg-slate-50" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div layout className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
              <AnimatePresence>
                {filteredCards.map((item, index) => (
                  <motion.div
                    key={item.key}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.36, delay: index * 0.025 }}
                    whileHover={{ y: -6, rotateX: 2, scale: 1.012 }}
                    className="mb-6 break-inside-avoid"
                  >
                    <div className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/76 shadow-[0_22px_52px_rgb(15_23_42_/_0.08)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_28px_64px_rgb(15_23_42_/_0.14)]">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_40%)] opacity-80" />

                      <div className="relative">
                        <item.Component {...item.props} />

                        {item.bookmark ? (
                          <SavedBookmarkFooter
                            bookmark={item.bookmark}
                            onRemove={() =>
                              handleBookmarkToggle({
                                cardType: item.bookmark.card_type,
                                sourceId: item.bookmark.source_id,
                                payload: item.bookmark.payload,
                              })
                            }
                            onMarkReviewed={() => bookmarkHelpers.markReviewed(item.bookmark)}
                          />
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredCards.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shell-panel shell-panel-strong rounded-[32px] px-6 py-16 text-center"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 blur-2xl opacity-70" />
                <div className="relative mb-6 text-7xl">{hasSearch || filtersActive ? "🔍" : "📚"}</div>
              </div>
              {hasSearch || filtersActive ? (
                <>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">No matches found</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Adjust the search or clear the active filters to reopen the full knowledge signal deck.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilters({ reminderDue: false, hasNotes: false });
                    }}
                    className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgb(15_23_42_/_0.18)] hover:brightness-110"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">No cards in this lane</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Switch categories above to move across the rest of the knowledge network.
                  </p>
                </>
              )}
            </motion.div>
          ) : null}
        </main>

      {/* Premium Bookmark Modal */}
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
  </div>
  );
}

function SavedBookmarkFooter({ bookmark, onRemove, onMarkReviewed }) {
  const nextReminder = bookmark.next_reminder_at ? new Date(bookmark.next_reminder_at) : null;
  const lastViewed = bookmark.last_viewed_at ? new Date(bookmark.last_viewed_at) : null;
  const isDue = nextReminder ? nextReminder <= new Date() : false;

  return (
    <div className="border-t border-gray-100 px-4 py-4 bg-gradient-to-br from-gray-50 to-indigo-50/30">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="space-y-1.5 text-sm">
          {bookmark.collection_name && (
            <div className="flex items-center gap-2">
              <FiFolder className="h-4 w-4 text-indigo-500" />
              <span className="font-medium text-gray-700">{bookmark.collection_name}</span>
            </div>
          )}
          {lastViewed && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <FiClock className="h-3.5 w-3.5" />
              <span>Reviewed: {lastViewed.toLocaleDateString()}</span>
            </div>
          )}
          {nextReminder && (
            <div className={`flex items-center gap-2 text-xs ${isDue ? "text-rose-600 font-semibold" : "text-gray-500"}`}>
              <FiBell className={`h-3.5 w-3.5 ${isDue ? "text-rose-500" : ""}`} />
              <span>Next: {nextReminder.toLocaleDateString()}</span>
              {isDue && <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-[10px] font-bold uppercase">Due</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkReviewed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-emerald-200 transition-all duration-200"
          >
            <FiCheckCircle className="h-3.5 w-3.5" />
            Reviewed
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-rose-100 hover:text-rose-600 transition-all duration-200"
          >
            <FiX className="h-3.5 w-3.5" />
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
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200">
                    <FiStar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Save to Collection</h2>
                    <p className="text-sm text-gray-500">Organize and set review reminders</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Card preview */}
              {(bookmark?.title || bookmark?.subtitle) && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                  {bookmark?.title && (
                    <p className="font-semibold text-gray-900">{bookmark.title}</p>
                  )}
                  {bookmark?.subtitle && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{bookmark.subtitle}</p>
                  )}
                </div>
              )}

              {/* Collection field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiFolder className="h-4 w-4 text-indigo-500" />
                  Collection
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Or create a new collection..."
                  value={collectionName || ""}
                  onChange={(event) => onCollectionChange(event.target.value)}
                />
              </div>

              {/* Reminder field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiBell className="h-4 w-4 text-purple-500" />
                  Reminder Frequency
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-16"
                    value={reminderIntervalDays}
                    onChange={(event) => onReminderChange(Number(event.target.value) || 1)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">days</span>
                </div>
                <p className="text-xs text-gray-500">You'll be reminded to review this card after the specified number of days.</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    <FiBookmark className="h-4 w-4" />
                    Save Bookmark
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SavedBookmarkFallback({ savedBookmark }) {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-300">
          <FiBookmark className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Saved item</h3>
          <p className="text-sm text-gray-500">Card type not recognized</p>
        </div>
      </div>
      <pre className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 overflow-auto max-h-48">
        {JSON.stringify(savedBookmark?.payload, null, 2)}
      </pre>
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
