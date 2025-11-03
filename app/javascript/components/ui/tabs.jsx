import React, { createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";

const TabsContext = createContext(null);

const sanitizeValue = (value) => String(value).replace(/\s+/g, "-");

export const Tabs = ({
  children,
  className = "",
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "horizontal",
}) => {
  const baseId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = typeof controlledValue !== "undefined";
  const activeValue = isControlled ? controlledValue : uncontrolledValue;

  const triggersRef = useRef([]);

  const setValue = useCallback(
    (nextValue) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      if (onValueChange) {
        onValueChange(nextValue);
      }
    },
    [isControlled, onValueChange]
  );

  const registerTrigger = useCallback((value, node, id) => {
    triggersRef.current = [
      ...triggersRef.current.filter((entry) => entry.value !== value),
      { value, node, id },
    ];
  }, []);

  const unregisterTrigger = useCallback((value) => {
    triggersRef.current = triggersRef.current.filter((entry) => entry.value !== value);
  }, []);

  const focusRelative = useCallback(
    (currentValue, offset) => {
      const items = triggersRef.current;
      if (items.length === 0) return;

      const currentIndex = items.findIndex((item) => item.value === currentValue);
      const startingIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (startingIndex + offset + items.length) % items.length;
      const target = items[nextIndex];

      if (target) {
        setValue(target.value);
        target.node?.focus();
      }
    },
    [setValue]
  );

  const focusFirst = useCallback(() => {
    const [first] = triggersRef.current;
    if (first) {
      setValue(first.value);
      first.node?.focus();
    }
  }, [setValue]);

  const focusLast = useCallback(() => {
    const items = triggersRef.current;
    if (items.length > 0) {
      const last = items[items.length - 1];
      setValue(last.value);
      last.node?.focus();
    }
  }, [setValue]);

  const contextValue = useMemo(
    () => ({
      activeValue,
      baseId,
      orientation,
      setValue,
      registerTrigger,
      unregisterTrigger,
      focusRelative,
      focusFirst,
      focusLast,
    }),
    [activeValue, baseId, orientation, setValue, registerTrigger, unregisterTrigger, focusRelative, focusFirst, focusLast]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
};

export const TabsList = forwardRef(({ className = "", orientation: orientationOverride, ...props }, ref) => {
  const { orientation } = useTabsContext();
  const currentOrientation = orientationOverride || orientation;
  const orientationClass = currentOrientation === "vertical" ? "flex-col" : "flex-row";

  return (
    <div
      {...props}
      ref={ref}
      role="tablist"
      aria-orientation={currentOrientation}
      className={`flex ${orientationClass} ${className}`.trim()}
    />
  );
});

export const TabsTrigger = forwardRef(({ value, className = "", disabled = false, children, ...props }, ref) => {
  const { activeValue, baseId, setValue, registerTrigger, unregisterTrigger, focusRelative, focusFirst, focusLast } =
    useTabsContext();
  const internalRef = useRef(null);
  const mergedRef = useCallback(
    (node) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  const normalizedValue = sanitizeValue(value);
  const triggerId = `${baseId}-${normalizedValue}-trigger`;
  const contentId = `${baseId}-${normalizedValue}-content`;

  useEffect(() => {
    const node = internalRef.current;
    if (!node) return;
    registerTrigger(value, node, triggerId);
    return () => unregisterTrigger(value);
  }, [registerTrigger, unregisterTrigger, triggerId, value]);

  const isActive = value === activeValue;

  const handleKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusRelative(value, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusRelative(value, -1);
        break;
      case "Home":
        event.preventDefault();
        focusFirst();
        break;
      case "End":
        event.preventDefault();
        focusLast();
        break;
      default:
        break;
    }
  };

  return (
    <button
      {...props}
      ref={mergedRef}
      id={triggerId}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={contentId}
      tabIndex={isActive ? 0 : -1}
      data-state={isActive ? "active" : "inactive"}
      disabled={disabled}
      className={className}
      onClick={(event) => {
        if (disabled) return;
        setValue(value);
        if (props.onClick) {
          props.onClick(event);
        }
      }}
      onKeyDown={(event) => {
        handleKeyDown(event);
        if (props.onKeyDown) {
          props.onKeyDown(event);
        }
      }}
    >
      {children}
    </button>
  );
});

export const TabsContent = forwardRef(
  ({ value, className = "", children, forceMount = false, lazyMount = false, ...props }, ref) => {
    const { activeValue, baseId } = useTabsContext();
    const normalizedValue = sanitizeValue(value);
    const contentId = `${baseId}-${normalizedValue}-content`;
    const triggerId = `${baseId}-${normalizedValue}-trigger`;
    const isActive = value === activeValue;
    const [hasBeenActive, setHasBeenActive] = useState(isActive);

    useEffect(() => {
      if (isActive) {
        setHasBeenActive(true);
      }
    }, [isActive]);

    const shouldRenderChildren = forceMount || !lazyMount || isActive || hasBeenActive;

    return (
      <div
        {...props}
        ref={ref}
        role="tabpanel"
        id={contentId}
        aria-labelledby={triggerId}
        tabIndex={0}
        hidden={!isActive && !forceMount}
        className={`${className} ${!isActive && !forceMount ? "hidden" : ""}`.trim()}
      >
        {shouldRenderChildren ? children : null}
      </div>
    );
  }
);

export default Tabs;
