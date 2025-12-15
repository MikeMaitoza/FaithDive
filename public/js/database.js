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
