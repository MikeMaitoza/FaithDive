# Faith Dive MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the core Bible journaling PWA with FastAPI backend, Bible search, journaling, and basic offline support.

**Architecture:** FastAPI backend proxies Bible API requests and serves static PWA files. Frontend uses vanilla HTML/CSS/JS with LocalStorage for user data. Service worker provides offline capability.

**Tech Stack:** Python 3.11+, FastAPI, Uvicorn, API.Bible (or ESV API), vanilla JavaScript, Service Worker API, LocalStorage API

---

## Phase 1: Project Setup and Backend Foundation

### Task 1: Initialize Python Project Structure

**Files:**
- Create: `backend/main.py`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `.gitignore`
- Create: `backend/config.py`

**Step 1: Create .gitignore**

Create `.gitignore` with:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
ENV/
env/

# Environment Variables
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Frontend build
frontend/dist/
node_modules/
```

**Step 2: Create requirements.txt**

Create `backend/requirements.txt`:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
httpx==0.25.1
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

**Step 3: Create environment configuration**

Create `backend/.env.example`:

```env
# Bible API Configuration
BIBLE_API_KEY=your_api_key_here
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

**Step 4: Create config module**

Create `backend/config.py`:

```python
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    bible_api_key: str
    bible_api_base_url: str = "https://api.scripture.api.bible/v1"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
```

**Step 5: Create minimal FastAPI app**

Create `backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings

app = FastAPI(
    title="Faith Dive API",
    description="Bible journaling PWA backend",
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Faith Dive API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
```

**Step 6: Create virtual environment and install dependencies**

Run:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

Expected: Dependencies installed successfully

**Step 7: Test the basic server**

Run:
```bash
cp backend/.env.example backend/.env
# Edit .env and add a placeholder API key
python -m backend.main
```

Expected: Server starts on http://localhost:8000

**Step 8: Test health endpoint**

In another terminal:
```bash
curl http://localhost:8000/api/health
```

Expected: `{"status":"healthy","service":"Faith Dive API"}`

**Step 9: Commit**

```bash
git add .gitignore backend/
git commit -m "feat: initialize FastAPI backend with health check

- Add Python dependencies (FastAPI, Uvicorn, httpx)
- Configure environment-based settings
- Add CORS middleware
- Add health check endpoint"
```

---

### Task 2: Bible API Integration Layer

**Files:**
- Create: `backend/services/__init__.py`
- Create: `backend/services/bible_api.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_bible_api.py`

**Step 1: Write failing test for Bible API client**

Create `backend/tests/test_bible_api.py`:

```python
import pytest
from backend.services.bible_api import BibleAPIClient


@pytest.mark.asyncio
async def test_get_verse_returns_verse_data():
    """Test fetching a single verse."""
    client = BibleAPIClient()
    result = await client.get_verse("John 3:16", "de4e12af7f28f599-02")

    assert result is not None
    assert "reference" in result
    assert "text" in result
    assert result["reference"] == "John 3:16"


@pytest.mark.asyncio
async def test_search_returns_results():
    """Test keyword search."""
    client = BibleAPIClient()
    results = await client.search("love", "de4e12af7f28f599-02")

    assert isinstance(results, list)
    assert len(results) > 0
    assert "reference" in results[0]
    assert "text" in results[0]
```

**Step 2: Install pytest and run test to verify it fails**

Run:
```bash
pip install pytest pytest-asyncio httpx
echo "pytest==7.4.3" >> backend/requirements.txt
echo "pytest-asyncio==0.21.1" >> backend/requirements.txt
pytest backend/tests/test_bible_api.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'backend.services.bible_api'"

**Step 3: Implement Bible API client**

Create `backend/services/__init__.py` (empty file)

Create `backend/services/bible_api.py`:

```python
import httpx
from typing import Dict, List, Optional
from backend.config import settings


class BibleAPIClient:
    """Client for interacting with Bible API."""

    def __init__(self):
        self.base_url = settings.bible_api_base_url
        self.api_key = settings.bible_api_key
        self.headers = {"api-key": self.api_key}

    async def get_verse(self, reference: str, bible_id: str) -> Optional[Dict]:
        """
        Fetch a specific verse or passage.

        Args:
            reference: Bible reference (e.g., "John 3:16")
            bible_id: Bible translation ID from API.Bible

        Returns:
            Dict with 'reference' and 'text' keys, or None if not found
        """
        async with httpx.AsyncClient() as client:
            try:
                # API.Bible uses passage endpoint
                url = f"{self.base_url}/bibles/{bible_id}/passages/{reference}"
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

                data = response.json()
                passage = data.get("data", {})

                return {
                    "reference": passage.get("reference", reference),
                    "text": passage.get("content", ""),
                    "bible_id": bible_id
                }
            except httpx.HTTPError:
                return None

    async def search(self, query: str, bible_id: str, limit: int = 10) -> List[Dict]:
        """
        Search for verses containing keywords.

        Args:
            query: Search query string
            bible_id: Bible translation ID
            limit: Maximum results to return

        Returns:
            List of dicts with 'reference' and 'text' keys
        """
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}/bibles/{bible_id}/search"
                params = {"query": query, "limit": limit}
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()

                data = response.json()
                verses = data.get("data", {}).get("verses", [])

                return [
                    {
                        "reference": verse.get("reference", ""),
                        "text": verse.get("text", "")
                    }
                    for verse in verses
                ]
            except httpx.HTTPError:
                return []

    async def get_available_bibles(self) -> List[Dict]:
        """Get list of available Bible translations."""
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}/bibles"
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

                data = response.json()
                bibles = data.get("data", [])

                return [
                    {
                        "id": bible.get("id"),
                        "name": bible.get("name"),
                        "abbreviation": bible.get("abbreviation")
                    }
                    for bible in bibles
                ]
            except httpx.HTTPError:
                return []
```

**Step 4: Run tests to verify they pass**

First, ensure you have a valid API key in `backend/.env`:
```bash
# Get free API key from https://scripture.api.bible
# Add to backend/.env:
# BIBLE_API_KEY=your_actual_key_here
```

Run:
```bash
pytest backend/tests/test_bible_api.py -v
```

Expected: PASS (both tests pass)

**Step 5: Commit**

```bash
git add backend/services/ backend/tests/
git commit -m "feat: add Bible API client with search and verse lookup

- Implement BibleAPIClient with get_verse, search, get_available_bibles
- Add comprehensive tests for API client
- Use httpx for async HTTP requests
- Handle API errors gracefully"
```

---

### Task 3: FastAPI Endpoints for Bible Data

**Files:**
- Create: `backend/routers/__init__.py`
- Create: `backend/routers/bible.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_bible_endpoints.py`

**Step 1: Write failing test for Bible endpoints**

Create `backend/tests/test_bible_endpoints.py`:

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_get_translations():
    """Test getting available Bible translations."""
    response = client.get("/api/bible/translations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_verse():
    """Test getting a specific verse."""
    response = client.get("/api/bible/verse/John%203:16?bible_id=de4e12af7f28f599-02")
    assert response.status_code == 200
    data = response.json()
    assert "reference" in data
    assert "text" in data


def test_search_verses():
    """Test searching for verses."""
    response = client.get("/api/bible/search?q=love&bible_id=de4e12af7f28f599-02")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
```

