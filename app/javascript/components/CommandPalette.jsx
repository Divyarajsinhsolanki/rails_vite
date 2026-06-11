import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCommand, FiSearch, FiX } from "react-icons/fi";
import { searchWorkspace } from "./api";

const typeLabels = {
  project: "Project",
  task: "Task",
  issue: "Issue",
  user: "Person",
  post: "Update",
  knowledge: "Knowledge",
};

const CommandPalette = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const openPalette = () => setOpen(true);
    const handleKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("nexus:open-search", openPalette);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("nexus:open-search", openPalette);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchWorkspace(query.trim())
        .then(({ data }) => {
          if (!active) return;
          setResults(data.results || []);
          setActiveIndex(0);
        })
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false));
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const grouped = useMemo(
    () => results.reduce((acc, result) => ({ ...acc, [result.type]: [...(acc[result.type] || []), result] }), {}),
    [results]
  );

  const openResult = (result) => {
    if (!result) return;
    setOpen(false);
    setQuery("");
    navigate(result.path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/50 px-4 pt-[10vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Search workspace">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5">
          <FiSearch className="text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                openResult(results[activeIndex]);
              }
            }}
            placeholder="Search projects, tasks, issues, people, updates, and knowledge..."
            className="h-16 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400"
            aria-label="Search workspace"
          />
          <button onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close search">
            <FiX />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {loading ? <p className="p-5 text-center text-sm text-slate-500">Searching workspace...</p> : null}
          {!loading && query.trim().length < 2 ? (
            <div className="p-8 text-center text-slate-500">
              <FiCommand className="mx-auto mb-3 text-2xl" />
              Type at least two characters. Use arrow keys and Enter to open a result.
            </div>
          ) : null}
          {!loading && query.trim().length >= 2 && results.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No matching workspace records.</p>
          ) : null}
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type} className="mb-3">
              <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{typeLabels[type] || type}</p>
              {items.map((result) => {
                const index = results.indexOf(result);
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openResult(result)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left ${activeIndex === index ? "bg-slate-950 text-white" : "text-slate-800 hover:bg-slate-100"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{result.title}</span>
                      {result.subtitle ? <span className={`mt-1 block truncate text-sm ${activeIndex === index ? "text-slate-300" : "text-slate-500"}`}>{result.subtitle}</span> : null}
                    </span>
                    <span className={`shrink-0 text-xs ${activeIndex === index ? "text-cyan-200" : "text-slate-400"}`}>Open</span>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
