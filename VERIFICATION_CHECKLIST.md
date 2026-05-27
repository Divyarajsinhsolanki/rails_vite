# Performance Optimization - Verification Checklist

## Pre-Deployment Testing

### Frontend Build
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes successfully
- [ ] Check bundle size output (should show reduced chunks)
- [ ] Run `vite-plugin-visualizer` (if installed) to verify chunk splits

### Backend Setup
- [ ] `bundle install` completes
- [ ] Django/Rails server starts without errors
- [ ] No deprecation warnings in console

### Development Testing (Local)
- [ ] App loads without console errors
- [ ] Navigation between pages works smoothly
- [ ] Single loading spinner appears (not duplicate)
- [ ] Posts page loads with pagination
- [ ] Calendar page loads without hanging

### Feature Testing
- [ ] Posts feed displays (check pagination working)
- [ ] Create/edit/delete post works
- [ ] Like/unlike post works
- [ ] Comments display and create work
- [ ] Calendar navigation smooth
- [ ] Project list loads
- [ ] Metaverse page loads (check Network tab for three.js chunk)
- [ ] PDF page works (check Network tab for pdf chunk)
- [ ] Drag-and-drop boards work (SprintOverview)
- [ ] Charts display correctly (WorkLog)

### Performance Validation

#### Network Tab (DevTools)
- [ ] Check "XHR/Fetch" tab:
  - Initial API calls use pagination (`?page=1&per_page=20`)
  - API responses are compressed (Content-Encoding: gzip)
  - Response times < 500ms for most requests
  - No duplicate requests for same data

- [ ] Check "Response" headers:
  - `Content-Encoding: gzip` present
  - JSON responses are compressed

#### Console (DevTools)
- [ ] No JavaScript errors
- [ ] No "Cannot find module" errors for lazy-loaded libs
- [ ] No Bullet N+1 warnings (in development only)
- [ ] No React warnings about missing dependencies

#### Performance Tab (Lighthouse)
- [ ] Run Lighthouse audit
- [ ] FCP < 1.5s (down from 3-4s)
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Total Blocking Time < 300ms

#### Rails Logs (Development)
- [ ] Run: `tail -f log/development.log`
- [ ] Check for Bullet warnings (should be none if includes: are used)
- [ ] Check API response times (should be < 500ms)

### File Integrity Checks
- [ ] App.jsx compiles without errors
- [ ] PostPage.jsx compiles without errors
- [ ] WorkLog.jsx compiles without errors
- [ ] PostsController works correctly
- [ ] vite.config.mts parses correctly

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error tracking (Sentry/Rollbar if configured)
- [ ] Check production logs for N+1 warnings with Bullet
- [ ] Monitor API response times in APM tool
- [ ] Check user session metrics for bounce rate

### First Week
- [ ] Gather performance metrics from real users
- [ ] Compare before/after in analytics
- [ ] Monitor for any regressions in features
- [ ] Check chart rendering in production

### Ongoing
- [ ] Set up alerts for slow API endpoints (> 1s)
- [ ] Set up alerts for large bundle chunks (> 500KB)
- [ ] Weekly review of Bullet warnings in logs
- [ ] Monitor page load times in analytics

---

## Rollback Plan (if needed)

**If you encounter issues:**

1. **Git Rollback (if not yet deployed):**
   ```bash
   git log --oneline  # Find the commit before optimization
   git revert <commit-hash>
   ```

2. **Gradual Rollback (by file):**
   - Revert vite.config.mts first (most impactful to reverse)
   - Keep App.jsx changes (safer)
   - Keep PostPage.jsx changes (optional)

3. **Database Changes (if needed):**
   ```bash
   # If Bullet warnings appear, add more aggressive includes:
   # Edit PostsController index: Post.includes(:user, :image_attachment, :post_likes, comments: [:user])
   ```

---

## Expected Results

### Load Time Improvements
- **Before:** 3-4s FCP
- **After:** 1-1.5s FCP  
- **Improvement:** 60-70% faster

### Bundle Size Improvements
- **Before:** 2.5-3.5MB uncompressed
- **After:** ~600-800KB gzipped
- **Improvement:** 70-80% smaller

### API Performance
- **Before:** 500-800ms with full dataset
- **After:** 200-400ms with pagination
- **Improvement:** 50% faster

### User Experience
- **Before:** Multiple loading spinners, feels slow
- **After:** Single smooth spinner, instant feel

---

## Metrics to Track

### Quantitative
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)  
- [ ] Cumulative Layout Shift (CLS)
- [ ] Time to Interactive (TTI)
- [ ] Total Blocking Time (TBT)
- [ ] API response times
- [ ] Bundle sizes (per chunk)
- [ ] JavaScript payload (gzipped)

### Qualitative
- [ ] User feedback on speed improvement
- [ ] Support tickets related to performance
- [ ] Time-to-upgrade metrics
- [ ] Feature adoption rates (especially paginated endpoints)

---

## Notes

- All changes are **non-breaking** - existing API clients will work
- Pagination is marked with `?page=1` - existing code without params gets page 1
- Lazy loading is transparent - features work the same, just load slower if used
- Gzip compression may require load balancer config (check LB doesn't decompress)

---

## Questions During Testing?

1. **Bundle won't build:** Check vite.config.mts syntax
2. **APIs timing out:** Check network throttling, may need pagination tuning
3. **Features seem slower:** Check that you're not loading everything at once
4. **Bullet warnings appear:** Add more `.includes()` to eager-load relations
5. **Charts not displaying:** Verify recharts import works (`npm ls recharts`)
