# Faith Dive - AI Assistant Context

This document provides comprehensive context for AI assistants working on the Faith Dive project.

## Project Overview

**Faith Dive** is a Progressive Web Application (PWA) for personal Bible study and journaling. It enables users to search Scripture, write reflections, and manage their spiritual journey with complete privacy through local-only data storage.

### Core Features

1. **Bible Search**
   - Reference-based search (e.g., "John 3:16")
   - Keyword search across verses
   - Multiple Bible translations via API.Bible
   - Instant, responsive results

2. **Journaling System**
   - Create, read, update, delete (CRUD) journal entries
   - Link verses to personal reflections
   - Chronological organization
   - Rich text preservation

3. **Dark Mode**
   - Light/dark theme toggle
   - Persistent user preference
   - Warm, traditional design aesthetics
   - Optimized contrast for readability

4. **Data Management**
   - Export/import functionality (JSON)
   - Complete local storage (browser-based)
   - No external data persistence
   - Offline-capable operation

### Project Goals

- **Privacy First**: All user data remains local in browser storage
- **Offline Capable**: Core functionality works without internet
- **Simple & Beautiful**: Clean UI with traditional, warm aesthetics
- **Mobile-First**: Optimized for on-the-go Bible study
- **Performance**: Fast, responsive interactions

---

## Architecture Overview

### System Architecture

Faith Dive follows a **client-server architecture** with the following components:

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  ┌──────────────────────────────────────────┐  │
│  │         Single Page Application          │  │
│  │  - HTML5 + CSS3 + Vanilla JavaScript     │  │
│  │  - ES6 Modules (app, database, etc.)     │  │
│  │  - sql.js (SQLite in browser)            │  │
│  │  - localStorage for persistence          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────┐
│                Backend (API)                     │
│  ┌──────────────────────────────────────────┐  │
│  │        Node.js + Express Server          │  │
│  │  - Routes: API endpoint definitions      │  │
│  │  - Services: Business logic layer        │  │
│  │  - Config: Environment configuration     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↕ HTTPS
┌─────────────────────────────────────────────────┐
│              External Services                   │
│  - API.Bible (scripture.api.bible)              │
│  - 573+ Bible translations                       │
└─────────────────────────────────────────────────┘
```

### Backend Architecture

**Pattern**: Service Layer Pattern (Routes → Services → External APIs)

```
server/
├── index.js              # Express app setup, middleware, routing
├── config.js             # Environment configuration (dotenv)
├── routes/
│   └── bible.js          # Bible API route handlers
└── services/
    └── bibleApi.js       # BibleApiService class (API.Bible integration)
```

**Key Components:**

1. **index.js**: Application entry point
   - Middleware setup (helmet, cors, compression, body parsing)
   - Route registration
   - Static file serving
   - SPA fallback routing
   - Error handling middleware

2. **Routes** (`routes/bible.js`):
   - `GET /api/bible/translations` - List available Bible translations
   - `GET /api/bible/verse/:reference` - Fetch specific verse/passage
   - `GET /api/bible/search` - Keyword search across verses

3. **Services** (`services/bibleApi.js`):
   - `BibleApiService` class encapsulates API.Bible integration
   - Methods: `getVerse()`, `search()`, `getAvailableBibles()`
   - Handles authentication, error handling, response transformation

### Frontend Architecture

**Pattern**: Module Pattern with ES6 Imports

```
public/
├── index.html            # Main HTML (SPA shell)
├── manifest.json         # PWA manifest
├── css/
│   └── style.css         # All styling (CSS variables for theming)
├── icons/
│   └── icon.svg          # App icon
└── js/
    ├── app.js            # Main app logic, navigation, UI rendering
    ├── database.js       # Database class (sql.js wrapper)
    ├── bibleSearch.js    # Bible API integration module
    ├── journal.js        # Journal CRUD operations
    └── theme.js          # Theme management (light/dark mode)