**Step 2: Run test to verify it fails**

Run:
```bash
pytest backend/tests/test_bible_endpoints.py -v
```

Expected: FAIL with 404 Not Found

**Step 3: Implement Bible router**

Create `backend/routers/__init__.py` (empty file)

Create `backend/routers/bible.py`:

```python
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.services.bible_api import BibleAPIClient

router = APIRouter(prefix="/api/bible", tags=["bible"])
bible_client = BibleAPIClient()


@router.get("/translations")
async def get_translations():
    """Get list of available Bible translations."""
    translations = await bible_client.get_available_bibles()
    if not translations:
        raise HTTPException(status_code=503, detail="Unable to fetch translations")
    return translations


@router.get("/verse/{reference}")
async def get_verse(reference: str, bible_id: str = Query(..., description="Bible translation ID")):
    """
    Get a specific Bible verse or passage.

    Args:
        reference: Bible reference (e.g., "John 3:16" or "Psalm 23")
        bible_id: Bible translation ID from API.Bible
    """
    verse = await bible_client.get_verse(reference, bible_id)
    if not verse:
        raise HTTPException(status_code=404, detail=f"Verse '{reference}' not found")
    return verse


@router.get("/search")
async def search_verses(
    q: str = Query(..., description="Search query"),
    bible_id: str = Query(..., description="Bible translation ID"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results")
):
    """
    Search for Bible verses containing keywords.

    Args:
        q: Search query string
        bible_id: Bible translation ID
        limit: Maximum number of results (1-50)
    """
    results = await bible_client.search(q, bible_id, limit)
    return results
```

**Step 4: Register router in main app**

Modify `backend/main.py` - add these lines after the app initialization:

```python
from backend.routers import bible

# Include routers
app.include_router(bible.router)
```

**Step 5: Run tests to verify they pass**

Run:
```bash
pytest backend/tests/test_bible_endpoints.py -v
```

Expected: PASS (all 3 tests pass)

**Step 6: Test manually**

Run server:
```bash
python -m backend.main
```

Test endpoints:
```bash
# Get translations
curl http://localhost:8000/api/bible/translations

# Get a verse
curl "http://localhost:8000/api/bible/verse/John%203:16?bible_id=de4e12af7f28f599-02"

# Search
curl "http://localhost:8000/api/bible/search?q=love&bible_id=de4e12af7f28f599-02"
```

Expected: All return valid JSON data

**Step 7: Commit**

```bash
git add backend/routers/ backend/main.py backend/tests/test_bible_endpoints.py
git commit -m "feat: add Bible API endpoints

- Add /api/bible/translations endpoint
- Add /api/bible/verse/{reference} endpoint
- Add /api/bible/search endpoint
- Include comprehensive endpoint tests
- Register Bible router in main app"
```

---

## Phase 2: Frontend Foundation

### Task 4: Frontend Structure and Static File Serving

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/css/style.css`
- Create: `frontend/js/app.js`
- Create: `frontend/manifest.json`
- Create: `frontend/icons/icon-192.png` (placeholder)
- Create: `frontend/icons/icon-512.png` (placeholder)
- Modify: `backend/main.py`

**Step 1: Create HTML structure**

Create `frontend/index.html`:

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
            <!-- Content will be injected here by JavaScript -->
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

    <!-- Scripts -->
    <script src="/js/app.js" type="module"></script>
</body>
</html>
```

**Step 2: Create base CSS**

Create `frontend/css/style.css`:

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

/* Dark theme will be added later */

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
    padding-bottom: calc(60px + var(--spacing-md)); /* Space for bottom nav */
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
    transform: translateY(-100%);
    transition: transform 0.3s ease;
}

.offline-banner:not(.hidden) {
    transform: translateY(0);
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

.btn-primary:active {
    opacity: 0.8;
}
```

**Step 3: Create minimal JavaScript app**

Create `frontend/js/app.js`:

```javascript
// Faith Dive - Main Application
console.log('Faith Dive App Loaded');

// Navigation handler
const navButtons = document.querySelectorAll('.nav-btn');
const mainContent = document.getElementById('main-content');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active state
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Get page name
        const page = button.dataset.page;

        // Load page content
        loadPage(page);
    });
});

// Page loading function
function loadPage(pageName) {
    console.log(`Loading page: ${pageName}`);

    switch(pageName) {
        case 'search':
            mainContent.innerHTML = '<div class="card"><h2>Bible Search</h2><p>Search functionality coming soon...</p></div>';
            break;
        case 'journal':
            mainContent.innerHTML = '<div class="card"><h2>My Journal</h2><p>Journal entries will appear here...</p></div>';
            break;
        case 'favorites':
            mainContent.innerHTML = '<div class="card"><h2>Favorites</h2><p>Your favorite verses will appear here...</p></div>';
            break;
        case 'more':
            mainContent.innerHTML = '<div class="card"><h2>More</h2><p>Settings and options...</p></div>';
            break;
        default:
            mainContent.innerHTML = '<div class="card"><p>Page not found</p></div>';
    }
}

// Load default page
loadPage('search');

// Offline detection
window.addEventListener('online', () => {
    document.getElementById('offline-banner').classList.add('hidden');
});

window.addEventListener('offline', () => {
    document.getElementById('offline-banner').classList.remove('hidden');
});
```

**Step 4: Create PWA manifest**

Create `frontend/manifest.json`:

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

**Step 5: Create placeholder icons**

Create `frontend/icons/` directory and add placeholder PNG files:
```bash
mkdir -p frontend/icons
# For now, create simple colored squares as placeholders
# You can use an online tool or ImageMagick to create these
# Example with ImageMagick:
# convert -size 192x192 xc:'#D4AF37' frontend/icons/icon-192.png
# convert -size 512x512 xc:'#D4AF37' frontend/icons/icon-512.png

# Or just create empty files for now and replace later
touch frontend/icons/icon-192.png
touch frontend/icons/icon-512.png
```

**Step 6: Configure FastAPI to serve static files**

Modify `backend/main.py` - add after the router registration:

```python
import os
from pathlib import Path

# Get frontend directory path
frontend_dir = Path(__file__).parent.parent / "frontend"

