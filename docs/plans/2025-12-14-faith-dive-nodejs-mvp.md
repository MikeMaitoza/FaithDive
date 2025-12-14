# Faith Dive - Node.js Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete Bible journaling PWA using Node.js/Express backend, sql.js for client-side database, and API.Bible for Bible text.

**Architecture:** Node.js/Express backend serves static files and proxies Bible API requests with SQLite caching. Frontend uses vanilla HTML/CSS/JS with sql.js (SQLite in browser via WebAssembly) for user's journal/favorites database. Data stays local on user's device.

**Tech Stack:** Node.js 18+, Express, SQLite3 (server cache), sql.js (client database), API.Bible, vanilla JavaScript, Service Worker API, PWA

**Design Reference:** Using color scheme (#F5F5DC bg, #D4AF37 gold, #3E2723 text), Merriweather/Open Sans fonts, and features from original design document.

---

## Phase 1: Backend Setup (Node.js + Express)

### Task 1: Initialize Node.js Project

**Files:**
- Create: `package.json`
- Create: `server/index.js`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `server/config.js`

**Step 1: Create .gitignore**

Create `.gitignore`:

```gitignore
# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env

# Database
*.db
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/

# Test coverage
coverage/
.nyc_output/
```

**Step 2: Run npm init**

Run:
```bash
npm init -y
```

Expected: `package.json` created

**Step 3: Install dependencies**

Run:
```bash
npm install express dotenv cors helmet compression
npm install --save-dev nodemon jest supertest
```

Expected: Dependencies installed, `package-lock.json` created

**Step 4: Update package.json scripts**

Modify `package.json` - add to "scripts" section:

```json
{
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

**Step 5: Create environment configuration**

Create `.env.example`:

```env
# Bible API Configuration
BIBLE_API_KEY=your_api_key_here
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1

# Server Configuration
PORT=3000
NODE_ENV=development
```

Create `.env`:
```bash
cp .env.example .env
# Add your actual API key to .env
```

**Step 6: Create config module**

Create `server/config.js`:

```javascript
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  bibleApi: {
    key: process.env.BIBLE_API_KEY,
    baseUrl: process.env.BIBLE_API_BASE_URL || 'https://api.scripture.api.bible/v1'
  }
};
```

**Step 7: Create minimal Express server**

Create `server/index.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./config');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // We'll configure this properly later
}));

// Compression
app.use(compression());

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Faith Dive API' });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route for SPA
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`✅ Faith Dive server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
});

module.exports = app;
```

**Step 8: Write test for health endpoint**

Create `server/__tests__/health.test.js`:

```javascript
const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      status: 'healthy',
      service: 'Faith Dive API'
    });
  });
});
```

**Step 9: Run test to verify it passes**

Run:
```bash
npm test
```

Expected: Test passes

**Step 10: Test server manually**

Run:
```bash
npm run dev
```

In another terminal:
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"healthy","service":"Faith Dive API"}`

**Step 11: Commit**

```bash
git add .
git commit -m "feat: initialize Node.js/Express backend

- Set up Express server with middleware
- Add health check endpoint
- Configure environment variables
- Add test infrastructure with Jest
- Add development scripts with nodemon"
```

---

### Task 2: Bible API Service Layer

**Files:**
- Create: `server/services/bibleApi.js`
- Create: `server/__tests__/bibleApi.test.js`

**Step 1: Write failing test for Bible API service**

Create `server/__tests__/bibleApi.test.js`:

```javascript
const BibleApiService = require('../services/bibleApi');

// Mock fetch
global.fetch = jest.fn();

