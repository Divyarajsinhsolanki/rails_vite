import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Knowledge3DRoom.module.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiX,
  FiBell,
  FiBook,
  FiCheckCircle,
  FiBookmark,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const MIN_ZOOM_OFFSET = -180;
const MAX_ZOOM_OFFSET = 900;
const INTERACTIVE_SELECTOR = "button, a, input, select, textarea, option, label, summary, [data-room-interactive]";

const getZoomTranslateZ = (zoomOffset) =>
  `calc(var(--room-camera-z) ${zoomOffset < 0 ? "-" : "+"} ${Math.abs(zoomOffset).toFixed(1)}px)`;

const isInteractiveTarget = (target) => target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

const getCurrentWallName = ({ x, y }) => {
  if (x > 15) return "Ceiling";
  if (x < -10) return "Floor";

  const normalizedY = ((y % 360) + 360) % 360;
  if (normalizedY >= 45 && normalizedY < 135) return "Right Wall";
  if (normalizedY >= 225 && normalizedY < 315) return "Left Wall";
  return "Front Wall";
};

export default function Knowledge3DRoom({
  filteredCards,
  categories,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  isLoading,
  savedCount,
  dueCount,
  filteredCardsLength,
  bookmarkHelpers,
  handleBookmarkToggle,
  SavedBookmarkFallback,
  SavedBookmarkFooter,
  feedback,
  setFeedback,
}) {
  const roomRef = useRef(null);
  const roomTransformRef = useRef(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const targetZoomRef = useRef(-80);
  const currentZoomRef = useRef(-80);
  const lastDisplayUpdateRef = useRef(0);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 }); // Start facing front wall
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const currentWallName = useMemo(() => getCurrentWallName(rotation), [rotation]);

  // Distribute cards across walls more evenly
  const cardsByWall = useMemo(() => {
    const walls = {
      front: [],
      left: [],
      right: [],
      back: [],
    };

    const cardsPerWall = Math.ceil(filteredCards.length / 4);
    
    filteredCards.forEach((card, index) => {
      const wallIndex = Math.floor(index / cardsPerWall);
      const wallKeys = ['front', 'left', 'right', 'back'];
      
      if (wallIndex < 4) {
        walls[wallKeys[wallIndex]].push({ 
          ...card, 
          wallPosition: index % cardsPerWall 
        });
      }
    });

    return walls;
  }, [filteredCards]);

  const rotateRoom = useCallback((delta) => {
    const target = targetRotationRef.current;
    target.y += delta.y || 0;
    target.x = clamp(target.x + (delta.x || 0), -15, 25);
  }, []);

  // Animation loop
  useEffect(() => {
    let frameId;

    const animate = (timestamp = 0) => {
      const target = targetRotationRef.current;
      const current = currentRotationRef.current;
      const currentZoom = currentZoomRef.current;

      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
      currentZoomRef.current += (targetZoomRef.current - currentZoom) * 0.22;

      if (roomTransformRef.current) {
        roomTransformRef.current.style.transform = `translate(-50%, -50%) translateZ(${getZoomTranslateZ(currentZoomRef.current)}) rotateX(${current.x}deg) rotateY(${current.y}deg)`;
      }

      if (timestamp - lastDisplayUpdateRef.current > 120) {
        lastDisplayUpdateRef.current = timestamp;
        setRotation({ x: current.x, y: current.y });
      }

      frameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handlePointerDown = (event) => {
    if (isInteractiveTarget(event.target)) return;

    roomRef.current?.focus({ preventScroll: true });
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };

    rotateRoom({ y: deltaX * -0.38, x: deltaY * 0.24 });
  };

  const stopDrag = (event) => {
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    roomRef.current?.focus({ preventScroll: true });

    const delta = clamp(event.deltaY * -0.68, -170, 170);
    targetZoomRef.current = clamp(targetZoomRef.current + delta, MIN_ZOOM_OFFSET, MAX_ZOOM_OFFSET);
  };

  const handleKeyDown = (event) => {
    const keyActions = {
      ArrowLeft: { y: 22 },
      ArrowRight: { y: -22 },
      ArrowUp: { x: -9 },
      ArrowDown: { x: 9 },
      Escape: () => {
        setExpandedCardId(null);
        setShowFilters(false);
        setShowCategories(false);
      },
    };

    if (keyActions[event.key]) {
      event.preventDefault();
      if (typeof keyActions[event.key] === "function") {
        keyActions[event.key]();
      } else {
        rotateRoom(keyActions[event.key]);
      }
    }
  };

  // Render card positioned on wall
  const renderCardOnWall = (card, index, wallPosition) => (
    <motion.div
      key={card.key}
      className={styles.cardItem}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.02 }}
    >
      <motion.div
        className={styles.cardClickable}
        onClick={(event) => {
          if (isInteractiveTarget(event.target)) return;
          setExpandedCardId(card.key);
        }}
        whileHover={{ scale: 1.05 }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (isInteractiveTarget(e.target)) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpandedCardId(card.key);
          }
        }}
      >
        <div className="group relative overflow-hidden rounded-[16px] border border-white/70 bg-white/80 shadow-[0_12px_32px_rgb(15_23_42_/_0.1)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_20px_48px_rgb(15_23_42_/_0.2)] h-full flex flex-col">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_50%)] opacity-60" />

          <div className="relative p-3 h-full flex flex-col overflow-hidden">
            {card.Component ? (
              <div className="flex-1 overflow-hidden">
                <card.Component {...card.props} />
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex-1">
                <p className="font-semibold line-clamp-2">{card.metadata?.title || "Card"}</p>
                <p className="text-[10px] mt-1 line-clamp-1">{card.metadata?.summary}</p>
              </div>
            )}

            {/* Quick action buttons */}
            <div className="mt-auto pt-2 border-t border-white/50 flex gap-1 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCardId(card.key);
                }}
                className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px] font-semibold transition-all"
                title="Click to expand"
              >
                ⬈
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const filterOptions = [
    { key: "reminderDue", label: "Due", icon: FiBell },
    { key: "hasNotes", label: "Notes", icon: FiBook },
  ];

  return (
    <div className={styles.roomShell}>
      {/* 3D Room Container */}
      <section
        ref={roomRef}
        className={styles.roomSection}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-labelledby="knowledge-room-title"
      >
        {/* Floating UI Panels */}
        <div className={styles.floatingUI}>
          {/* Top Right - Current Wall & Stats */}
          <div className={styles.statsPanel}>
            <div className={styles.wallBadge}>{currentWallName}</div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm">
                📊 {filteredCardsLength} cards
              </div>
              <div className="text-xs font-semibold text-slate-600 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm">
                ⭐ {savedCount} saved
              </div>
              <div className="text-xs font-semibold text-slate-600 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm">
                🔔 {dueCount} due
              </div>
            </div>
          </div>

          {/* Bottom Left - Search Bar */}
          <div className={styles.searchPanel}>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search cards..."
                className="w-full rounded-[16px] border border-white/70 bg-white/80 py-2.5 pl-10 pr-10 text-xs text-slate-700 outline-none ring-0 transition focus:border-sky-200 focus:bg-white focus:shadow-lg"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <FiX className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Bottom Middle - Filter Toggle */}
          <div className={styles.filterTogglePanel}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-[14px] border px-3 py-2 text-xs font-semibold transition ${
                showFilters || Object.values(filters).some(Boolean)
                  ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                  : "border-white/70 bg-white/72 text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
            >
              <FiBell className="h-3.5 w-3.5" />
              Filters
              {showFilters ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
            </button>

            {/* Filter Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full mb-2 left-0 bg-white/90 backdrop-blur-xl border border-white/70 rounded-[16px] p-3 shadow-lg space-y-2 min-w-max"
                >
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
                        className={`flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-semibold transition w-full ${
                          isActive
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-white/70 bg-white/50 text-slate-600 hover:bg-white"
                        }`}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                        {option.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Right - Category Toggle */}
          <div className={styles.categoryTogglePanel}>
            <button
              type="button"
              onClick={() => setShowCategories(!showCategories)}
              className={`inline-flex items-center gap-1.5 rounded-[14px] border px-3 py-2 text-xs font-semibold transition ${
                showCategories
                  ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                  : "border-white/70 bg-white/72 text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
            >
              📂 Category
              {showCategories ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
            </button>

            {/* Category Dropdown */}
            <AnimatePresence>
              {showCategories && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full mb-2 right-0 bg-white/90 backdrop-blur-xl border border-white/70 rounded-[16px] p-2 shadow-lg space-y-1 max-w-xs max-h-64 overflow-y-auto"
                >
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setShowCategories(false);
                      }}
                      className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold transition w-full text-left ${
                        activeCategory === cat.id
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-white/70 bg-white/50 text-slate-600 hover:bg-white"
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3D Scene */}
        <div
          className={styles.stage}
          role="application"
          aria-label="Drag to rotate the 3D knowledge room. Use mouse wheel to zoom in and out."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onWheel={handleWheel}
        >
          <div className={styles.scene}>
            <div
              ref={roomTransformRef}
              className={styles.room}
              style={{
                transform: `translate(-50%, -50%) translateZ(${getZoomTranslateZ(currentZoomRef.current)}) rotateX(${currentRotationRef.current.x}deg) rotateY(${currentRotationRef.current.y}deg)`,
              }}
            >
              {/* Front Wall */}
              <div className={`${styles.wall} ${styles.front}`}>
                <div className={styles.wallIntroCard}>
                  <p className={styles.eyebrow}>🎨 Knowledge 3D Room</p>
                  <h1 id="knowledge-room-title" className={styles.title}>
                    Immersive Knowledge Experience
                  </h1>
                  <p className={styles.subtitle}>
                    Drag the room, use the mouse wheel to zoom, and click cards to expand.
                  </p>
                </div>
                {cardsByWall.front.map((card, idx) =>
                  renderCardOnWall(card, idx, "front")
                )}
              </div>

              {/* Left Wall */}
              <div className={`${styles.wall} ${styles.left}`}>
                {cardsByWall.left.map((card, idx) =>
                  renderCardOnWall(card, idx + 10, "left")
                )}
              </div>

              {/* Right Wall */}
              <div className={`${styles.wall} ${styles.right}`}>
                {cardsByWall.right.map((card, idx) =>
                  renderCardOnWall(card, idx + 20, "right")
                )}
              </div>

              {/* Back Wall */}
              <div className={`${styles.wall} ${styles.back}`}>
                {cardsByWall.back.map((card, idx) =>
                  renderCardOnWall(card, idx + 30, "back")
                )}
              </div>

              {/* Ceiling */}
              <div className={`${styles.wall} ${styles.ceiling}`} aria-hidden="true" />

              {/* Floor */}
              <div className={`${styles.wall} ${styles.floor}`} aria-hidden="true" />
            </div>
          </div>

          {/* Room Controls */}
          <div
            className={styles.controls}
            aria-label="Rotate room controls"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => rotateRoom({ x: -9 })}
              aria-label="Tilt room up"
            >
              ↑
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className={styles.controlButton}
                onClick={() => rotateRoom({ y: 22 })}
                aria-label="Rotate room left"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={() => rotateRoom({ x: 9 })}
                aria-label="Tilt room down"
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={() => rotateRoom({ y: -22 })}
                aria-label="Rotate room right"
              >
                →
              </button>
            </div>
          </div>

          {/* Expanded Card Modal */}
          <AnimatePresence>
            {expandedCardId && (
              <motion.div
                className={styles.modalLayer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedCardId(null)}
                onPointerDown={(event) => event.stopPropagation()}
                onWheel={(event) => event.stopPropagation()}
              >
                <motion.div
                  className={styles.expandedCard}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {filteredCards.map((card) => {
                    if (card.key === expandedCardId) {
                      return (
                        <div key={card.key} className={styles.expandedCardContent}>
                          <button
                            className={styles.closeButton}
                            onClick={() => setExpandedCardId(null)}
                            aria-label="Close expanded card"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                          <div className={styles.expandedCardBody}>
                            {card.Component ? (
                              <card.Component {...card.props} />
                            ) : (
                              <div>
                                <p className="text-lg font-semibold">
                                  {card.metadata?.title}
                                </p>
                                <p className="mt-4 text-sm text-slate-600">
                                  {card.metadata?.summary}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-auto border-t border-slate-200 pt-4 flex gap-3 justify-end">
                            {card.bookmark ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    bookmarkHelpers.markReviewed(card.bookmark);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                  <FiCheckCircle className="h-4 w-4" />
                                  Reviewed
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleBookmarkToggle({
                                      cardType: card.bookmark.card_type,
                                      sourceId: card.bookmark.source_id,
                                      payload: card.bookmark.payload,
                                    });
                                    setExpandedCardId(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-100 text-rose-600 text-sm font-semibold hover:bg-rose-200 transition-all"
                                >
                                  <FiX className="h-4 w-4" />
                                  Remove
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  handleBookmarkToggle({
                                    cardType: card.cardType,
                                    sourceId: card.key,
                                    collectionName: "",
                                    payload: card.metadata,
                                  });
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                              >
                                <FiBookmark className="h-4 w-4" />
                                Save to Collection
                              </button>
                            )}
                          </div>
                          
                          {card.bookmark && <SavedBookmarkFooter
                            bookmark={card.bookmark}
                            onRemove={() =>
                              handleBookmarkToggle({
                                cardType: card.bookmark.card_type,
                                sourceId: card.bookmark.source_id,
                                payload: card.bookmark.payload,
                              })
                            }
                            onMarkReviewed={() =>
                              bookmarkHelpers.markReviewed(card.bookmark)
                            }
                          />}
                        </div>
                      );
                    }
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback ? (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed left-1/2 top-6 z-50"
          >
            <div
              className={`flex items-center gap-3 rounded-[20px] border px-5 py-3 shadow-lg backdrop-blur-xl ${
                feedback.type === "error"
                  ? "border-rose-200 bg-rose-500/90 text-white"
                  : feedback.type === "info"
                    ? "border-sky-200 bg-sky-500/90 text-white"
                    : "border-emerald-200 bg-emerald-500/90 text-white"
              }`}
            >
              {feedback.type === "success" && <FiCheckCircle className="h-5 w-5" />}
              {feedback.type === "error" && <FiX className="h-5 w-5" />}
              {feedback.type === "info" && <FiBookmark className="h-5 w-5" />}
              <span className="font-medium text-sm">{feedback.message}</span>
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
    </div>
  );
}