# Serve static files
app.mount("/css", StaticFiles(directory=str(frontend_dir / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(frontend_dir / "js")), name="js")
app.mount("/icons", StaticFiles(directory=str(frontend_dir / "icons")), name="icons")

# Serve manifest.json
@app.get("/manifest.json")
async def get_manifest():
    from fastapi.responses import FileResponse
    return FileResponse(str(frontend_dir / "manifest.json"))

# Serve index.html for root and any unmatched routes (SPA)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    from fastapi.responses import FileResponse
    # If path doesn't start with /api, serve index.html
    if not full_path.startswith("api"):
        return FileResponse(str(frontend_dir / "index.html"))
```

**Step 7: Test the frontend**

Run server:
```bash
python -m backend.main
```

Open browser to http://localhost:8000

Expected:
- App loads with warm color scheme
- Bottom navigation works
- Clicking navigation buttons changes content
- No console errors

**Step 8: Commit**

```bash
git add frontend/ backend/main.py
git commit -m "feat: add frontend structure and static file serving

- Create HTML structure with header and bottom nav
- Add warm & traditional CSS theme
- Implement basic page navigation with JS
- Add PWA manifest.json
- Configure FastAPI to serve static files
- Add offline detection banner"
```

---

### Task 5: Bible Search UI - Reference Lookup

**Files:**
- Create: `frontend/js/pages/search.js`
- Create: `frontend/js/services/api.js`
- Create: `frontend/js/services/storage.js`
- Modify: `frontend/js/app.js`
- Modify: `frontend/css/style.css`

**Step 1: Create API service module**

Create `frontend/js/services/api.js`:

```javascript
// API Service - handles all backend communication

const API_BASE = '/api';

/**
 * Get available Bible translations
 */
export async function getTranslations() {
    try {
        const response = await fetch(`${API_BASE}/bible/translations`);
        if (!response.ok) throw new Error('Failed to fetch translations');
        return await response.json();
    } catch (error) {
        console.error('Error fetching translations:', error);
        return [];
    }
}

/**
 * Get a specific Bible verse or passage
 */
export async function getVerse(reference, bibleId) {
    try {
        const url = `${API_BASE}/bible/verse/${encodeURIComponent(reference)}?bible_id=${bibleId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Verse not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching verse:', error);
        throw error;
    }
}

/**
 * Search for verses by keyword
 */
export async function searchVerses(query, bibleId, limit = 10) {
    try {
        const url = `${API_BASE}/bible/search?q=${encodeURIComponent(query)}&bible_id=${bibleId}&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        console.error('Error searching verses:', error);
        return [];
    }
}
```

**Step 2: Create storage service module**

Create `frontend/js/services/storage.js`:

```javascript
// LocalStorage Service - handles all client-side data storage

const STORAGE_KEYS = {
    SETTINGS: 'faithdive_settings',
    JOURNALS: 'faithdive_journals',
    FAVORITES: 'faithdive_favorites',
};

/**
 * Get settings from localStorage
 */
export function getSettings() {
    const defaults = {
        translation: 'de4e12af7f28f599-02', // KJV
        theme: 'light',
        notifications: {
            enabled: false,
            time: '08:00'
        },
        viewMode: 'byBook'
    };

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (error) {
        console.error('Error loading settings:', error);
        return defaults;
    }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

/**
 * Get journal entries from localStorage
 */
export function getJournals() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.JOURNALS);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading journals:', error);
        return [];
    }
}

/**
 * Save journal entry
 */
export function saveJournal(entry) {
    try {
        const journals = getJournals();
        journals.push(entry);
        localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
        return true;
    } catch (error) {
        console.error('Error saving journal:', error);
        return false;
    }
}

/**
 * Get favorites from localStorage
 */
export function getFavorites() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading favorites:', error);
        return [];
    }
}

/**
 * Add to favorites
 */
export function addFavorite(reference, translation) {
    try {
        const favorites = getFavorites();
        const newFavorite = {
            id: Date.now().toString(),
            reference,
            translation
        };
        favorites.push(newFavorite);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        return true;
    } catch (error) {
        console.error('Error adding favorite:', error);
        return false;
    }
}
```

**Step 3: Create search page module**

Create `frontend/js/pages/search.js`:

```javascript
// Search Page

import { getVerse, searchVerses } from '../services/api.js';
import { getSettings, addFavorite } from '../services/storage.js';

let currentVerse = null;

export function renderSearchPage() {
    const settings = getSettings();

    return `
        <div class="search-page">
            <div class="card">
                <h2>Bible Search</h2>

                <!-- Search Mode Tabs -->
                <div class="search-tabs">
                    <button class="tab-btn active" data-tab="reference">Reference</button>
                    <button class="tab-btn" data-tab="keyword">Keyword</button>
                </div>

                <!-- Reference Search -->
                <div id="reference-search" class="search-mode active">
                    <div class="form-group">
                        <label for="verse-reference">Enter Reference:</label>
                        <input
                            type="text"
                            id="verse-reference"
                            class="form-input"
                            placeholder="e.g., John 3:16 or Psalm 23"
                        >
                        <button id="lookup-btn" class="btn-primary">Look Up</button>
                    </div>
                </div>

                <!-- Keyword Search -->
                <div id="keyword-search" class="search-mode">
                    <div class="form-group">
                        <label for="keyword-input">Search by Keyword:</label>
                        <input
                            type="text"
                            id="keyword-input"
                            class="form-input"
                            placeholder="e.g., love, faith, hope"
                        >
                        <button id="search-btn" class="btn-primary">Search</button>
                    </div>
                </div>
            </div>

            <!-- Results Area -->
            <div id="search-results"></div>
        </div>
    `;
}

export function initSearchPage() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const searchModes = document.querySelectorAll('.search-mode');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            searchModes.forEach(m => m.classList.remove('active'));

            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById(`${tab}-search`).classList.add('active');
        });
    });

    // Reference lookup
    const lookupBtn = document.getElementById('lookup-btn');
    const verseInput = document.getElementById('verse-reference');

    lookupBtn.addEventListener('click', () => handleReferenceLookup());
    verseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleReferenceLookup();
    });

    // Keyword search
    const searchBtn = document.getElementById('search-btn');
    const keywordInput = document.getElementById('keyword-input');

    searchBtn.addEventListener('click', () => handleKeywordSearch());
    keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleKeywordSearch();
    });
}

