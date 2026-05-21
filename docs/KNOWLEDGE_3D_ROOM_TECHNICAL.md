# Knowledge 3D Room - Technical Documentation

## Architecture Overview

### Component Structure

```
KnowledgeDashboard (Provider wrapper)
  └─ KnowledgeDashboardContent (Main logic)
      └─ Knowledge3DRoom (3D visualization)
          ├─ Floating UI
          ├─ 3D Scene
          │   ├─ Front Wall
          │   ├─ Left Wall
          │   ├─ Right Wall
          │   ├─ Back Wall
          │   ├─ Ceiling
          │   └─ Floor
          ├─ Room Controls
          ├─ Card Modals
          └─ Feedback Toast
```

## Key Components

### Knowledge3DRoom.jsx
**Main 3D visualization component**

**Props:**
```typescript
{
  filteredCards: Array,           // Cards to display
  categories: Array,              // Category options
  activeCategory: String,         // Current category
  setActiveCategory: Function,    // Category setter
  searchQuery: String,            // Search text
  setSearchQuery: Function,       // Search setter
  filters: Object,                // Active filters
  setFilters: Function,           // Filters setter
  isLoading: Boolean,             // Loading state
  savedCount: Number,             // Saved bookmarks count
  dueCount: Number,               // Due items count
  filteredCardsLength: Number,    // Current visible cards
  bookmarkHelpers: Object,        // Bookmark functions
  handleBookmarkToggle: Function, // Toggle bookmark
  SavedBookmarkFallback: Component, // Fallback component
  SavedBookmarkFooter: Component,   // Footer component
  feedback: Object,               // Toast message
  setFeedback: Function,          // Feedback setter
}
```

**Key Methods:**
- `rotateRoom(delta)` - Updates target rotation
- `handlePointerDown/Move/Up()` - Mouse drag handling
- `handleKeyDown()` - Keyboard navigation
- `renderCardOnWall()` - Renders single card

## 3D Mathematics

### CSS Perspective & Transforms

```css
/* Main scene setup */
.scene {
  perspective: 1200px;
}

/* 3D room with preserve-3d */
.room {
  transform-style: preserve-3d;
  transform: rotateX(${rotationX}deg) rotateY(${rotationY}deg);
}

/* Wall positioning */
.front {
  transform: translateZ(500px);
}

.back {
  transform: rotateY(180deg) translateZ(500px);
}

.left {
  transform: rotateY(-90deg) translateZ(500px);
}

.right {
  transform: rotateY(90deg) translateZ(500px);
}
```

### Rotation Math

```javascript
// Smooth animation loop
const animate = () => {
  target.x += (targetX - currentX) * 0.1;  // Easing
  target.y += (targetY - currentY) * 0.1;
  
  setRotation({ x: target.x, y: target.y });
  frameId = requestAnimationFrame(animate);
};

// Clamped rotation limits
x = clamp(x, -15, 25);  // Vertical tilt
y = normalizeY(y);       // Horizontal wrap
```

### Wall Detection

```javascript
const getCurrentWallName = ({ x, y }) => {
  if (x > 15) return "Ceiling";
  if (x < -10) return "Floor";

  const normalizedY = ((y % 360) + 360) % 360;
  if (normalizedY >= 45 && normalizedY < 135) return "Left Wall";
  if (normalizedY >= 225 && normalizedY < 315) return "Right Wall";
  return "Front Wall";
};
```

## Card Distribution Algorithm

```javascript
const cardsByWall = useMemo(() => {
  const walls = {
    front: [],
    left: [],
    right: [],
    back: [],
  };

  filteredCards.forEach((card, index) => {
    const wallIndex = index % 4;  // Round-robin distribution
    const wallKeys = Object.keys(walls);
    walls[wallKeys[wallIndex]].push({ ...card, wallIndex });
  });

  return walls;
}, [filteredCards]);
```

## Input Handling

### Mouse/Touch Events

```javascript
// Drag tracking
const dragRef = useRef({ active: false, x: 0, y: 0 });

handlePointerDown(event) {
  dragRef.current = { active: true, x: event.clientX, y: event.clientY };
  event.currentTarget.setPointerCapture(event.pointerId);
}

handlePointerMove(event) {
  if (!dragRef.active) return;
  
  const deltaX = event.clientX - dragRef.x;
  const deltaY = event.clientY - dragRef.y;
  
  rotateRoom({ 
    y: deltaX * 0.22,    // Horizontal sensitivity
    x: deltaY * 0.16     // Vertical sensitivity
  });
}
```

### Keyboard Controls

```javascript
const keyActions = {
  ArrowLeft: { y: -14 },
  ArrowRight: { y: 14 },
  ArrowUp: { x: -6 },
  ArrowDown: { x: 6 },
  Escape: () => {
    setExpandedCardId(null);
    setShowFilters(false);
    setShowCategories(false);
  },
};
```

## State Management

### KnowledgeDashboardContent State

```javascript
const [activeCategory, setActiveCategory] = useState("all");
const [uiLoading, setUiLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState("");
const [filters, setFilters] = useState({ 
  reminderDue: false, 
  hasNotes: false 
});
const [feedback, setFeedback] = useState(null);
const [expandedCardId, setExpandedCardId] = useState(null);
const [showFilters, setShowFilters] = useState(false);
const [showCategories, setShowCategories] = useState(false);
```

### Ref Usage

