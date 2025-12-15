# Faith Dive - Bible Journaling PWA

A beautiful, offline-capable Progressive Web App for personal Bible study and journaling. Search Scripture, write reflections, and grow in your faith journey.

## Features

### 🔍 Bible Search
- **Reference Search**: Look up specific verses (e.g., "John 3:16", "Psalm 23")
- **Keyword Search**: Find verses containing specific words or phrases
- **Multiple Translations**: Access hundreds of Bible translations via API.Bible
- **Instant Results**: Fast, responsive search with beautiful formatting

### 📖 Journal
- **Create Entries**: Save Bible verses with your personal reflections
- **Full CRUD**: Create, read, update, and delete journal entries
- **Organized Display**: View all entries sorted by date
- **Rich Text**: Preserve formatting in your notes

### 🌙 Dark Mode
- **Theme Toggle**: Switch between light and dark modes
- **Persistent Preference**: Your theme choice is saved
- **Beautiful Design**: Both themes feature warm, traditional aesthetics
- **Optimized Contrast**: Easy on the eyes in any lighting condition

### 💾 Data Management
- **Export Backup**: Download all your data as JSON
- **Import Data**: Restore from backup files
- **Complete Privacy**: All data stored locally in your browser
- **Offline Capable**: Works without internet connection

### 📱 Progressive Web App
- **Installable**: Add to your home screen on mobile devices
- **Responsive Design**: Works perfectly on phones, tablets, and desktops
- **Fast Loading**: Optimized performance
- **Mobile-First**: Designed primarily for on-the-go use

## Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables
- **JavaScript (ES6+)**: Modular, clean code
- **sql.js**: SQLite database in the browser

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **API.Bible**: Bible text provider

### Database
- **sql.js**: Client-side SQLite for local storage
- **LocalStorage**: Persistent data storage in browser

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- API.Bible API key (free at https://scripture.api.bible)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MikeMaitoza/FaithDive.git
   cd FaithDive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API.Bible key:
   ```env
   BIBLE_API_KEY=your_api_key_here
   BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Searching for Verses

**Reference Search:**
1. Click the 🔍 Search tab
2. Enter a Bible reference (e.g., "John 3:16", "Genesis 1:1-3")
3. Click "Search" or press Enter
4. View the verse with options to add to journal or favorites

**Keyword Search:**
1. Click the 🔍 Search tab
2. Toggle to "Keyword" mode
3. Enter words to search for (e.g., "love", "faith")
4. Browse results with full context

### Creating Journal Entries

**From Search Results:**
1. Search for a verse
2. Click "📖 Add to Journal"
3. Write your thoughts and reflections
4. Click "Save Entry"

**Manual Entry:**
1. Click the 📖 Journal tab
2. Click "➕ New Entry"
3. Fill in reference, verse text, and notes
4. Click "Save Entry"

### Enabling Dark Mode

1. Click the ⋯ More tab
2. Toggle the 🌙 Dark Mode switch
3. Your preference is automatically saved

### Backing Up Your Data

**Export:**
1. Go to Settings (⋯ More tab)
2. Click "📤 Export All Data"
3. Save the JSON file

**Import:**
1. Go to Settings (⋯ More tab)
2. Click "📥 Import Data"
3. Select your backup JSON file

## Project Structure

```
FaithDive/
├── public/                 # Frontend files
│   ├── css/
│   │   └── style.css      # All styling with CSS variables
│   ├── icons/
│   │   └── icon.svg       # App icon
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── bibleSearch.js # Bible API integration
│   │   ├── database.js    # sql.js wrapper
│   │   ├── journal.js     # Journal management
│   │   └── theme.js       # Theme switching
│   ├── index.html         # Main HTML file
│   └── manifest.json      # PWA manifest
├── server/                # Backend files
│   ├── __tests__/        # Test files
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── config.js         # Configuration
│   └── index.js          # Server entry point
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
└── README.md           # This file
```

## Development

### Running Tests
```bash
npm test
```

### Running with Auto-Reload
```bash
npm run dev
```

### Production Build
```bash
npm start
```

## Database Schema

### journals
- `id`: INTEGER PRIMARY KEY
- `reference`: TEXT (e.g., "John 3:16")
- `verse_text`: TEXT (the verse content)
- `notes`: TEXT (user's reflections)
- `book`: TEXT (extracted book name)
- `timestamp`: TEXT (ISO date string)

### favorites
- `id`: INTEGER PRIMARY KEY
- `reference`: TEXT
- `translation`: TEXT (Bible version ID)
- `created_at`: TEXT

### settings
- `key`: TEXT PRIMARY KEY
- `value`: TEXT

## Color Scheme

### Light Mode (Default)
- Primary Background: `#F5F5DC` (Cream)
- Secondary Background: `#FFF8E7` (Lighter Cream)
- Primary Text: `#3E2723` (Dark Brown)
- Accent: `#D4AF37` (Gold)

### Dark Mode
- Primary Background: `#1A1410` (Deep Brown)
- Secondary Background: `#2A2118` (Lighter Brown)
- Primary Text: `#E8DCC8` (Warm Cream)
- Accent: `#E8C547` (Bright Gold)

## API Integration

This app uses [API.Bible](https://scripture.api.bible) for Bible text retrieval:
- 573+ Bible translations available
- Multiple languages supported
- RESTful API with comprehensive documentation
- Free tier available for personal use

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Privacy

Faith Dive prioritizes your privacy:
- ✅ All data stored locally in your browser
- ✅ No user accounts required
- ✅ No data sent to external servers (except Bible API requests)
- ✅ No tracking or analytics
- ✅ Works completely offline after first load

## Roadmap

- [ ] Favorites management
- [ ] Reading plans
- [ ] Daily verse notifications
- [ ] Service worker for offline caching
- [ ] Cross-reference lookup
- [ ] Verse comparison between translations
- [ ] Tags/categories for journal entries
- [ ] Share verses as images

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Bible text provided by [API.Bible](https://scripture.api.bible)
- Built with ❤️ for personal Bible study and spiritual growth
- Developed with assistance from [Claude Code](https://claude.com/claude-code)

## Support

For questions or support, please open an issue on GitHub.

---

**Faith Dive** - Dive deeper into God's Word 🙏