async function handleReferenceLookup() {
    const reference = document.getElementById('verse-reference').value.trim();
    const resultsDiv = document.getElementById('search-results');

    if (!reference) {
        resultsDiv.innerHTML = '<div class="card error">Please enter a verse reference</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="card">Loading...</div>';

    try {
        const settings = getSettings();
        const verse = await getVerse(reference, settings.translation);
        currentVerse = verse;

        resultsDiv.innerHTML = `
            <div class="card verse-card">
                <h3>${verse.reference}</h3>
                <p class="verse-text">${verse.text}</p>
                <div class="verse-actions">
                    <button class="btn-primary" onclick="window.journalVerse()">📖 Journal This</button>
                    <button class="btn-primary" onclick="window.favoriteVerse()">⭐ Add to Favorites</button>
                </div>
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = '<div class="card error">Verse not found. Please check the reference.</div>';
    }
}

async function handleKeywordSearch() {
    const keyword = document.getElementById('keyword-input').value.trim();
    const resultsDiv = document.getElementById('search-results');

    if (!keyword) {
        resultsDiv.innerHTML = '<div class="card error">Please enter a search term</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="card">Searching...</div>';

    try {
        const settings = getSettings();
        const results = await searchVerses(keyword, settings.translation, 10);

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="card">No results found</div>';
            return;
        }

        const resultsHtml = results.map(verse => `
            <div class="card verse-result" data-reference="${verse.reference}">
                <h4>${verse.reference}</h4>
                <p class="verse-snippet">${verse.text}</p>
            </div>
        `).join('');

        resultsDiv.innerHTML = `
            <div class="search-results-list">
                <p class="results-count">Found ${results.length} results</p>
                ${resultsHtml}
            </div>
        `;

        // Add click handlers to results
        document.querySelectorAll('.verse-result').forEach(el => {
            el.addEventListener('click', async () => {
                const ref = el.dataset.reference;
                document.getElementById('verse-reference').value = ref;
                document.querySelector('[data-tab="reference"]').click();
                await handleReferenceLookup();
            });
        });
    } catch (error) {
        resultsDiv.innerHTML = '<div class="card error">Search failed. Please try again.</div>';
    }
}

// Global functions for button clicks
window.journalVerse = function() {
    if (!currentVerse) return;
    // Navigate to journal page with verse data
    console.log('Journal verse:', currentVerse);
    alert('Journaling feature coming in next task!');
};

window.favoriteVerse = function() {
    if (!currentVerse) return;
    const settings = getSettings();
    if (addFavorite(currentVerse.reference, settings.translation)) {
        alert('Added to favorites!');
    } else {
        alert('Failed to add favorite');
    }
};
```

**Step 4: Update main app.js to use modules**

Modify `frontend/js/app.js`:

```javascript
// Faith Dive - Main Application

import { renderSearchPage, initSearchPage } from './pages/search.js';

console.log('Faith Dive App Loaded');

// Navigation handler
const navButtons = document.querySelectorAll('.nav-btn');
const mainContent = document.getElementById('main-content');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active state
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Get page name
        const page = button.dataset.page;

        // Load page content
        loadPage(page);
    });
});

// Page loading function
function loadPage(pageName) {
    console.log(`Loading page: ${pageName}`);

    switch(pageName) {
        case 'search':
            mainContent.innerHTML = renderSearchPage();
            initSearchPage();
            break;
        case 'journal':
            mainContent.innerHTML = '<div class="card"><h2>My Journal</h2><p>Journal entries will appear here...</p></div>';
            break;
        case 'favorites':
            mainContent.innerHTML = '<div class="card"><h2>Favorites</h2><p>Your favorite verses will appear here...</p></div>';
            break;
        case 'more':
            mainContent.innerHTML = '<div class="card"><h2>More</h2><p>Settings and options...</p></div>';
            break;
        default:
            mainContent.innerHTML = '<div class="card"><p>Page not found</p></div>';
    }
}

// Load default page
loadPage('search');

// Offline detection
window.addEventListener('online', () => {
    document.getElementById('offline-banner').classList.add('hidden');
});

window.addEventListener('offline', () => {
    document.getElementById('offline-banner').classList.remove('hidden');
});
```

**Step 5: Add CSS for search page**

Add to `frontend/css/style.css`:

```css
/* ===== Search Page ===== */
.search-tabs {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}

.tab-btn {
    flex: 1;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-sm) var(--spacing-md);
    font-family: var(--font-sans);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tab-btn.active {
    background-color: var(--accent-gold);
    color: white;
    border-color: var(--accent-gold);
}

.search-mode {
    display: none;
}

.search-mode.active {
    display: block;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.form-group label {
    font-weight: 600;
    color: var(--text-secondary);
}

.form-input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-family: var(--font-sans);
    font-size: 1rem;
    background-color: white;
    min-height: 44px;
}

.form-input:focus {
    outline: none;
    border-color: var(--accent-gold);
}

/* ===== Verse Display ===== */
.verse-card {
    margin-top: var(--spacing-md);
}

.verse-card h3 {
    font-family: var(--font-serif);
    color: var(--accent-gold);
    margin-bottom: var(--spacing-md);
}

.verse-text {
    font-family: var(--font-serif);
    font-size: 1.125rem;
    line-height: 1.8;
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-md);
    background-color: var(--bg-primary);
    border-left: 3px solid var(--accent-gold);
}

.verse-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
}

.verse-actions .btn-primary {
    flex: 1;
    min-width: 150px;
}

/* ===== Search Results ===== */
.results-count {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
}

.verse-result {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.verse-result:hover {
    transform: translateX(4px);
}

.verse-result h4 {
    font-family: var(--font-sans);
    font-size: 1rem;
    color: var(--accent-gold);
    margin-bottom: var(--spacing-xs);
}

.verse-snippet {
    font-family: var(--font-serif);
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.6;
}

/* ===== Error Messages ===== */
.card.error {
    background-color: #FFEBEE;
    color: #C62828;
    border-left: 3px solid #C62828;
}
```

**Step 6: Test the search functionality**

Run server:
```bash
python -m backend.main
```

Open browser to http://localhost:8000 and test:
1. Reference lookup (try "John 3:16")
2. Keyword search (try "love")
3. Click on search results
4. Try "Add to Favorites" button
5. Check browser console for errors

Expected:
- Reference lookup displays verse
- Keyword search shows results
- Clicking result loads verse in reference tab
- Favorites button adds to localStorage

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: implement Bible search UI with reference and keyword modes

- Add API service module for backend communication
- Add storage service module for localStorage
- Implement reference lookup with verse display
- Implement keyword search with results list
- Add favorites functionality
- Style search interface with warm theme"
```

---

## Phase 3: Journal and Favorites Features

### Task 6: Journal Entry Creation and Viewing

**Files:**
- Create: `frontend/js/pages/journal.js`
- Modify: `frontend/js/app.js`
- Modify: `frontend/js/pages/search.js`
- Modify: `frontend/css/style.css`

**Step 1: Create journal page module**

Create `frontend/js/pages/journal.js`:

```javascript
// Journal Page

import { getJournals, saveJournal } from '../services/storage.js';

export function renderJournalPage() {
    const journals = getJournals();

    if (journals.length === 0) {
        return `
            <div class="journal-page">
                <div class="card">
                    <h2>My Journal</h2>
                    <p class="empty-state">No journal entries yet. Search for a verse and click "Journal This" to get started!</p>
                </div>
            </div>
        `;
    }

    // Group by book
    const groupedByBook = groupJournalsByBook(journals);

    let html = `
        <div class="journal-page">
            <div class="card">
                <h2>My Journal</h2>
                <p class="entry-count">${journals.length} entries</p>
            </div>
    `;

    for (const [book, entries] of Object.entries(groupedByBook)) {
        html += `
            <div class="book-group">
                <h3 class="book-header">${book} (${entries.length})</h3>
                ${entries.map(entry => renderJournalEntry(entry)).join('')}
            </div>
        `;
    }

    html += '</div>';
    return html;
}

export function initJournalPage() {
    // Add event listeners for entry actions
    document.querySelectorAll('.delete-entry-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const entryId = e.target.dataset.id;
            if (confirm('Delete this journal entry?')) {
                deleteEntry(entryId);
                // Reload page
                window.loadPage('journal');
            }
        });
    });
}

function groupJournalsByBook(journals) {
    const grouped = {};

    journals.forEach(entry => {
        const book = entry.book || extractBook(entry.reference);
        if (!grouped[book]) {
            grouped[book] = [];
        }
        grouped[book].push(entry);
    });

    return grouped;
}

