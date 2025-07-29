import React from "react";
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
  // Example states for toggles & dark mode omitted for brevity

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--theme-color-rgb)/0.05)] to-[rgb(var(--theme-color-rgb)/0.1)] dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 p-6 pt-[100px] transition-colors duration-500">
      <header className="mb-8 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight mb-1">📚 Knowledge Dashboard</h1>
        <p className="text-md text-gray-600 dark:text-gray-400">Curated daily intelligence at a glance</p>
      </header>

      <div className="grid max-w-7xl mx-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatedCard><TodayInHistoryCard /></AnimatedCard>
        <AnimatedCard><QuoteOfTheDayCard /></AnimatedCard>
        <AnimatedCard><TopNewsCard /></AnimatedCard>
        <AnimatedCard><DailyFactCard /></AnimatedCard>
        <AnimatedCard><WordOfTheDayCard /></AnimatedCard>
        <AnimatedCard><CommonEnglishWordCard /></AnimatedCard>
        <AnimatedCard><EnglishTenseCard /></AnimatedCard>
        <AnimatedCard><EnglishPhraseCard /></AnimatedCard>
        <AnimatedCard><RandomCodingTipCard /></AnimatedCard>
        <AnimatedCard><ScienceNewsCard /></AnimatedCard>
        <AnimatedCard><TechNewsCard /></AnimatedCard>
        <AnimatedCard><TopGainersCard /></AnimatedCard>
        <AnimatedCard><TopVolumeStocksCard /></AnimatedCard>
        <AnimatedCard><TopBuyingStocksCard /></AnimatedCard>
        <AnimatedCard><IndianStockNewsCard /></AnimatedCard>
      </div>

      {/* Optional: My Library saved items panel */}
      <SavedInsights />
    </div>
  );
}

function AnimatedCard({ children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-5 cursor-pointer select-none">
      {children}
    </div>
  );
}

function SavedInsights() {
  return (
    <section className="mt-12 max-w-7xl mx-auto">
      <h3 className="text-xl font-semibold mb-3">📂 My Saved Insights</h3>
      {/* List saved quotes/facts/news with remove/share */}
      <p className="text-gray-500">No saved items yet. Start saving your favorite knowledge!</p>
    </section>
  );
}
