# Faith Dive - Bible Journaling PWA Design

**Date:** December 6, 2025
**Status:** Design Complete - Ready for Implementation

## Overview

Faith Dive is a Progressive Web App (PWA) for personal Bible study and journaling. Users can search Bible passages, write reflective journal entries, bookmark favorite verses, follow reading plans, and receive daily verse notifications. All user data is stored locally on their device for privacy and offline access.

## System Architecture

### Technology Stack
- **Backend:** FastAPI (Python) - serves static files and proxies Bible API requests
- **Frontend:** Vanilla HTML, CSS, and JavaScript - mobile-first PWA
- **Bible Data:** External Bible API (API.Bible or ESV API recommended)
- **Storage:** Browser LocalStorage for user data (journals, favorites, settings)
- **PWA Features:** Service Worker for offline support and push notifications

### Architecture Components

1. **FastAPI Backend**
   - Serves static PWA files (HTML, CSS, JS)
   - Proxies Bible API requests (avoids CORS, enables caching)
   - Implements rate limiting and caching (1-hour TTL)
   - Provides endpoints: `/api/search`, `/api/verse/{reference}`, `/api/translations`

2. **PWA Frontend**
   - Installable web application
   - Service worker for offline capabilities
   - Manages all user data client-side
   - No backend database required

3. **Bible API Integration**
   - API.Bible or ESV API as data source
   - Multiple translations support
   - User selects preferred translation (saved in settings)

4. **Service Worker**
   - Manages offline state
   - Caches app shell for instant loading
   - Handles push notifications for daily verses
   - Network-first strategy for Bible verses with cache fallback

### Data Flow
User searches → Frontend → FastAPI proxy → Bible API → Response cached → Display. Journal entries and favorites created/edited client-side, stored directly in LocalStorage.

## Core Features

### 1. Bible Search (Dual Mode)

#### Reference Lookup
- Three-tier dropdown interface:
  - Select Book (Genesis through Revelation)
  - Select Chapter (1...n based on book)
  - Select Verse range (optional, defaults to full chapter)
- "Load Passage" button fetches and displays verses
- Uses user's preferred translation from settings

#### Keyword Search
- Text input with search button
- Queries Bible API for matching verses
- Results show verse references with snippet previews
- Click result to view full passage
- Uses user's preferred translation

### 2. Journaling

#### Creating Journal Entries
When viewing a Bible passage:
- Prominent "Journal This Passage" button
- Opens journal entry form with:
  - Auto-populated verse reference (e.g., "John 3:16-17")
  - Full verse text (saved as plain text, not re-fetched)
  - Large textarea for user's reflection notes
  - Auto-captured timestamp
  - Save button

#### Journal Entry Data Structure
```json
{
  "id": "uuid",
  "reference": "John 3:16-17",
  "verseText": "For God so loved...",
  "notes": "User's reflection...",
  "timestamp": "2025-12-06T10:30:00Z",
  "book": "John"
}
```

#### Viewing Journal Entries
Two organization modes (toggle between them):

**By Bible Book:**
- Collapsible sections grouped by book (Genesis, Exodus, etc.)
- Shows entry count per book
- Click to expand and view all entries from that book

**By Date:**
- Sections: "This Week", "This Month", "Earlier"
- Chronological within each section

**Entry Card Design:**
- Verse reference (header)
- Timestamp (subtle, secondary text)
- Verse text (indented, serif font)
- User notes below
- Edit and delete icons

#### Managing Entries
- Full edit capability: modify notes, even verse reference if needed
- Delete entries with confirmation prompt
- Swipe-to-delete gesture on mobile

### 3. Favorites

#### Adding Favorites
- "★ Add to Favorites" button on any displayed passage
- Saves verse reference and translation
- Simple bookmark list (no additional notes)

#### Favorites Data Structure
```json
{
  "id": "uuid",
  "reference": "Psalm 23:1",
  "translation": "ESV"
}
```

#### Viewing Favorites
- Clean list of bookmarked verse references
- Click any favorite to load that passage
- Swipe-to-delete or delete icon for removal
- Edit to change reference if needed

## Additional Features

### 1. Daily Verse Notifications

**Implementation:**
- Uses PWA Push API via service worker
- Backend generates daily verse from curated list (~365 popular verses)
- Service worker triggers notification at user's chosen time

**Settings:**
- Enable/disable toggle
- Time picker (default 8:00 AM)
- Saved to LocalStorage

**Notification:**
- Shows verse reference + first 50 characters
- Action buttons: "Journal This" and "Dismiss"
- Tapping opens app to that verse with journaling option