function extractBook(reference) {
    // Extract book name from reference (e.g., "John 3:16" -> "John")
    const match = reference.match(/^(\d?\s?[A-Za-z]+)/);
    return match ? match[1].trim() : 'Other';
}

function renderJournalEntry(entry) {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return `
        <div class="card journal-entry">
            <div class="entry-header">
                <h4>${entry.reference}</h4>
                <span class="entry-date">${date}</span>
            </div>
            <p class="entry-verse">${entry.verseText}</p>
            <p class="entry-notes">${entry.notes}</p>
            <div class="entry-actions">
                <button class="delete-entry-btn btn-secondary" data-id="${entry.id}">Delete</button>
            </div>
        </div>
    `;
}

function deleteEntry(entryId) {
    const journals = getJournals();
    const filtered = journals.filter(entry => entry.id !== entryId);
    localStorage.setItem('faithdive_journals', JSON.stringify(filtered));
}

// Journal creation modal
export function showJournalModal(verse) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Journal Entry</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Verse Reference:</label>
                    <input type="text" id="journal-reference" class="form-input" value="${verse.reference}" readonly>
                </div>
                <div class="form-group">
                    <label>Verse Text:</label>
                    <p class="verse-text-display">${verse.text}</p>
                </div>
                <div class="form-group">
                    <label for="journal-notes">Your Reflection:</label>
                    <textarea
                        id="journal-notes"
                        class="form-textarea"
                        rows="6"
                        placeholder="Write your thoughts and reflections..."
                    ></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button class="btn-primary modal-save">Save Entry</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-save').addEventListener('click', () => {
        const notes = document.getElementById('journal-notes').value.trim();
        if (!notes) {
            alert('Please write some notes');
            return;
        }

        const entry = {
            id: Date.now().toString(),
            reference: verse.reference,
            verseText: verse.text,
            notes: notes,
            timestamp: new Date().toISOString(),
            book: extractBook(verse.reference)
        };

        if (saveJournal(entry)) {
            modal.remove();
            alert('Journal entry saved!');
        } else {
            alert('Failed to save entry');
        }
    });

    // Focus textarea
    setTimeout(() => document.getElementById('journal-notes').focus(), 100);
}
```

**Step 2: Update search.js to use journal modal**

Modify `frontend/js/pages/search.js` - replace the `window.journalVerse` function:

```javascript
import { showJournalModal } from './journal.js';

// ... existing code ...

// Global functions for button clicks
window.journalVerse = function() {
    if (!currentVerse) return;
    showJournalModal(currentVerse);
};
```

Also update the import at the top of search.js.

**Step 3: Update app.js to include journal page**

Modify `frontend/js/app.js`:

```javascript
import { renderSearchPage, initSearchPage } from './pages/search.js';
import { renderJournalPage, initJournalPage } from './pages/journal.js';

// ... existing code ...

// Make loadPage globally accessible for journal reload
window.loadPage = loadPage;

// Page loading function
function loadPage(pageName) {
    console.log(`Loading page: ${pageName}`);

    switch(pageName) {
        case 'search':
            mainContent.innerHTML = renderSearchPage();
            initSearchPage();
            break;
        case 'journal':
            mainContent.innerHTML = renderJournalPage();
            initJournalPage();
            break;
        case 'favorites':
            mainContent.innerHTML = '<div class="card"><h2>Favorites</h2><p>Your favorite verses will appear here...</p></div>';
            break;
        case 'more':
            mainContent.innerHTML = '<div class="card"><h2>More</h2><p>Settings and options...</p></div>';
            break;
        default:
            mainContent.innerHTML = '<div class="card"><p>Page not found</p></div>';
    }
}
```

**Step 4: Add CSS for journal and modal**

Add to `frontend/css/style.css`:

```css
/* ===== Journal Page ===== */
.entry-count {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.empty-state {
    text-align: center;
    color: var(--text-secondary);
    padding: var(--spacing-xl);
}

.book-group {
    margin-bottom: var(--spacing-lg);
}

.book-header {
    font-family: var(--font-serif);
    color: var(--accent-gold);
    font-size: 1.25rem;
    margin-bottom: var(--spacing-md);
    padding-left: var(--spacing-sm);
    border-left: 3px solid var(--accent-gold);
}

.journal-entry {
    margin-bottom: var(--spacing-md);
}

.entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
}

.entry-header h4 {
    font-family: var(--font-sans);
    color: var(--text-primary);
    font-size: 1rem;
}

.entry-date {
    font-size: 0.8125rem;
    color: var(--text-secondary);
}

.entry-verse {
    font-family: var(--font-serif);
    font-size: 0.9375rem;
    line-height: 1.6;
    padding: var(--spacing-sm) 0;
    margin-bottom: var(--spacing-sm);
    border-left: 2px solid var(--border-color);
    padding-left: var(--spacing-md);
    font-style: italic;
}

.entry-notes {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
}

.entry-actions {
    display: flex;
    gap: var(--spacing-sm);
}

.btn-secondary {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-sm) var(--spacing-md);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
}

/* ===== Modal ===== */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-md);
}

.modal-content {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
    font-family: var(--font-serif);
    color: var(--accent-gold);
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    width: 44px;
    height: 44px;
}

.modal-body {
    padding: var(--spacing-md);
}

.modal-footer {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
    padding: var(--spacing-md);
    border-top: 1px solid var(--border-color);
}

.form-textarea {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-family: var(--font-sans);
    font-size: 1rem;
    resize: vertical;
}

.form-textarea:focus {
    outline: none;
    border-color: var(--accent-gold);
}

.verse-text-display {
    font-family: var(--font-serif);
    font-size: 1rem;
    line-height: 1.6;
    padding: var(--spacing-md);
    background-color: var(--bg-primary);
    border-left: 3px solid var(--accent-gold);
    border-radius: var(--border-radius);
    font-style: italic;
}
```

**Step 5: Test journal functionality**

Run server and test:
1. Search for a verse (e.g., "John 3:16")
2. Click "Journal This" button
3. Write notes in the modal
4. Save the entry
5. Navigate to Journal tab
6. Verify entry appears
7. Create multiple entries for different books
8. Test delete functionality

Expected:
- Journal modal opens with verse pre-filled
- Entry saves to localStorage
- Journal page displays entries grouped by book
- Delete works correctly

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: implement journal entry creation and viewing

- Add journal creation modal with verse and notes
- Implement journal page with entries grouped by book
- Add delete functionality for entries
- Store journal entries in localStorage
- Style journal cards and modal"
```

---

### Task 7: Favorites Page

**Files:**
- Create: `frontend/js/pages/favorites.js`
- Modify: `frontend/js/app.js`
- Modify: `frontend/js/services/storage.js`
- Modify: `frontend/css/style.css`

**Step 1: Add delete favorite function to storage service**

Modify `frontend/js/services/storage.js` - add this function:

```javascript
/**
 * Remove from favorites
 */
export function removeFavorite(id) {
    try {
        const favorites = getFavorites();
        const filtered = favorites.filter(fav => fav.id !== id);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
    }
}
```