```

**Key Modules:**

1. **app.js** - Application Controller
   - Navigation management
   - Page rendering (search, journal, settings)
   - Event handling
   - Modal management
   - Data import/export UI

2. **database.js** - Data Layer
   - `Database` class wrapping sql.js
   - Table creation (journals, favorites, settings)
   - CRUD helpers (`all()`, `get()`, `run()`, `exec()`)
   - LocalStorage persistence
   - Import/export functionality

3. **bibleSearch.js** - API Integration
   - Backend API communication
   - Reference search
   - Keyword search
   - Response formatting

4. **journal.js** - Business Logic
   - Journal entry management (create, read, update, delete)
   - Date formatting
   - Book name extraction

5. **theme.js** - Theme Management
   - Light/dark mode toggle
   - Persistent preference storage
   - CSS variable manipulation

### Database Schema

**Technology**: sql.js (SQLite compiled to WebAssembly)

**Storage**: Browser localStorage (serialized SQLite database)

**Tables**:

```sql
-- Journal entries
CREATE TABLE journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL,        -- e.g., "John 3:16"
  verse_text TEXT NOT NULL,       -- The Bible verse content
  notes TEXT NOT NULL,            -- User's personal reflections
  book TEXT NOT NULL,             -- Extracted book name (e.g., "John")
  timestamp TEXT NOT NULL         -- ISO 8601 date string
);

-- Favorites (feature pending)
CREATE TABLE favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL,
  translation TEXT NOT NULL,      -- Bible version ID
  created_at TEXT NOT NULL
);

-- User settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Data Flow Examples

**1. Search for a Verse**
```
User Input → app.js (UI) → bibleSearch.js → Backend API (/api/bible/verse/:ref)
→ bibleApi.js (service) → API.Bible → Response → UI Rendering
```

**2. Create Journal Entry**
```
User Input → app.js (modal) → journal.js (create) → database.js (run)
→ sql.js (SQL execution) → localStorage (persistence) → UI Update
```

**3. Toggle Theme**
```
User Click → app.js (toggleTheme) → theme.js (toggle) → database.js (settings update)
→ CSS Variable Update → UI Re-render
```

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v14+ | JavaScript runtime |
| **Express** | 5.2.1 | Web application framework |
| **node-fetch** | 2.7.0 | HTTP client for API.Bible |
| **dotenv** | 17.2.3 | Environment variable management |
| **helmet** | 8.1.0 | Security headers middleware |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |
| **compression** | 1.8.1 | Response compression (gzip) |

### Frontend

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic markup, PWA shell |
| **CSS3** | Styling with CSS variables |
| **JavaScript (ES6+)** | Application logic, modules |
| **sql.js** | SQLite database (WebAssembly) |
| **API.Bible** | Bible text provider (external) |

### Development & Testing

| Tool | Purpose |
|------|---------|
| **Jest** | Unit testing framework |
| **Supertest** | HTTP assertion library |
| **nodemon** | Development auto-reload |

### External Services

