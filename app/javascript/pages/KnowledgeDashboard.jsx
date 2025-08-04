import React, { useState, useEffect } from "react";
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

export default function KnowledgeDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    { id: "all", name: "All", icon: "🌐" },
    { id: "news", name: "News", icon: "📰" },
    { id: "learning", name: "Learning", icon: "🎓" },
    { id: "stocks", name: "Stocks", icon: "📈" },
    { id: "tech", name: "Tech", icon: "💻" },
  ];

  const cards = [
    { component: <TodayInHistoryCard />, category: "learning" },
    { component: <QuoteOfTheDayCard />, category: "learning" },
    { component: <TopNewsCard />, category: "news" },
    { component: <DailyFactCard />, category: "learning" },
    { component: <WordOfTheDayCard />, category: "learning" },
    { component: <CommonEnglishWordCard />, category: "learning" },
    { component: <EnglishTenseCard />, category: "learning" },
    { component: <EnglishPhraseCard />, category: "learning" },
    { component: <RandomCodingTipCard />, category: "tech" },
    { component: <ScienceNewsCard />, category: "news" },
    { component: <TechNewsCard />, category: "tech" },
    { component: <TopGainersCard />, category: "stocks" },
    { component: <TopVolumeStocksCard />, category: "stocks" },
    { component: <TopBuyingStocksCard />, category: "stocks" },
    { component: <IndianStockNewsCard />, category: "stocks" },
  ];

  const filteredCards = activeCategory === "all" 
    ? cards 
    : cards.filter(card => card.category === activeCategory);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color-light)] bg-clip-text text-transparent">
              Knowledge Hub
            </h1>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[var(--theme-color)] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`h-64 rounded-2xl ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-200'
                } animate-pulse`}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredCards.map((item, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl overflow-hidden"
                >
                  <div className={`h-full border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } rounded-2xl shadow-sm hover:shadow-md transition-all duration-300`}>
                    {item.component}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredCards.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🧐</div>
            <h3 className="text-xl font-medium mb-2">No items in this category</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try selecting a different category above
            </p>
          </div>
        )}
      </main>

      <footer className={`mt-12 py-6 border-t ${
        darkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Knowledge Hub • Updated daily • {new Date().toLocaleDateString()}</p>
        </div>
      </footer>
      </div>
    </div>
  );
}