**Step 2: Create favorites page module**

Create `frontend/js/pages/favorites.js`:

```javascript
// Favorites Page

import { getFavorites, removeFavorite } from '../services/storage.js';
import { getVerse } from '../services/api.js';
import { showJournalModal } from './journal.js';

export function renderFavoritesPage() {
    const favorites = getFavorites();

    if (favorites.length === 0) {
        return `
            <div class="favorites-page">
                <div class="card">
                    <h2>Favorites</h2>
                    <p class="empty-state">No favorite verses yet. Search for a verse and click "Add to Favorites" to get started!</p>
                </div>
            </div>
        `;
    }

    let html = `
        <div class="favorites-page">
            <div class="card">
                <h2>Favorites</h2>
                <p class="entry-count">${favorites.length} favorite verses</p>
            </div>
    `;

    favorites.forEach(fav => {
        html += `
            <div class="card favorite-item" data-id="${fav.id}" data-reference="${fav.reference}" data-translation="${fav.translation}">
                <div class="favorite-header">
                    <h4>⭐ ${fav.reference}</h4>
                    <button class="delete-favorite-btn btn-icon" data-id="${fav.id}">🗑️</button>
                </div>
                <div class="favorite-actions">
                    <button class="view-favorite-btn btn-secondary" data-id="${fav.id}">View Verse</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

export function initFavoritesPage() {
    // Delete buttons
    document.querySelectorAll('.delete-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.target.dataset.id;
            if (confirm('Remove from favorites?')) {
                if (removeFavorite(id)) {
                    window.loadPage('favorites');
                }
            }
        });
    });

    // View buttons
    document.querySelectorAll('.view-favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const card = e.target.closest('.favorite-item');
            const reference = card.dataset.reference;
            const translation = card.dataset.translation;

            // Show loading
            e.target.textContent = 'Loading...';
            e.target.disabled = true;

            try {
                const verse = await getVerse(reference, translation);
                showVerseModal(verse);
            } catch (error) {
                alert('Failed to load verse');
            } finally {
                e.target.textContent = 'View Verse';
                e.target.disabled = false;
            }
        });
    });
}

function showVerseModal(verse) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${verse.reference}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p class="verse-text-display">${verse.text}</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-close-btn">Close</button>
                <button class="btn-primary modal-journal-btn">📖 Journal This</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-journal-btn').addEventListener('click', () => {
        modal.remove();
        showJournalModal(verse);
    });
}
```

**Step 3: Update app.js to include favorites page**

Modify `frontend/js/app.js`:

```javascript
import { renderSearchPage, initSearchPage } from './pages/search.js';
import { renderJournalPage, initJournalPage } from './pages/journal.js';
import { renderFavoritesPage, initFavoritesPage } from './pages/favorites.js';

// ... existing code ...

function loadPage(pageName) {
    console.log(`Loading page: ${pageName}`);

    switch(pageName) {
        case 'search':
            mainContent.innerHTML = renderSearchPage();
            initSearchPage();
            break;
        case 'journal':
            mainContent.innerHTML = renderJournalPage();
            initJournalPage();
            break;
        case 'favorites':
            mainContent.innerHTML = renderFavoritesPage();
            initFavoritesPage();
            break;
        case 'more':
            mainContent.innerHTML = '<div class="card"><h2>More</h2><p>Settings and options...</p></div>';
            break;
        default:
            mainContent.innerHTML = '<div class="card"><p>Page not found</p></div>';
    }
}
```

**Step 4: Add CSS for favorites page**

Add to `frontend/css/style.css`:

```css
/* ===== Favorites Page ===== */
.favorite-item {
    margin-bottom: var(--spacing-md);
}

.favorite-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
}

.favorite-header h4 {
    font-family: var(--font-sans);
    color: var(--text-primary);
    font-size: 1rem;
}

.btn-icon {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: var(--spacing-sm);
    min-width: 44px;
    min-height: 44px;
    border-radius: var(--border-radius);
    transition: background-color 0.3s ease;
}

.btn-icon:hover {
    background-color: var(--bg-primary);
}

.favorite-actions {
    display: flex;
    gap: var(--spacing-sm);
}
```

**Step 5: Test favorites functionality**

Run server and test:
1. Add several verses to favorites from search
2. Navigate to Favorites tab
3. Verify all favorites are listed
4. Click "View Verse" - verify modal shows verse
5. Click "Journal This" from verse modal
6. Delete a favorite - verify it's removed

Expected:
- Favorites display correctly
- View modal works
- Can journal from favorites
- Delete works

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: implement favorites page with view and delete

- Add favorites page showing all bookmarked verses
- Implement view verse modal from favorites
- Add delete functionality for favorites
- Enable journaling from favorites view
- Style favorites list"
```

---

## Phase 4: PWA Features and Polish

### Task 8: Service Worker for Offline Support

**Files:**
- Create: `frontend/sw.js`
- Modify: `frontend/index.html`
- Create: `frontend/js/sw-register.js`

**Step 1: Create service worker**

Create `frontend/sw.js`:

```javascript
// Service Worker for Faith Dive PWA

const CACHE_NAME = 'faith-dive-v1';
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/pages/search.js',
    '/js/pages/journal.js',
    '/js/pages/favorites.js',
    '/js/services/api.js',
    '/js/services/storage.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Open+Sans:wght@400;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // API requests - network first, cache fallback
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed, try cache
                    return caches.match(request);
                })
        );
        return;
    }

    // Static assets - cache first, network fallback
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((response) => {
                        // Cache new static assets
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
            })
    );
});
```

**Step 2: Create service worker registration script**

Create `frontend/js/sw-register.js`:

```javascript
// Service Worker Registration

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('[App] Service worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            if (confirm('New version available! Reload to update?')) {
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('[App] Service worker registration failed:', error);
            });
    });
}
```

**Step 3: Update index.html to include SW registration**

Modify `frontend/index.html` - add before the closing `</body>` tag:

```html
    <!-- Service Worker Registration -->
    <script src="/js/sw-register.js"></script>
</body>
```

**Step 4: Configure FastAPI to serve service worker**

Modify `backend/main.py` - add this endpoint before the catch-all route:

```python
@app.get("/sw.js")
async def get_service_worker():
    from fastapi.responses import FileResponse
    response = FileResponse(
        str(frontend_dir / "sw.js"),
        media_type="application/javascript"
    )
    # Prevent caching of service worker file
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response
```

**Step 5: Test service worker**

Run server:
```bash
python -m backend.main
```

Open browser to http://localhost:8000 and:
1. Open DevTools > Application > Service Workers
2. Verify service worker is registered
3. Check Cache Storage - verify static assets cached
4. Go offline (DevTools > Network > Offline)
5. Refresh page - verify app still loads
6. Navigate between pages - verify they work
7. Try search - verify offline message appears

Expected:
- Service worker registers successfully
- App works offline (cached pages)
- API calls gracefully fail offline
- Offline banner shows when no connection

**Step 6: Commit**