- **API.Bible** ([scripture.api.bible](https://scripture.api.bible))
  - 573+ Bible translations
  - RESTful API
  - Free tier available
  - Authentication via API key

---

## Development Guidelines

### Coding Standards

#### JavaScript

1. **ES6+ Features**
   - Use `const` and `let` (never `var`)
   - Arrow functions for callbacks
   - Template literals for strings
   - Destructuring where appropriate
   - Async/await for asynchronous operations

   ```javascript
   // Good
   const fetchData = async () => {
     try {
       const { data } = await api.get('/endpoint');
       return data;
     } catch (error) {
       console.error('Error:', error);
     }
   };

   // Avoid
   var fetchData = function() {
     return api.get('/endpoint').then(function(response) {
       return response.data;
     });
   };
   ```

2. **Error Handling**
   - Always use try-catch with async/await
   - Log errors to console with context
   - Return null or empty arrays on failure (avoid throwing in services)
   - Provide user-friendly error messages in UI

   ```javascript
   async getVerse(reference, bibleId) {
     try {
       const response = await fetch(url, { headers: this.getHeaders() });
       if (!response.ok) return null;
       return await response.json();
     } catch (error) {
       console.error('Error fetching verse:', error);
       return null;
     }
   }
   ```

3. **Function Documentation**
   - Use JSDoc comments for all public methods
   - Include parameter types and return types
   - Document edge cases and exceptions

   ```javascript
   /**
    * Fetch a specific verse or passage
    * @param {string} reference - Bible reference (e.g., "John 3:16")
    * @param {string} bibleId - Bible translation ID
    * @returns {Promise<Object|null>} Verse data or null if not found
    */
   async getVerse(reference, bibleId) {
     // Implementation
   }
   ```

4. **Naming Conventions**
   - **Classes**: PascalCase (`BibleApiService`, `Database`)
   - **Functions/Variables**: camelCase (`getVerse`, `journalEntries`)
   - **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
   - **Private methods**: Prefix with underscore (`_formatResponse`)
   - **Boolean variables**: Use is/has prefix (`isLoading`, `hasError`)

5. **Code Organization**
   - One class per file
   - Group related functions together
   - Keep functions small and focused (single responsibility)
   - Separate UI logic from business logic
   - Extract complex logic into helper functions

#### HTML/CSS

1. **Semantic HTML**
   - Use semantic tags (`<nav>`, `<main>`, `<article>`, `<section>`)
   - Proper heading hierarchy (h1 → h2 → h3)
   - Meaningful class names (BEM-inspired)

2. **CSS Variables**
   - Use CSS variables for theming
   - Define in `:root` for light mode
   - Override in `[data-theme="dark"]` for dark mode

   ```css
   :root {
     --primary-bg: #F5F5DC;
     --text-color: #3E2723;
   }

   [data-theme="dark"] {
     --primary-bg: #1A1410;
     --text-color: #E8DCC8;
   }
   ```

3. **Responsive Design**
   - Mobile-first approach
   - Use relative units (rem, em, %)
   - Flexible layouts (flexbox, grid)

#### Backend Patterns

1. **Middleware Order** (Critical!)
   ```javascript
   // Security first
   app.use(helmet());

   // Performance
   app.use(compression());

   // CORS
   app.use(cors());

   // Body parsing
   app.use(express.json());

   // Routes
   app.use('/api/bible', bibleRouter);

   // Static files
   app.use(express.static('public'));

   // SPA fallback (must be last!)
   app.use((req, res) => { /* ... */ });

   // Error handler (absolute last!)
   app.use((err, req, res, next) => { /* ... */ });
   ```

2. **Service Layer Pattern**
   - Routes handle HTTP concerns (request/response)
   - Services contain business logic
   - Services are reusable and testable
   - Keep routes thin, services fat

3. **Configuration**
   - Never commit `.env` files
   - Use `.env.example` for documentation
   - Load config once in `config.js`
   - Access via `require('./config')`

### Testing Standards

1. **Unit Tests**
   - Test files: `__tests__/*.test.js`
   - One describe block per function/method
   - Test happy path and edge cases
   - Mock external dependencies (API calls)

   ```javascript
   describe('BibleApiService.getVerse', () => {
     it('should return verse data for valid reference', async () => {
       // Test implementation
     });

     it('should return null for invalid reference', async () => {
       // Test implementation
     });
   });
   ```

2. **Coverage Requirements**
   - Aim for 80%+ code coverage
   - Prioritize service layer testing
   - Test error handling paths

3. **Running Tests**
   ```bash
   npm test              # Run all tests with coverage
   npm run test:watch    # Watch mode for development
   ```

### Git Workflow

1. **Commit Messages**
   - Format: `<type>: <description>`
   - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
   - Examples:
     - `feat: add dark mode toggle`
     - `fix: resolve verse search bug`
     - `docs: update API documentation`

2. **Branch Strategy**
   - `main`: Production-ready code
   - Feature branches: `feature/description`
   - Bug fixes: `fix/description`

### Security Guidelines

1. **Environment Variables**
   - Store all secrets in `.env`
   - Never log API keys
   - Validate all environment variables on startup

2. **Input Validation**
   - Validate all user inputs
   - Sanitize before database operations
   - Escape HTML for user-generated content

3. **API Security**
   - Use helmet for security headers
   - Enable CORS appropriately
   - Rate limiting (future consideration)

---

## Implementation Notes

### Key Design Decisions

1. **Why sql.js?**
   - Client-side relational database
   - Familiar SQL syntax
   - No server-side database needed
   - Complete offline capability
   - Easy export/import (serialization)

2. **Why Vanilla JavaScript?**
   - No framework overhead
   - Faster load times
   - Simpler dependencies
   - Educational value
   - Sufficient for app complexity

3. **Why API Proxy Backend?**
   - Hide API keys from frontend
   - Add server-side validation
   - Future extensibility (caching, rate limiting)
   - Consistent error handling

4. **Why localStorage?**
   - Simple persistence mechanism
   - Synchronous API (easier for sql.js)
   - No IndexedDB complexity needed
   - Adequate for data size (<5MB typical)

### Current Limitations & TODOs

1. **Pending Features** (from README roadmap)
   - [ ] Favorites management (database table exists)
   - [ ] Reading plans
   - [ ] Daily verse notifications
   - [ ] Service worker for offline caching
   - [ ] Cross-reference lookup
   - [ ] Verse comparison between translations
   - [ ] Tags/categories for journal entries
   - [ ] Share verses as images

2. **Known Issues**
   - Content Security Policy disabled (needs configuration)
   - No service worker (offline limited to localStorage)
   - No authentication system (single-user app)

3. **Technical Debt**
   - Add input validation on frontend forms
   - Implement proper CSP headers
   - Add rate limiting for API routes
   - Improve error boundaries in UI
   - Add loading states for all async operations

### Adding New Features

#### Backend API Endpoint

1. Create route in `server/routes/`
2. Implement service method if needed
3. Add validation
4. Write tests in `__tests__/`
5. Document in API section

#### Frontend Feature

1. Add UI in `app.js` page rendering
2. Create module if complex (new `.js` file)
3. Add database operations if needed (modify `database.js`)
4. Style with CSS variables
5. Test across light/dark themes

#### Database Changes

1. Modify `database.js` → `createTables()`
2. Add migration logic if needed
3. Update `exportData()` and `importData()`
4. Test with existing data

### Debugging Tips

1. **Backend Issues**
   - Check console for Express errors
   - Verify `.env` configuration
   - Test API endpoints with curl/Postman
   - Check API.Bible service status

2. **Frontend Issues**
   - Open browser DevTools console
   - Check Network tab for failed requests
   - Inspect localStorage (`faithdive_db`)
   - Verify sql.js loaded (CDN)

3. **Database Issues**
   - Export data as JSON backup first
   - Clear localStorage and reinitialize
   - Check browser storage quota
   - Verify SQL syntax in queries

---

## Quick Reference

### Environment Setup

```bash
# 1. Clone and install
git clone https://github.com/MikeMaitoza/FaithDive.git
cd FaithDive
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add BIBLE_API_KEY

# 3. Run development server
npm run dev

# 4. Run tests
npm test
```

### Common Commands

```bash
npm start          # Production server
npm run dev        # Development (auto-reload)
npm test           # Run tests with coverage
npm run test:watch # Watch mode
```

### File Locations

- **Config**: `server/config.js`, `.env`
- **Routes**: `server/routes/bible.js`
- **Services**: `server/services/bibleApi.js`
- **Frontend**: `public/js/*.js`
- **Tests**: `server/__tests__/*.test.js`
- **Styles**: `public/css/style.css`

### API Endpoints

- `GET /api/health` - Health check
- `GET /api/bible/translations` - List Bible translations
- `GET /api/bible/verse/:reference?bible_id=X` - Get verse
- `GET /api/bible/search?q=X&bible_id=Y` - Search verses

---

## Working with AI Assistants

### Context to Provide

When asking for help, include:
- Which layer you're working on (frontend/backend)
- Relevant file paths
- Error messages (full stack trace)
- What you've already tried

### Best Practices

1. **Read Before Modifying**
   - Always read existing code first
   - Understand current patterns
   - Match existing code style

2. **Test Changes**
   - Run tests after modifications
   - Test in both light and dark modes
   - Verify offline functionality

3. **Preserve Privacy**
   - Maintain local-only data storage
   - Don't add external tracking
   - Respect user privacy principles

4. **Mobile-First**
   - Test responsive design
   - Consider touch interactions
   - Optimize for small screens

### Common Tasks

- **Add new Bible API endpoint**: Modify `routes/bible.js` and `services/bibleApi.js`
- **Add UI feature**: Update `app.js` and relevant module
- **Database changes**: Modify `database.js` createTables and CRUD methods
- **Styling**: Edit `public/css/style.css` using CSS variables
- **Add tests**: Create in `server/__tests__/` following existing patterns

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [sql.js Documentation](https://github.com/sql-js/sql.js)
- [API.Bible Documentation](https://scripture.api.bible)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Jest Testing Framework](https://jestjs.io/)

---

**Last Updated**: 2025-12-15
**Version**: 1.0.0
**Maintained By**: Mike Maitoza