```javascript
const roomRef = useRef(null);                          // Room container
const targetRotationRef = useRef({ x: 8, y: 0 });    // Target rotation
const currentRotationRef = useRef({ x: 8, y: 0 });   // Current rotation
const dragRef = useRef({ active: false, x: 0, y: 0 }); // Drag state
```

## Data Flow

### Filter & Search Pipeline

```
User Input (search/filter)
  ↓
filteredCards useMemo
  ├─ Filter by category
  ├─ Search by title/summary
  ├─ Filter by reminder due
  ├─ Filter by has notes
  └─ Return filtered array
  ↓
cardsByWall useMemo (depends on filteredCards)
  ├─ Distribute cards round-robin
  └─ Return cards per wall
  ↓
Knowledge3DRoom renders
  ├─ Front wall cards
  ├─ Left wall cards
  ├─ Right wall cards
  └─ Back wall cards
```

### Bookmark Flow

```
User clicks card
  ↓
setExpandedCardId(cardId)
  ↓
Expanded modal renders
  ├─ View expanded content
  ├─ Can mark reviewed
  └─ Can remove bookmark
  ↓
User clicks action
  ├─ handleBookmarkToggle (save)
  ├─ bookmarkHelpers.markReviewed (mark done)
  └─ handleBookmarkToggle (remove)
  ↓
API call
  ↓
setFeedback (success/error)
```

## Performance Considerations

### Optimization Strategies

1. **CSS Transforms Only**
   - Uses GPU acceleration
   - `transform: translateZ()` and `rotateX/Y()`
   - No layout recalculations

2. **requestAnimationFrame Loop**
   - 60 FPS smooth rotation
   - Easing function for natural motion
   - Cleanup on unmount

3. **useMemo Dependencies**
   - cardsByWall depends only on filteredCards
   - Prevents unnecessary redistribution
   - filteredCards includes expensive filters

4. **Lazy Modal Rendering**
   - Only expanded cards render full content
   - Other cards show preview only
   - Modal unmounts when closed

### Potential Improvements

```javascript
// Future optimization opportunities:
// 1. Virtualization for many cards (1000+)
// 2. Web Worker for filter calculations
// 3. Canvas rendering for extreme card counts
// 4. Intersection Observer for lazy rendering
// 5. Debounce rotation updates on mobile
```

## CSS Architecture

### Module Structure

```
Knowledge3DRoom.module.css
├─ .roomSection (container)
├─ .floatingUI (overlay UI)
│  ├─ .infoPanel
│  ├─ .statsPanel
│  ├─ .searchPanel
│  ├─ .filterTogglePanel
│  └─ .categoryTogglePanel
├─ .stage (viewport)
├─ .scene (3D context)
├─ .room (transform container)
├─ .wall (base wall styles)
│  ├─ .front
│  ├─ .back
│  ├─ .left
│  ├─ .right
│  ├─ .ceiling
│  └─ .floor
├─ .cardContainer
├─ .controls
├─ .modalLayer
└─ .expandedCard
```

### Responsive Design

```css
@media (max-width: 768px) {
  .room {
    width: 100vw;
    height: 100vh;
  }
  
  .cardContainer {
    width: 45%;
    min-height: 160px;
  }
  
  /* Adjust UI panels for mobile */
}
```

## Browser API Usage

### Pointer Events API
- Multi-touch support
- Drag tracking
- Capture/release handling

### requestAnimationFrame
- Smooth 60 FPS animation
- Browser optimization
- Battery efficiency

### useContext
- Global bookmark state
- Shared across components

## Future Enhancement Ideas

1. **Wall Themes**
   - Different gradient backgrounds per wall
   - Category-based wall designs

2. **Card Animations**
   - Entrance animations
   - Hover particle effects
   - Exit animations

3. **Multiplayer**
   - Shared room views
   - Collaborative bookmarks

4. **Advanced Navigation**
   - Teleport to specific walls
   - 3D map overlay
   - Bookmarks as floating items

5. **VR Support**
   - WebXR API integration
   - Immersive headset support
   - Hand gesture controls

6. **Accessibility**
   - Screen reader improvements
   - Voice navigation
   - High contrast themes

## Testing Considerations

### Unit Tests
```javascript
// Test rotation math
test('clamp function', () => {
  expect(clamp(25, -15, 20)).toBe(20);
});

// Test wall detection
test('getCurrentWallName', () => {
  expect(getCurrentWallName({ x: 8, y: 45 })).toBe('Left Wall');
});

// Test card distribution
test('cardsByWall distribution', () => {
  expect(walls.front.length).toBeLessThanOrEqual(
    walls.back.length + 1
  );
});
```

### Integration Tests
```javascript
// Test room rotation
test('room rotates on drag', () => {
  // Simulate pointer events
  // Check if rotation updated
});

// Test filter application
test('search filters cards', () => {
  // Update search query
  // Verify filtered results
});
```

## Deployment Notes

1. **Bundle Size**
   - Knowledge3DRoom adds ~15KB (gzipped)
   - CSS module adds ~5KB
   - Framer Motion already included

2. **Browser Support**
   - Uses standard CSS 3D Transforms
   - Pointer Events for touch
   - Arrow key handling

3. **Performance**
   - Monitor rotation loop FPS
   - Watch for memory leaks in animation frame
   - Check card render counts

---

**Last Updated**: 2026-05-19
**Version**: 1.0.0
**Status**: Production Ready
