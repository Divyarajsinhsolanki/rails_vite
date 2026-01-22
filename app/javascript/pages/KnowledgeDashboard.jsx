import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBook,
  FiBookmark,
  FiCalendar,
  FiClock,
  FiFolder,
  FiGrid,
  FiRefreshCcw,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiX,
  FiZap,
  FiBell,
  FiLayers,
  FiCheckCircle,
  FiFilter,
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



// Statistics Card Component
const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-lg"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
    <div className="relative flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/70">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </motion.div>
);

// Category Tab Component
const CategoryTab = ({ category, isActive, onClick, index }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    onClick={onClick}
    className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isActive
      ? "bg-white text-gray-900 shadow-xl shadow-white/20"
      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm"
      }`}
  >
    <span className="text-lg">{category.icon}</span>
    <span>{category.name}</span>
    {isActive && (
      <motion.div
        layoutId="activeTabIndicator"
        className="absolute inset-0 rounded-xl bg-white -z-10"
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
  const collectionsCount = collections.length;

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
  const totalCardsCount = cardDefinitions.length;

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Hero Header */}
      <header className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        <div className="relative max-w-[98%] mx-auto px-6 py-6">

          {/* Top Row: Title and Date */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-1 mb-4"

          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <FiBook className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Knowledge Hub</h1>
                <p className="text-white/70 text-sm mt-1">{currentDate}</p>
              </div>
            </div>
            <p className="text-white/80 text-lg max-w-2xl mt-2">
              Your daily feed of curated knowledge. Discover, learn, and grow with handpicked content across news, tech, stocks, and learning.
            </p>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

            <StatCard
              icon={FiLayers}
              label="Total Cards"
              value={totalCardsCount}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              delay={0.1}
            />
            <StatCard
              icon={FiStar}
              label="Saved"
              value={savedCount}
              color="bg-gradient-to-br from-amber-500 to-orange-500"
              delay={0.2}
            />
            <StatCard
              icon={FiBell}
              label="Due Today"
              value={dueCount}
              color="bg-gradient-to-br from-rose-500 to-pink-500"
              delay={0.3}
            />
            <StatCard
              icon={FiFolder}
              label="Collections"
              value={collectionsCount}
              color="bg-gradient-to-br from-emerald-500 to-teal-500"
              delay={0.4}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
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
      </header>

      {/* Search and Filters Bar */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-[98%] mx-auto px-6 py-4">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search cards..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FiX className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-2">
                <FiFilter className="inline-block h-4 w-4 mr-1" />
                Filters:
              </span>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    aria-pressed={isActive}
                  >
                    <IconComponent className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
              {filtersActive && (
                <button
                  onClick={() => setFilters({ reminderDue: false, hasNotes: false })}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-24 left-1/2 z-50"
          >
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl ${feedback.type === "error"
                ? "bg-red-500 text-white"
                : feedback.type === "info"
                  ? "bg-blue-500 text-white"
                  : "bg-emerald-500 text-white"
                }`}
            >
              {feedback.type === "success" && <FiCheckCircle className="h-5 w-5" />}
              {feedback.type === "error" && <FiX className="h-5 w-5" />}
              {feedback.type === "info" && <FiBookmark className="h-5 w-5" />}
              <span className="font-medium">{feedback.message}</span>
              <button
                className="ml-2 p-1 rounded-lg hover:bg-white/20 transition-colors"
                onClick={() => setFeedback(null)}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-[98%] mx-auto px-6 py-10">

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden"
              >
                <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-t-2xl" />
                <div className="h-48 bg-gray-100 animate-pulse" />
                <div className="h-24 bg-gray-50 animate-pulse rounded-b-2xl" />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6">
            <AnimatePresence>
              {filteredCards.map((item, index) => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="mb-6 break-inside-avoid"
                >
                  <div className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300">
                    {/* Gradient accent line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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

        {/* Empty State */}
        {filteredCards.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-2xl opacity-50" />
              <div className="relative text-8xl mb-6">
                {hasSearch || filtersActive ? "🔍" : "📚"}
              </div>
            </div>
            {hasSearch || filtersActive ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Try adjusting your search or clearing the filters to discover more knowledge cards.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({ reminderDue: false, hasNotes: false });
                  }}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No items in this category</h3>
                <p className="text-gray-500">Try selecting a different category above to explore more content.</p>
              </>
            )}
          </motion.div>
        )}
      </main>

      {/* Premium Footer */}
      <footer className="relative mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent" />
        <div className="relative max-w-[98%] mx-auto px-6 py-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <FiZap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Knowledge Hub</p>
                <p className="text-sm text-gray-500">Updated daily with fresh content</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4" />
                {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <FiLayers className="h-4 w-4" />
                {totalCardsCount} cards
              </span>
              <span className="flex items-center gap-2">
                <FiStar className="h-4 w-4" />
                {savedCount} saved
              </span>
            </div>
          </div>
        </div>
      </footer>

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