describe('BibleApiService', () => {
  let service;

  beforeEach(() => {
    service = new BibleApiService('test-api-key');
    fetch.mockClear();
  });

  describe('getVerse', () => {
    it('should fetch a verse successfully', async () => {
      const mockResponse = {
        data: {
          reference: 'John 3:16',
          content: 'For God so loved the world...'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.getVerse('John 3:16', 'test-bible-id');

      expect(result).toEqual({
        reference: 'John 3:16',
        text: 'For God so loved the world...',
        bibleId: 'test-bible-id'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/passages/John 3:16'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'api-key': 'test-api-key'
          })
        })
      );
    });

    it('should return null on error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await service.getVerse('Invalid 99:99', 'test-bible-id');

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const mockResponse = {
        data: {
          verses: [
            { reference: 'John 3:16', text: 'For God so loved...' },
            { reference: '1 John 4:8', text: 'God is love' }
          ]
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await service.search('love', 'test-bible-id', 10);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        reference: 'John 3:16',
        text: 'For God so loved...'
      });
    });
  });

  describe('getAvailableBibles', () => {
    it('should return list of Bibles', async () => {
      const mockResponse = {
        data: [
          { id: 'KJV', name: 'King James Version', abbreviation: 'KJV' },
          { id: 'ESV', name: 'English Standard Version', abbreviation: 'ESV' }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await service.getAvailableBibles();

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'KJV',
        name: 'King James Version',
        abbreviation: 'KJV'
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL - "Cannot find module '../services/bibleApi'"

**Step 3: Implement Bible API service**

Create `server/services/bibleApi.js`:

```javascript
const fetch = require('node-fetch');

class BibleApiService {
  constructor(apiKey, baseUrl = 'https://api.scripture.api.bible/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    return {
      'api-key': this.apiKey,
      'Accept': 'application/json'
    };
  }

  /**
   * Fetch a specific verse or passage
   * @param {string} reference - Bible reference (e.g., "John 3:16")
   * @param {string} bibleId - Bible translation ID
   * @returns {Promise<Object|null>} Verse data or null if not found
   */
  async getVerse(reference, bibleId) {
    try {
      const url = `${this.baseUrl}/bibles/${bibleId}/passages/${encodeURIComponent(reference)}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const passage = data.data || {};

      return {
        reference: passage.reference || reference,
        text: passage.content || '',
        bibleId: bibleId
      };
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  /**
   * Search for verses containing keywords
   * @param {string} query - Search query
   * @param {string} bibleId - Bible translation ID
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of verse objects
   */
  async search(query, bibleId, limit = 10) {
    try {
      const url = `${this.baseUrl}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const verses = data.data?.verses || [];

      return verses.map(verse => ({
        reference: verse.reference || '',
        text: verse.text || ''
      }));
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  /**
   * Get list of available Bible translations
   * @returns {Promise<Array>} Array of Bible objects
   */
  async getAvailableBibles() {
    try {
      const url = `${this.baseUrl}/bibles`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const bibles = data.data || [];

      return bibles.map(bible => ({
        id: bible.id,
        name: bible.name,
        abbreviation: bible.abbreviation
      }));
    } catch (error) {
      console.error('Error fetching Bibles:', error);
      return [];
    }
  }
}

module.exports = BibleApiService;
```

**Step 4: Install node-fetch**

Run:
```bash
npm install node-fetch@2
```

Note: Using v2 for CommonJS compatibility

**Step 5: Run tests to verify they pass**

Run:
```bash
npm test
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add server/services/ server/__tests__/
git commit -m "feat: add Bible API service with comprehensive tests

- Implement BibleApiService class
- Add getVerse, search, and getAvailableBibles methods
- Include error handling and null safety
- Add full test coverage with mocked fetch"
```

---

### Task 3: Bible API Routes

**Files:**
- Create: `server/routes/bible.js`
- Create: `server/__tests__/bible.routes.test.js`
- Modify: `server/index.js`

**Step 1: Write failing test for Bible routes**

Create `server/__tests__/bible.routes.test.js`:

```javascript
const request = require('supertest');
const express = require('express');
const bibleRouter = require('../routes/bible');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/bible', bibleRouter);

// Mock the Bible API service
jest.mock('../services/bibleApi');
const BibleApiService = require('../services/bibleApi');

describe('Bible Routes', () => {
  let mockService;

  beforeEach(() => {
    mockService = {
      getAvailableBibles: jest.fn(),
      getVerse: jest.fn(),
      search: jest.fn()
    };
    BibleApiService.mockImplementation(() => mockService);
  });

  describe('GET /api/bible/translations', () => {
    it('should return list of translations', async () => {
      mockService.getAvailableBibles.mockResolvedValue([
        { id: 'KJV', name: 'King James Version', abbreviation: 'KJV' }
      ]);

      const response = await request(app)
        .get('/api/bible/translations')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('KJV');
    });

    it('should return 503 if service fails', async () => {
      mockService.getAvailableBibles.mockResolvedValue([]);

      await request(app)
        .get('/api/bible/translations')
        .expect(503);
    });
  });

  describe('GET /api/bible/verse/:reference', () => {
    it('should return verse data', async () => {
      mockService.getVerse.mockResolvedValue({
        reference: 'John 3:16',
        text: 'For God so loved...',
        bibleId: 'KJV'
      });

      const response = await request(app)
        .get('/api/bible/verse/John%203:16')
        .query({ bible_id: 'KJV' })
        .expect(200);

      expect(response.body.reference).toBe('John 3:16');
    });

    it('should return 404 if verse not found', async () => {
      mockService.getVerse.mockResolvedValue(null);

      await request(app)
        .get('/api/bible/verse/Invalid%2099:99')
        .query({ bible_id: 'KJV' })
        .expect(404);
    });

    it('should return 400 if bible_id missing', async () => {
      await request(app)
        .get('/api/bible/verse/John%203:16')
        .expect(400);
    });
  });

  describe('GET /api/bible/search', () => {
    it('should return search results', async () => {
      mockService.search.mockResolvedValue([
        { reference: 'John 3:16', text: 'For God so loved...' }
      ]);

      const response = await request(app)
        .get('/api/bible/search')
        .query({ q: 'love', bible_id: 'KJV' })
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should return 400 if query missing', async () => {
      await request(app)
        .get('/api/bible/search')
        .query({ bible_id: 'KJV' })
        .expect(400);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL - "Cannot find module '../routes/bible'"

**Step 3: Implement Bible routes**

Create `server/routes/bible.js`:

```javascript
const express = require('express');
const BibleApiService = require('../services/bibleApi');
const config = require('../config');

const router = express.Router();
const bibleService = new BibleApiService(config.bibleApi.key, config.bibleApi.baseUrl);

/**
 * GET /api/bible/translations
 * Get list of available Bible translations
 */
router.get('/translations', async (req, res) => {
  try {
    const translations = await bibleService.getAvailableBibles();

    if (translations.length === 0) {
      return res.status(503).json({ error: 'Unable to fetch translations' });
    }

    res.json(translations);
  } catch (error) {
    console.error('Error in /translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/bible/verse/:reference
 * Get a specific Bible verse or passage
 */
router.get('/verse/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const { bible_id } = req.query;

    if (!bible_id) {
      return res.status(400).json({ error: 'bible_id query parameter is required' });
    }

    const verse = await bibleService.getVerse(reference, bible_id);

    if (!verse) {
      return res.status(404).json({ error: `Verse '${reference}' not found` });
    }

    res.json(verse);
  } catch (error) {
    console.error('Error in /verse:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/bible/search
 * Search for verses containing keywords
 */
router.get('/search', async (req, res) => {
  try {
    const { q, bible_id, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'q query parameter is required' });
    }

    if (!bible_id) {
      return res.status(400).json({ error: 'bible_id query parameter is required' });
    }

    const results = await bibleService.search(q, bible_id, parseInt(limit));

    res.json(results);
  } catch (error) {
    console.error('Error in /search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

**Step 4: Register routes in main app**

Modify `server/index.js` - add after body parsing middleware:

```javascript
// Routes
const bibleRouter = require('./routes/bible');
app.use('/api/bible', bibleRouter);
```

**Step 5: Run tests to verify they pass**

Run:
```bash
npm test
```

Expected: All tests pass

**Step 6: Test manually**

Run:
```bash
npm run dev
```

Test endpoints:
```bash
# Get translations
curl http://localhost:3000/api/bible/translations

# Get a verse (use actual bible_id from translations)
curl "http://localhost:3000/api/bible/verse/John%203:16?bible_id=de4e12af7f28f599-02"

# Search
curl "http://localhost:3000/api/bible/search?q=love&bible_id=de4e12af7f28f599-02"
```

Expected: All return valid JSON

**Step 7: Commit**

```bash
git add server/routes/ server/index.js server/__tests__/
git commit -m "feat: add Bible API routes with validation

- Add GET /api/bible/translations endpoint
- Add GET /api/bible/verse/:reference endpoint
- Add GET /api/bible/search endpoint
- Include request validation and error handling
- Add comprehensive route tests"
```

---

## Phase 2: Frontend with sql.js Database

### Task 4: Frontend Structure and sql.js Setup

**Files:**
- Create: `public/index.html`
- Create: `public/css/style.css`
- Create: `public/js/app.js`
- Create: `public/js/database.js`
- Create: `public/manifest.json`
- Create: `public/icons/` (placeholders)

**Step 1: Create HTML structure**

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Faith Dive - Personal Bible study and journaling">
    <meta name="theme-color" content="#D4AF37">

    <title>Faith Dive - Bible Journaling</title>

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">

    <!-- Styles -->
    <link rel="stylesheet" href="/css/style.css">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Main Container -->
    <div id="app">
        <!-- Header -->
        <header class="app-header">
            <h1>Faith Dive</h1>
        </header>

        <!-- Main Content Area -->
        <main id="main-content" class="main-content">
            <div class="loading">Loading...</div>
        </main>

        <!-- Bottom Navigation -->
        <nav class="bottom-nav">
            <button class="nav-btn active" data-page="search">
                <span class="nav-icon">🔍</span>
                <span class="nav-label">Search</span>
            </button>
            <button class="nav-btn" data-page="journal">
                <span class="nav-icon">📖</span>
                <span class="nav-label">Journal</span>
            </button>
            <button class="nav-btn" data-page="favorites">
                <span class="nav-icon">⭐</span>
                <span class="nav-label">Favorites</span>
            </button>
            <button class="nav-btn" data-page="more">
                <span class="nav-icon">⋯</span>
                <span class="nav-label">More</span>
            </button>
        </nav>
    </div>

    <!-- Offline Banner -->
    <div id="offline-banner" class="offline-banner hidden">
        <p>Offline - Viewing saved content only</p>
    </div>

    <!-- Load sql.js from CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js"></script>

    <!-- Scripts -->
    <script src="/js/database.js" type="module"></script>
    <script src="/js/app.js" type="module"></script>
</body>
</html>
```

**Step 2: Create CSS (reuse warm & traditional theme)**

Create `public/css/style.css`:

```css
/* ===== CSS Variables ===== */
:root {
    /* Light Theme Colors */
    --bg-primary: #F5F5DC;
    --bg-secondary: #FFF8E7;
    --text-primary: #3E2723;
    --text-secondary: #4E342E;
    --accent-gold: #D4AF37;
    --border-color: #D7CCC8;

    /* Typography */
    --font-serif: 'Merriweather', Georgia, serif;
    --font-sans: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;

    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;

    /* Borders */
    --border-radius: 8px;
    --shadow: 0 2px 8px rgba(62, 39, 35, 0.1);
}

/* ===== Reset & Base ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
    overflow: hidden;
}

body {
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.6;
    color: var(--text-primary);
    background-color: var(--bg-primary);
}

/* ===== App Layout ===== */
#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.app-header {
    background-color: var(--accent-gold);
    color: white;
    padding: var(--spacing-md);
    text-align: center;
    box-shadow: var(--shadow);
}

.app-header h1 {
    font-family: var(--font-serif);
    font-size: 1.5rem;
    font-weight: 700;
}

.main-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
    padding-bottom: calc(60px + var(--spacing-md));
}

/* ===== Loading ===== */
.loading {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary);
}

/* ===== Bottom Navigation ===== */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    background-color: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    padding: var(--spacing-sm) 0;
    box-shadow: 0 -2px 8px rgba(62, 39, 35, 0.1);
}

.nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    background: none;
    border: none;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    padding: var(--spacing-sm);
    cursor: pointer;
    transition: color 0.3s ease;
    min-width: 44px;
    min-height: 44px;
}

.nav-btn.active {
    color: var(--accent-gold);
}

.nav-icon {
    font-size: 1.5rem;
}

/* ===== Offline Banner ===== */
.offline-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #FF6B6B;
    color: white;
    text-align: center;
    padding: var(--spacing-sm);
    font-size: 0.875rem;
    z-index: 1000;
}

.hidden {
    display: none;
}

/* ===== Utility Classes ===== */
.card {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius);
    padding: var(--spacing-md);
    box-shadow: var(--shadow);
    margin-bottom: var(--spacing-md);
}

.btn-primary {
    background-color: var(--accent-gold);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    padding: var(--spacing-sm) var(--spacing-lg);
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    transition: opacity 0.3s ease;
}

.btn-primary:hover {
    opacity: 0.9;
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

**Step 3: Create database module with sql.js**

Create `public/js/database.js`:

```javascript
// Database Module - sql.js SQLite in browser

class Database {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize the database
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load sql.js
      const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('faithdive_db');

      if (savedDb) {
        // Load existing database
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uint8Array);
        console.log('📚 Loaded existing database');
      } else {
        // Create new database
        this.db = new SQL.Database();
        this.createTables();
        console.log('📚 Created new database');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  createTables() {
    // Journal entries table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS journals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL,
        verse_text TEXT NOT NULL,
        notes TEXT NOT NULL,
        book TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // Favorites table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL,
        translation TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Settings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Insert default settings
    this.db.run(`
      INSERT OR IGNORE INTO settings (key, value) VALUES
      ('translation', 'de4e12af7f28f599-02'),
      ('theme', 'light'),
      ('viewMode', 'byBook')
    `);

    this.save();
  }

  /**
   * Save database to localStorage
   */
  save() {
    const data = this.db.export();
    const buffer = Array.from(data);
    localStorage.setItem('faithdive_db', JSON.stringify(buffer));
  }

  /**
   * Run a query
   */
  exec(sql, params = []) {
    return this.db.exec(sql, params);
  }

  /**
   * Run a statement and save
   */
  run(sql, params = []) {
    this.db.run(sql, params);
    this.save();
  }

  /**
   * Get all results from a query
   */
  all(sql, params = []) {
    const results = this.db.exec(sql, params);
    if (results.length === 0) return [];

    const columns = results[0].columns;
    const values = results[0].values;

    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  /**
   * Get single result
   */
  get(sql, params = []) {
    const results = this.all(sql, params);
    return results[0] || null;
  }

  /**
   * Export database as JSON
   */
  exportData() {
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      journals: this.all('SELECT * FROM journals ORDER BY timestamp DESC'),
      favorites: this.all('SELECT * FROM favorites ORDER BY created_at DESC'),
      settings: this.all('SELECT * FROM settings')
    };
  }

  /**
   * Import database from JSON
   */
  importData(data, replace = false) {
    if (replace) {
      // Clear existing data
      this.run('DELETE FROM journals');
      this.run('DELETE FROM favorites');
    }

    // Import journals
    data.journals.forEach(journal => {
      this.run(
        'INSERT INTO journals (reference, verse_text, notes, book, timestamp) VALUES (?, ?, ?, ?, ?)',
        [journal.reference, journal.verse_text, journal.notes, journal.book, journal.timestamp]
      );
    });

    // Import favorites
    data.favorites.forEach(fav => {
      this.run(
        'INSERT INTO favorites (reference, translation, created_at) VALUES (?, ?, ?)',
        [fav.reference, fav.translation, fav.created_at]
      );
    });

    // Import settings
    if (data.settings) {
      data.settings.forEach(setting => {
        this.run(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [setting.key, setting.value]
        );
      });
    }
  }
}

// Create global database instance
window.db = new Database();

export default window.db;
```

**Step 4: Create minimal app.js**

Create `public/js/app.js`:

```javascript
// Faith Dive - Main Application

import db from './database.js';

console.log('Faith Dive App Loading...');

// Initialize database
async function initApp() {
  try {
    await db.init();
    console.log('✅ Database initialized');

    // Hide loading, show content
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div class="card"><h2>Welcome to Faith Dive!</h2><p>Database ready. UI coming soon...</p></div>';

    setupNavigation();
    setupOfflineDetection();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('main-content').innerHTML =
      '<div class="card error">Failed to load app. Please refresh.</div>';
  }
}

// Navigation handler
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const page = button.dataset.page;
      loadPage(page);
    });
  });
}

// Page loading
function loadPage(pageName) {
  const mainContent = document.getElementById('main-content');

  switch(pageName) {
    case 'search':
      mainContent.innerHTML = '<div class="card"><h2>Search</h2><p>Coming soon...</p></div>';
      break;
    case 'journal':
      mainContent.innerHTML = '<div class="card"><h2>Journal</h2><p>Coming soon...</p></div>';
      break;
    case 'favorites':
      mainContent.innerHTML = '<div class="card"><h2>Favorites</h2><p>Coming soon...</p></div>';
      break;
    case 'more':
      mainContent.innerHTML = '<div class="card"><h2>More</h2><p>Coming soon...</p></div>';
      break;
  }
}

// Offline detection
function setupOfflineDetection() {
  const banner = document.getElementById('offline-banner');

  window.addEventListener('online', () => banner.classList.add('hidden'));
  window.addEventListener('offline', () => banner.classList.remove('hidden'));
}

// Start app
initApp();
```

**Step 5: Create PWA manifest**

Create `public/manifest.json`:

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

**Step 6: Create placeholder icons**

```bash
mkdir -p public/icons
# Create placeholder files (replace with actual icons later)
touch public/icons/icon-192.png
touch public/icons/icon-512.png
```

**Step 7: Test the frontend**

Run server:
```bash
npm run dev
```

Open browser to http://localhost:3000

Expected:
- App loads with warm color scheme
- "Database initialized" in console
- Welcome message appears
- Navigation buttons work
- No console errors

**Step 8: Commit**

```bash
git add public/
git commit -m "feat: add frontend structure with sql.js database

- Create HTML structure with header and bottom nav
- Add warm & traditional CSS theme (reused from design)
- Implement sql.js database wrapper with save/load
- Create database tables for journals, favorites, settings
- Add navigation system
- Load sql.js from CDN"
```

---

*[Plan continues with remaining tasks for Search UI, Journal/Favorites, PWA features, etc. - following same pattern as original plan but adapted for Node.js/Express/sql.js stack]*

---

## Summary

This plan adapts the original Faith Dive design to use:
- **Node.js/Express** instead of Python/FastAPI
- **sql.js** (SQLite in browser) instead of LocalStorage
- Same UI/UX, colors, fonts, and features
- TDD approach with Jest
- All data stays local on user's device

The complete plan would include ~12-15 tasks total covering all features.

Would you like me to continue writing out the remaining tasks (Search UI, Journal, Favorites, Reading Plans, Dark Mode, Notifications, PWA), or shall we start implementing these first 4 tasks?
