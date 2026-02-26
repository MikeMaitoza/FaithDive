# Faith Dive

A personal, offline-capable Bible study PWA. Search Scripture, journal reflections, save favorites — all stored locally in your browser.

## Tech Stack

- **Frontend:** Vanilla JS (ES6 modules), HTML5, CSS3 with custom properties
- **Backend:** Node.js + Express.js (static file server + API proxy)
- **Database:** sql.js (SQLite compiled to WebAssembly, runs in the browser)
- **Bible Data:** API.Bible (proxied through Express to protect the API key)
- **Caching:** Service worker with stale-while-revalidate strategy
- **Testing:** Jest + supertest

## Setup

```bash
git clone https://github.com/MikeMaitoza/FaithDive.git
cd FaithDive
npm install
cp .env.example .env
# Add your API.Bible key to .env (free at https://scripture.api.bible)
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Production server |
| `npm run dev` | Development with auto-reload (nodemon) |
| `npm test` | Run all tests with coverage |
| `npm run test:watch` | Watch mode for development |

## Project Structure

```
FaithDive/
├── public/                 # Frontend (served directly, no build step)
│   ├── css/style.css       # Styling with CSS variables
│   ├── js/                 # ES6 modules
│   │   ├── app.js          # Main app logic, routing, SW registration
│   │   ├── bibleSearch.js  # Bible API integration
│   │   ├── database.js     # sql.js wrapper
│   │   ├── favorites.js    # Favorites management
│   │   ├── journal.js      # Journal CRUD
│   │   └── theme.js        # Light/dark theme toggle
│   ├── index.html          # Single-page app shell
│   ├── sw.js               # Service worker (offline caching)
│   └── manifest.json       # PWA manifest
├── server/
│   ├── __tests__/          # All tests
│   ├── routes/bible.js     # Bible search API proxy
│   ├── services/bibleApi.js # API.Bible client
│   ├── config.js           # Environment config
│   └── index.js            # Express entry point
└── package.json
```

## Architecture

No build step. The frontend is vanilla JS served directly from `public/`. Each module in `public/js/` handles one concern and is imported by `app.js`.

All user data (journal entries, favorites, settings) lives in a sql.js SQLite database in the browser. Nothing leaves the device except Bible search queries, which are proxied through Express to keep the API key server-side.

The service worker caches all static assets on install and uses a stale-while-revalidate strategy for subsequent requests. API requests (`/api/*`) are excluded from caching.

## License

[MIT](LICENSE)

Developed by Mike Maitoza with assistance from [Claude Code](https://claude.com/claude-code).
