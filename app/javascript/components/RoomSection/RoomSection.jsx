import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./RoomSection.module.css";
import roomObjects from "./objects";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const walls = ["back", "left", "right"];

const getCurrentWallName = ({ x, y }) => {
  if (x > 15) return "Floor";

  const normalizedY = ((y % 360) + 360) % 360;
  if (normalizedY >= 45 && normalizedY < 150) return "Left wall";
  if (normalizedY >= 210 && normalizedY < 315) return "Right wall";
  return "Front wall";
};

export default function RoomSection() {
  const sectionRef = useRef(null);
  const closeButtonRef = useRef(null);
  const targetRotationRef = useRef({ x: 8, y: 0 });
  const currentRotationRef = useRef({ x: 8, y: 0 });
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 8, y: 0 });
  const [activeObject, setActiveObject] = useState(null);

  const objectsByWall = useMemo(
    () =>
      walls.reduce((accumulator, wall) => {
        accumulator[wall] = roomObjects.filter((object) => object.wall === wall);
        return accumulator;
      }, {}),
    []
  );

  const currentWallName = useMemo(() => getCurrentWallName(rotation), [rotation]);

  const rotateRoom = useCallback((delta) => {
    const target = targetRotationRef.current;
    target.y += delta.y || 0;
    target.x = clamp(target.x + (delta.x || 0), -8, 20);
  }, []);

  useEffect(() => {
    let frameId;

    const animate = () => {
      const target = targetRotationRef.current;
      const current = currentRotationRef.current;

      current.x += (target.x - current.x) * 0.1;
      current.y += (target.y - current.y) * 0.1;

      setRotation({ x: current.x, y: current.y });
      frameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (activeObject) closeButtonRef.current?.focus();
  }, [activeObject]);

  const handlePointerDown = (event) => {
    sectionRef.current?.focus({ preventScroll: true });
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };

    rotateRoom({ y: deltaX * 0.22, x: deltaY * 0.16 });
  };

  const stopDrag = (event) => {
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleKeyDown = (event) => {
    if (activeObject && event.key === "Escape") {
      setActiveObject(null);
      return;
    }

    const keyActions = {
      ArrowLeft: { y: -14 },
      ArrowRight: { y: 14 },
      ArrowUp: { x: -6 },
      ArrowDown: { x: 6 },
    };

    const action = keyActions[event.key];
    if (!action) return;

    event.preventDefault();
    rotateRoom(action);
  };

  const renderObject = (object) => (
    <button
      key={object.id}
      type="button"
      className={`${styles.objectButton} ${activeObject?.id === object.id ? styles.objectActive : ""}`}
      style={{
        top: object.top,
        left: object.left,
        width: object.width,
        height: object.height,
      }}
      aria-label={`Open ${object.label} details`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => setActiveObject(object)}
    >
      <span className={styles.tooltip}>{object.label}</span>
      <span className={styles.svgWrap} dangerouslySetInnerHTML={{ __html: object.svg }} />
    </button>
  );

  return (
    <section
      ref={sectionRef}
      className={styles.roomSection}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-labelledby="knowledge-room-title"
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Interactive Archive</p>
          <h2 id="knowledge-room-title" className={styles.title}>
            Explore Our Knowledge Space
          </h2>
          <p className={styles.subtitle}>Click on objects to discover resources, guides, and tools</p>
        </div>
        <div className={styles.wallBadge} aria-live="polite">
          {currentWallName}
        </div>
      </div>

      <div
        className={styles.stage}
        role="application"
        aria-label="Drag or use arrow keys to rotate the knowledge room"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div className={styles.scene}>
          <div
            className={styles.room}
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
          >
            <div className={`${styles.wall} ${styles.back}`}>{objectsByWall.back.map(renderObject)}</div>
            <div className={`${styles.wall} ${styles.left}`}>{objectsByWall.left.map(renderObject)}</div>
            <div className={`${styles.wall} ${styles.right}`}>{objectsByWall.right.map(renderObject)}</div>
            <div className={`${styles.wall} ${styles.floor}`} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.controls} aria-label="Rotate room controls" onPointerDown={(event) => event.stopPropagation()}>
          <span />
          <button type="button" className={styles.controlButton} onClick={() => rotateRoom({ x: -6 })} aria-label="Tilt room up">
            ^
          </button>
          <span />
          <button type="button" className={styles.controlButton} onClick={() => rotateRoom({ y: -14 })} aria-label="Rotate room left">
            &lt;
          </button>
          <button type="button" className={styles.controlButton} onClick={() => rotateRoom({ x: 6 })} aria-label="Tilt room down">
            v
          </button>
          <button type="button" className={styles.controlButton} onClick={() => rotateRoom({ y: 14 })} aria-label="Rotate room right">
            &gt;
          </button>
        </div>

        {activeObject ? (
          <div className={styles.modalLayer} onPointerDown={(event) => event.stopPropagation()}>
            <div
              className={styles.modalCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="knowledge-room-modal-title"
            >
              <p className={styles.modalLabel}>Knowledge Object</p>
              <h3 id="knowledge-room-modal-title" className={styles.modalTitle}>
                {activeObject.label}
              </h3>
              <p className={styles.modalDescription}>{activeObject.description}</p>
              {activeObject.href ? (
                <a className={styles.modalLink} href={activeObject.href}>
                  Open related article
                </a>
              ) : null}
              <div className={styles.modalActions}>
                <button ref={closeButtonRef} type="button" className={styles.closeButton} onClick={() => setActiveObject(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