```bash
git add frontend/ backend/main.py
git commit -m "feat: add service worker for offline PWA support

- Implement service worker with caching strategies
- Cache static assets on install
- Network-first for API, cache-first for static files
- Add service worker registration
- Add update detection and prompt
- Configure no-cache headers for sw.js"
```

---

### Task 9: Settings Page and Export/Import

**Files:**
- Create: `frontend/js/pages/more.js`
- Modify: `frontend/js/app.js`
- Modify: `frontend/css/style.css`

**Step 1: Create more/settings page**

Create `frontend/js/pages/more.js`:

```javascript
// More/Settings Page

import { getSettings, saveSettings, getJournals, getFavorites } from '../services/storage.js';
import { getTranslations } from '../services/api.js';

export function renderMorePage() {
    const settings = getSettings();

    return `
        <div class="more-page">
            <div class="card">
                <h2>Settings</h2>

                <div class="setting-group">
                    <label for="translation-select">Bible Translation:</label>
                    <select id="translation-select" class="form-select">
                        <option value="">Loading...</option>
                    </select>
                </div>

                <div class="setting-group">
                    <label for="theme-select">Theme:</label>
                    <select id="theme-select" class="form-select">
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark (Coming Soon)</option>
                    </select>
                </div>
            </div>

            <div class="card">
                <h2>Data Management</h2>

                <div class="action-group">
                    <button id="export-btn" class="btn-primary">📥 Export My Data</button>
                    <p class="helper-text">Download all your journals and favorites as a backup</p>
                </div>

                <div class="action-group">
                    <button id="import-btn" class="btn-primary">📤 Import Data</button>
                    <input type="file" id="import-file" accept=".json" style="display: none;">
                    <p class="helper-text">Restore data from a backup file</p>
                </div>
            </div>

            <div class="card">
                <h2>About</h2>
                <p><strong>Faith Dive</strong></p>
                <p>Version 1.0.0</p>
                <p>A personal Bible study and journaling app</p>
            </div>
        </div>
    `;
}

export async function initMorePage() {
    // Load translations
    loadTranslations();

    // Translation change
    document.getElementById('translation-select').addEventListener('change', (e) => {
        const settings = getSettings();
        settings.translation = e.target.value;
        saveSettings(settings);
        alert('Translation updated!');
    });

    // Theme change
    document.getElementById('theme-select').addEventListener('change', (e) => {
        const settings = getSettings();
        settings.theme = e.target.value;
        saveSettings(settings);
        if (e.target.value === 'dark') {
            alert('Dark mode coming soon!');
        }
    });

    // Export
    document.getElementById('export-btn').addEventListener('click', exportData);

    // Import
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importData(file);
        }
    });
}

async function loadTranslations() {
    const settings = getSettings();
    const select = document.getElementById('translation-select');

    try {
        const translations = await getTranslations();

        select.innerHTML = translations.map(trans =>
            `<option value="${trans.id}" ${trans.id === settings.translation ? 'selected' : ''}>
                ${trans.name} (${trans.abbreviation})
            </option>`
        ).join('');
    } catch (error) {
        select.innerHTML = '<option value="">Failed to load translations</option>';
    }
}

function exportData() {
    const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        settings: getSettings(),
        journals: getJournals(),
        favorites: getFavorites()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `faithdive-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Data exported successfully!');
}

function importData(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Validate structure
            if (!data.journals || !data.favorites || !data.settings) {
                throw new Error('Invalid backup file format');
            }

            const choice = confirm(
                'Import options:\n\n' +
                'OK = Merge (keep existing + add imported)\n' +
                'Cancel = Replace (overwrite all data)\n\n' +
                'Choose wisely!'
            );

            if (choice) {
                // Merge
                mergeData(data);
            } else {
                // Replace
                if (confirm('This will DELETE all existing data. Are you sure?')) {
                    replaceData(data);
                }
            }
        } catch (error) {
            alert('Import failed: ' + error.message);
        }
    };

    reader.readAsText(file);
}

function mergeData(importedData) {
    try {
        // Merge journals
        const existingJournals = getJournals();
        const mergedJournals = [...existingJournals, ...importedData.journals];
        localStorage.setItem('faithdive_journals', JSON.stringify(mergedJournals));

        // Merge favorites
        const existingFavorites = getFavorites();
        const mergedFavorites = [...existingFavorites, ...importedData.favorites];
        localStorage.setItem('faithdive_favorites', JSON.stringify(mergedFavorites));

        // Keep existing settings (don't overwrite)

        alert('Data merged successfully!');
        window.loadPage('more');
    } catch (error) {
        alert('Merge failed: ' + error.message);
    }
}

function replaceData(importedData) {
    try {
        localStorage.setItem('faithdive_journals', JSON.stringify(importedData.journals));
        localStorage.setItem('faithdive_favorites', JSON.stringify(importedData.favorites));
        saveSettings(importedData.settings);

        alert('Data replaced successfully!');
        window.loadPage('more');
    } catch (error) {
        alert('Replace failed: ' + error.message);
    }
}
```

**Step 2: Update app.js to include more page**

Modify `frontend/js/app.js`:

```javascript
import { renderSearchPage, initSearchPage } from './pages/search.js';
import { renderJournalPage, initJournalPage } from './pages/journal.js';
import { renderFavoritesPage, initFavoritesPage } from './pages/favorites.js';
import { renderMorePage, initMorePage } from './pages/more.js';

// ... existing code ...

function loadPage(pageName) {
    console.log(`Loading page: ${pageName}`);

    switch(pageName) {
        case 'search':
            mainContent.innerHTML = renderSearchPage();
            initSearchPage();
            break;
        case 'journal':
            mainContent.innerHTML = renderJournalPage();
            initJournalPage();
            break;
        case 'favorites':
            mainContent.innerHTML = renderFavoritesPage();
            initFavoritesPage();
            break;
        case 'more':
            mainContent.innerHTML = renderMorePage();
            initMorePage();
            break;
        default:
            mainContent.innerHTML = '<div class="card"><p>Page not found</p></div>';
    }
}
```

**Step 3: Add CSS for settings page**

Add to `frontend/css/style.css`:

```css
/* ===== Settings/More Page ===== */
.setting-group {
    margin-bottom: var(--spacing-lg);
}

.setting-group label {
    display: block;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    color: var(--text-secondary);
}

.form-select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-family: var(--font-sans);
    font-size: 1rem;
    background-color: white;
    min-height: 44px;
}

.form-select:focus {
    outline: none;
    border-color: var(--accent-gold);
}

.action-group {
    margin-bottom: var(--spacing-lg);
}

.action-group .btn-primary {
    width: 100%;
    margin-bottom: var(--spacing-sm);
}

.helper-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
}
```

**Step 4: Test settings and export/import**

Run server and test:
1. Navigate to More tab
2. Verify translations load
3. Change translation setting
4. Create some journal entries
5. Click Export - verify JSON downloads
6. Clear localStorage (DevTools > Application > Storage)
7. Click Import - select exported file
8. Test both merge and replace options
9. Verify data restored correctly

Expected:
- Settings save and persist
- Export downloads valid JSON
- Import merge adds to existing data
- Import replace overwrites all data

**Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: add settings page with export and import

- Add settings page with translation selector
- Implement data export to JSON file
- Implement data import with merge/replace options
- Add data validation for imports
- Display about information
- Style settings interface"
```

