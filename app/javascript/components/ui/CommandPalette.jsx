import React, { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";

const CommandPalette = ({
  open,
  onClose,
  onSelect,
  query,
  onQueryChange,
  results = [],
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const groupedResults = useMemo(() => {
    const groups = new Map();

    results.forEach((item) => {
      if (!item || !item.to) return;
      const section = item.section || "Navigation";
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section).push(item);
    });

    return Array.from(groups.entries()).map(([section, items]) => ({
      section,
      items,
    }));
  }, [results]);

  const handleResultClick = (item) => {
    onSelect?.(item);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 py-6 sm:py-20"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close command palette"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/95 dark:ring-white/5"
          >
            <div className="flex items-center gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/60 dark:text-zinc-400">
              <FiSearch className="h-4 w-4" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => onQueryChange?.(event.target.value)}
                placeholder="Search pages, projects, and actions..."
                className="w-full border-none bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <div className="max-h-80 overflow-y-auto">
              {groupedResults.length > 0 ? (
                groupedResults.map(({ section, items }) => (
                  <div key={section} className="py-3">
                    <p className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {section}
                    </p>
                    <div className="space-y-1 px-2">
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.id || item.to}
                            to={item.to}
                            onClick={() => handleResultClick(item)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {Icon && <Icon className="h-4 w-4 text-blue-500" />}
                            <div>
                              <p className="font-medium">{item.label}</p>
                              {item.description && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {query ? `No matches found for "${query}".` : "Start typing to search."}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