**Future Enhancement:** More sophisticated random verse selection, ability to choose notification verse categories.

### 2. Dark Mode

**Implementation:**
- CSS custom properties (variables) for theming
- Toggle in settings, preference saved to LocalStorage
- Smooth transitions between themes (0.3s ease)

**Light Theme:**
- Backgrounds: Cream/parchment (#F5F5DC, #FFF8E7)
- Text: Rich brown (#3E2723, #4E342E)
- Accents: Gold (#D4AF37)

**Dark Theme:**
- Backgrounds: Dark brown/charcoal (#2C2416, #1A1410)
- Text: Cream (#F5F5DC)
- Accents: Muted gold (#B8932F)

### 3. Reading Plans

**Initial Plans (Pre-built):**
1. "Gospels in 30 Days" - Daily reading through Matthew, Mark, Luke, John
2. "Psalms & Proverbs Monthly" - One Psalm + one Proverbs chapter daily

**Data Structure:**
```json
{
  "planId": "gospels-30",
  "name": "Gospels in 30 Days",
  "description": "Read through all four Gospels",
  "readings": [
    {"day": 1, "reference": "Matthew 1-2"},
    {"day": 2, "reference": "Matthew 3-4"},
    ...
  ]
}
```

**User Progress Tracking:**
- Stored in LocalStorage
- Checkmarks for completed days
- Today's reading highlighted
- Progress bar showing completion percentage

**UI:**
- List of available plans
- Active plan shows daily reading with check-off capability
- Can switch between plans
- Reset progress option

## Data Storage and Management

### LocalStorage Structure

**Keys:**
- `faithdive_settings` - User preferences
- `faithdive_journals` - Array of journal entry objects
- `faithdive_favorites` - Array of favorite verse objects
- `faithdive_reading_progress` - Reading plan completion data

**Settings Object:**
```json
{
  "translation": "ESV",
  "theme": "light",
  "notifications": {
    "enabled": true,
    "time": "08:00"
  },
  "viewMode": "byBook"
}
```

### Export/Import Functionality

**Export:**
- "Export My Data" button in settings
- Downloads `faithdive-backup-YYYY-MM-DD.json`
- Contains all journals, favorites, settings, and reading progress
- JSON format for readability and portability

**Import:**
- "Import Data" button accepts JSON file
- Validates structure before importing
- Two options:
  - **Merge:** Keep existing data + add imported data (duplicate detection by ID)
  - **Replace:** Overwrite all data with imported data
- Confirmation dialog showing what will change
- Creates automatic backup before import

**Data Validation:**
- Check JSON structure matches expected schema
- Validate date formats, references, required fields
- Show clear error messages if validation fails

## UI/UX Design

### Visual Design - Warm & Traditional

**Typography:**
- Verse text: Serif fonts (Georgia or Merriweather web font)
- UI elements: Sans-serif (Open Sans or system default)
- Hierarchy: Clear distinction between headers, body, and metadata

**Color Palette:**
See Dark Mode section above for complete palette.

**Layout Style:**
- Book-like aesthetic with generous margins
- Subtle parchment/paper texture background
- Card-based content with soft rounded corners (8px)
- Soft shadows for depth (not harsh Material Design shadows)
- Gold accent lines and dividers

### Navigation Structure

**Bottom Navigation Bar (Mobile):**
1. **Search** (🔍) - Default view, Bible search interface
2. **Journal** (📖) - View organized journal entries
3. **Favorites** (⭐) - List of bookmarked verses
4. **More** (⋯) - Settings, reading plans, export/import, about

**Desktop/Tablet:**
- Side navigation panel (collapsible)
- Content area expands to two-column where appropriate
- Preserve touch targets for hybrid devices

### Mobile-First Patterns

**Touch Optimization:**
- Minimum touch target: 44×44px
- Thumb-friendly bottom navigation
- Swipe gestures for common actions (swipe card for edit/delete)
- Pull-to-refresh on lists
- Large, clear buttons

**Progressive Enhancement:**
- Single-column layouts on mobile
- Two-column on tablets (e.g., list + detail view)
- Three-column on desktop (navigation + list + detail)

**Sticky Elements:**
- Sticky headers when scrolling organized views
- Sticky search bar on search tab
- Bottom navigation always visible

## Error Handling and Edge Cases

### Bible API Errors

**Rate Limiting:**
- FastAPI caches frequently requested verses (1-hour TTL)
- If API rate limit hit: "Taking a short break. Try again in a moment."
- Cached verses remain accessible
- Automatic retry with exponential backoff

**Invalid References:**
- Client-side validation before API call
- Check book exists, chapter exists, verse exists
- Helpful error: "John only has 21 chapters. Did you mean John 3:16?"
- Suggestion system for common typos

**API Down:**
- Graceful fallback message: "Can't reach Bible service right now."
- All journals and favorites remain fully functional
- Clear indication of degraded functionality
- Retry button

### Storage Management

**LocalStorage Monitoring:**
- Track storage usage
- Warning at 4MB: "Storage getting full. Consider exporting and clearing old entries."
- Prevent writes if at limit, prompt for cleanup

**Cleanup Options:**
- "Clear Old Journals" - Keep last 100 entries or 6 months (user choice)
- Export before clearing (automatic prompt)
- Selective deletion by date range or book

### Offline Behavior

**Detection:**
- Service worker detects offline state
- Show banner: "Offline - Viewing saved content only"
- Disable search features (grayed out, with tooltip)

**Available Offline:**
- All journal entries (full access)
- All favorites (full access)
- Settings management
- Reading plan progress tracking
- Dark mode toggle

**Unavailable Offline:**
- Bible search (both modes)
- Fetching new verses
- Daily verse notifications (queued for when online)

**Online Recovery:**
- Auto-dismiss offline banner
- Re-enable search features
- Sync queued notification requests

### Data Integrity

**Validation:**
- Validate JSON structure on import
- Check required fields exist
- Validate date formats (ISO 8601)
- Check for data corruption in LocalStorage

**Backup and Recovery:**
- Auto-backup before destructive operations
- Restore on error
- Show recovery options if corruption detected

**Confirmations:**
- Confirm before deleting entries
- Confirm before clearing data
- Confirm before replace on import
- Clear messaging about consequences

## PWA Implementation

### manifest.json Configuration

```json
{
  "name": "Faith Dive - Bible Journaling",
  "short_name": "Faith Dive",
  "description": "Personal Bible study and journaling",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#D4AF37",
  "background_color": "#F5F5DC",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Service Worker Strategy

**App Shell Caching:**
- Cache HTML, CSS, JS files on service worker install
- Update cache on service worker update
- Instant loading on repeat visits

**API Response Caching:**
- Network-first strategy for Bible verses
- Cache successful responses
- Fall back to cache on network failure
- 1-hour TTL for cached verses

**Static Asset Caching:**
- Cache fonts, icons, images on first load
- Cache-first strategy (they rarely change)

**Update Strategy:**
- Check for new service worker on each app visit
- Prompt user when update available: "Update available - Refresh to get the latest version"
- Skip waiting on user confirmation
- Auto-reload to activate new service worker

### Install Experience

**Custom Install Prompt:**
- Show after user journals their first entry (demonstrates value)
- Dismissible banner: "Install Faith Dive for quick access to your devotions"
- Respects user's choice (don't show again if dismissed)
- Standard browser install UI when user clicks

**First-Run Experience:**
- Welcome screen explaining key features
- Translation selection (required before use)
- Optional: Enable notifications, choose theme
- Sample journal entry or tutorial

### Push Notifications

**Permission Request:**
- Only when user enables daily verse feature
- Clear explanation of what notifications contain
- Respect denial (don't nag)

**Service Worker Notification Handler:**
- Listen for scheduled notification events from backend
- Display notification with verse reference and snippet
- Action buttons: "Journal This" and "Dismiss"
- Handle notification click (open app to specific verse)

**Backend Scheduling:**
- FastAPI endpoint to register notification time
- Cron job or scheduler to trigger notifications at user's chosen time
- Use Web Push protocol

## Testing Strategy

### Backend Testing (FastAPI)

**Unit Tests (pytest):**
- Test Bible API proxy endpoints
- Mock Bible API responses
- Test error handling (API down, rate limits, invalid references)
- Test caching behavior (TTL, cache hits/misses)
- Test rate limiting logic

**Integration Tests:**
- End-to-end API flow
- Test actual Bible API integration (in dev environment)
- Test CORS headers
- Test static file serving

**Endpoints to Test:**
- `GET /api/search?q=love&translation=ESV`
- `GET /api/verse/{reference}?translation=ESV`
- `GET /api/translations` (list available translations)

### Frontend Testing

**Manual Testing Focus:**
- Given vanilla JS approach, primarily manual testing
- Use browser dev tools for debugging

**LocalStorage Operations:**
- Test save, retrieve, edit, delete journals
- Test favorites management
- Test settings persistence
- Test data integrity after browser refresh

**Export/Import:**
- Validate JSON structure
- Test merge vs replace logic
- Test error handling for malformed JSON
- Test backup before import

**Cross-Browser Testing:**
- Chrome (desktop and mobile)
- Firefox
- Safari (especially iOS Safari for PWA features)
- Edge

**Offline Mode:**
- Disable network in dev tools
- Verify read-only functionality
- Test offline-to-online transitions
- Verify queued operations execute when back online

### PWA Testing

**Lighthouse Audit:**
- Target: 90+ PWA score
- Test on real mobile device
- Address any recommendations

**Service Worker:**
- Test install event
- Test update flow
- Test caching strategies
- Test offline functionality
- Use Chrome DevTools Application tab

**Installability:**
- Test on Android device (Chrome)
- Test on iOS device (Safari)
- Verify manifest.json correctness
- Test app icon and splash screen

**Push Notifications:**
- Test notification display
- Test notification actions
- Test notification click handling
- Verify correct timing

### User Acceptance Testing

**Complete User Flows:**
1. Search for verse → Read → Journal → View in journal list
2. Search → Add to favorites → View favorites → Remove
3. Select reading plan → Check off daily reading → View progress
4. Enable notifications → Receive notification → Journal from notification
5. Toggle dark mode → Verify all screens
6. Export data → Clear browser → Import data → Verify restoration

**Edge Cases:**
- Search for non-existent verse reference
- Fill LocalStorage to limit
- Import corrupted JSON
- Use app during internet disruption
- Install, uninstall, reinstall app

## Implementation Phases

### Phase 1: Core Functionality (MVP)
- FastAPI backend with Bible API proxy
- Basic frontend structure (HTML/CSS/JS)
- Bible search (reference lookup only)
- Journal entry creation and viewing (simple list)
- LocalStorage implementation
- Basic PWA (manifest, simple service worker)

### Phase 2: Enhanced Features
- Keyword search
- Organized journal views (by book, by date)
- Favorites functionality
- Edit/delete functionality
- Export/import
- Dark mode

### Phase 3: Advanced Features
- Daily verse notifications
- Reading plans
- Service worker caching strategies
- Install prompt customization
- Full offline support

### Phase 4: Polish & Optimization
- UI refinement (warm & traditional aesthetic)
- Performance optimization
- Cross-browser testing and fixes
- Lighthouse audit improvements
- User testing and feedback incorporation

## Technical Considerations

### Bible API Selection

**Recommended: API.Bible**
- Free tier: 1000 requests/day
- Multiple translations
- Good documentation
- RESTful API

**Alternative: ESV API**
- Free for non-commercial use
- High-quality translation
- Simpler API

**Implementation:**
- Abstract API calls behind service layer
- Easy to switch providers if needed
- Cache aggressively to minimize API calls

### Performance Optimization

**Frontend:**
- Lazy load journal entries (virtualized list for 100+ entries)
- Debounce search input
- Minimize DOM manipulation
- Use CSS transforms for animations (GPU acceleration)

**Backend:**
- Redis or in-memory cache for Bible API responses
- Gzip compression for API responses
- CDN for static assets (future enhancement)

**Service Worker:**
- Efficient cache management (size limits, cleanup old entries)
- Background sync for notifications

### Security Considerations

**Data Privacy:**
- All user data stored locally (no server-side database)
- No user accounts or authentication needed
- Clear privacy policy

**API Security:**
- Rate limiting on FastAPI endpoints
- API key management (environment variables)
- CORS configuration

**Input Validation:**
- Sanitize user input in journal notes
- Validate verse references
- Prevent XSS in displaying user content

### Browser Compatibility

**Minimum Support:**
- Chrome 90+ (Android/Desktop)
- Safari 14+ (iOS/macOS)
- Firefox 88+
- Edge 90+

**Progressive Enhancement:**
- Core functionality works without service worker
- Notifications are optional enhancement
- Graceful degradation for older browsers

## Future Enhancements

**Post-MVP Ideas:**
- Verse memorization feature with spaced repetition
- Share verses (copy to clipboard, social media)
- Verse of the day from multiple sources
- Audio Bible integration
- Study notes and commentaries
- Multi-device sync (requires backend database)
- Community reading plans
- Prayer journal section
- Tagging system for journal entries
- Search within journal notes
- Visual themes beyond light/dark

## Success Metrics

**Engagement:**
- Daily active users
- Average journal entries per user per week
- Reading plan completion rate
- Notification click-through rate

**Technical:**
- Lighthouse PWA score 90+
- App install rate
- Offline usage percentage
- API response time < 500ms
- Zero LocalStorage data loss incidents

**User Satisfaction:**
- App store ratings (if published)
- User feedback and feature requests
- Support ticket volume

---

**Design Complete - Ready for Implementation Planning**