---

## Phase 5: Testing and Documentation

### Task 10: Create README and Setup Documentation

**Files:**
- Create: `README.md`
- Create: `docs/SETUP.md`
- Create: `docs/API.md`

**Step 1: Create README**

Create `README.md`:

```markdown
# Faith Dive - Bible Journaling PWA

A Progressive Web App for personal Bible study and journaling. Search Bible passages, write reflective journal entries, bookmark favorite verses, and access everything offline.

## Features

- 🔍 **Dual Bible Search** - Reference lookup and keyword search
- 📖 **Personal Journaling** - Write reflections on Bible passages
- ⭐ **Favorites** - Bookmark verses for quick access
- 📱 **Mobile-First PWA** - Install on phone or desktop
- 🌐 **Offline Support** - Access saved content without internet
- 💾 **Export/Import** - Backup and restore your data
- 🎨 **Warm & Traditional UI** - Book-like aesthetic for comfortable reading

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn
- **Frontend:** Vanilla HTML/CSS/JavaScript (ES6 modules)
- **Bible Data:** API.Bible
- **Storage:** Browser LocalStorage
- **PWA:** Service Worker API

## Quick Start

### Prerequisites

- Python 3.11 or higher
- API key from [API.Bible](https://scripture.api.bible) (free)

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository-url>
   cd FaithDive
   \`\`\`

2. **Create virtual environment:**
   \`\`\`bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. **Install dependencies:**
   \`\`\`bash
   pip install -r backend/requirements.txt
   \`\`\`

4. **Configure environment:**
   \`\`\`bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your API.Bible key
   \`\`\`

5. **Run the server:**
   \`\`\`bash
   python -m backend.main
   \`\`\`

6. **Open in browser:**
   Navigate to http://localhost:8000

### Getting an API Key

1. Visit https://scripture.api.bible
2. Sign up for a free account
3. Create an API key
4. Add to `backend/.env`: `BIBLE_API_KEY=your_key_here`

## Usage

### Searching for Verses

- **By Reference:** Enter "John 3:16" or "Psalm 23" in the Reference tab
- **By Keyword:** Enter "love" or "faith" in the Keyword tab

### Creating Journal Entries

1. Search for a verse
2. Click "📖 Journal This"
3. Write your reflection
4. Click "Save Entry"

### Managing Favorites

- Click "⭐ Add to Favorites" when viewing a verse
- View all favorites in the Favorites tab
- Click "View Verse" to read again

### Export/Import Data

- **Export:** More tab → Export My Data (downloads JSON)
- **Import:** More tab → Import Data → Select file → Choose merge or replace

## Project Structure

\`\`\`
FaithDive/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── requirements.txt     # Python dependencies
│   ├── routers/
│   │   └── bible.py         # Bible API endpoints
│   ├── services/
│   │   └── bible_api.py     # Bible API client
│   └── tests/
│       ├── test_bible_api.py
│       └── test_bible_endpoints.py
├── frontend/
│   ├── index.html           # Main HTML
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   ├── css/
│   │   └── style.css        # Styles
│   ├── js/
│   │   ├── app.js           # Main application
│   │   ├── sw-register.js   # Service worker registration
│   │   ├── pages/
│   │   │   ├── search.js
│   │   │   ├── journal.js
│   │   │   ├── favorites.js
│   │   │   └── more.js
│   │   └── services/
│   │       ├── api.js       # Backend API client
│   │       └── storage.js   # LocalStorage management
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── docs/
    ├── plans/
    │   └── 2025-12-06-faith-dive-design.md
    ├── SETUP.md
    └── API.md
\`\`\`

## Development

### Running Tests

\`\`\`bash
# Backend tests
pytest backend/tests/ -v

# With coverage
pytest backend/tests/ --cov=backend --cov-report=html
\`\`\`

### Code Quality

\`\`\`bash
# Format with black
black backend/

# Lint with flake8
flake8 backend/
\`\`\`

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [API Documentation](docs/API.md) - Backend API reference
- [Design Document](docs/plans/2025-12-06-faith-dive-design.md) - Complete design spec

## Roadmap

### Completed (MVP)
- ✅ Bible search (reference + keyword)
- ✅ Journal entries with notes
- ✅ Favorites bookmarking
- ✅ Offline PWA support
- ✅ Export/import data

### Planned Features
- 📅 Reading plans
- 🔔 Daily verse notifications
- 🌙 Dark mode
- 🏷️ Tags for journal entries
- 🔍 Search within journal notes
- 📊 Study statistics

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Bible data provided by [API.Bible](https://scripture.api.bible)
- Fonts: Merriweather and Open Sans from Google Fonts
- Built with FastAPI and love

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: support@faithdive.app (placeholder)

---

**Faith Dive** - Dive deep into God's Word
\`\`\`

**Step 2: Test the complete application**

Run comprehensive tests:
```bash
# Backend tests
pytest backend/tests/ -v

# Manual frontend testing checklist:
# 1. Search by reference - works
# 2. Search by keyword - works
# 3. Create journal entry - works
# 4. View journal by book - works
# 5. Delete journal entry - works
# 6. Add favorite - works
# 7. View favorite - works
# 8. Delete favorite - works
# 9. Export data - works
# 10. Import data (merge) - works
# 11. Import data (replace) - works
# 12. Offline mode - works
# 13. PWA install - works
# 14. Service worker caching - works
```

**Step 3: Commit README**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup instructions

- Add project overview and features
- Include quick start guide
- Document project structure
- Add development guidelines
- Include roadmap and acknowledgments"
```

---

## Completion Checklist

### Backend Complete ✅
- [x] FastAPI application setup
- [x] Bible API client
- [x] Bible endpoints (translations, verse, search)
- [x] Static file serving
- [x] Service worker serving
- [x] Backend tests

### Frontend Complete ✅
- [x] HTML structure and PWA manifest
- [x] CSS styling (warm & traditional theme)
- [x] Navigation system
- [x] Search page (reference + keyword)
- [x] Journal page (create, view, delete)
- [x] Favorites page (add, view, delete)
- [x] Settings page (translation, export, import)
- [x] LocalStorage integration
- [x] Service worker (offline support)
- [x] Offline detection

### Documentation Complete ✅
- [x] Design document
- [x] Implementation plan
- [x] README with setup guide
- [x] Code organization

---

## Next Steps

After MVP completion, consider:

1. **Deploy to production** - Use services like Heroku, Railway, or Vercel
2. **Add reading plans** - Implement pre-built Bible reading plans
3. **Add notifications** - Daily verse push notifications
4. **Add dark mode** - Complete dark theme implementation
5. **Improve icons** - Replace placeholder icons with professional designs
6. **Add analytics** - Track usage patterns (privacy-preserving)
7. **Add sharing** - Share verses via clipboard or social media
8. **Optimize performance** - Lazy loading, code splitting, compression

---

**Plan complete!** Ready for execution. 🚀
