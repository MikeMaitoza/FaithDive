// Journal Module - Manage journal entries

class Journal {
  constructor() {
    this.currentEntry = null;
  }

  /**
   * Get all journal entries
   */
  getAll(sortBy = 'timestamp', order = 'DESC') {
    const validColumns = ['timestamp', 'reference', 'book'];
    const validOrders = ['ASC', 'DESC'];

    const column = validColumns.includes(sortBy) ? sortBy : 'timestamp';
    const orderDir = validOrders.includes(order) ? order : 'DESC';

    return db.all(`
      SELECT * FROM journals
      ORDER BY ${column} ${orderDir}
    `);
  }

  /**
   * Get journal entries by book
   */
  getByBook(bookName) {
    return db.all(
      'SELECT * FROM journals WHERE book = ? ORDER BY timestamp DESC',
      [bookName]
    );
  }

  /**
   * Get a single journal entry by ID
   */
  getById(id) {
    return db.get('SELECT * FROM journals WHERE id = ?', [id]);
  }

  /**
   * Create a new journal entry
   */
  create(reference, verseText, notes) {
    // Extract book name from reference
    const bookName = this.extractBookName(reference);
    const timestamp = new Date().toISOString();

    db.run(
      'INSERT INTO journals (reference, verse_text, notes, book, timestamp) VALUES (?, ?, ?, ?, ?)',
      [reference, verseText, notes, bookName, timestamp]
    );

    return {
      success: true,
      message: 'Journal entry created successfully'
    };
  }

  /**
   * Update an existing journal entry
   */
  update(id, reference, verseText, notes) {
    const bookName = this.extractBookName(reference);

    db.run(
      'UPDATE journals SET reference = ?, verse_text = ?, notes = ?, book = ? WHERE id = ?',
      [reference, verseText, notes, bookName, id]
    );

    return {
      success: true,
      message: 'Journal entry updated successfully'
    };
  }

  /**
   * Delete a journal entry
   */
  delete(id) {
    db.run('DELETE FROM journals WHERE id = ?', [id]);

    return {
      success: true,
      message: 'Journal entry deleted successfully'
    };
  }

  /**
   * Search journal entries
   */
  search(query) {
    return db.all(
      `SELECT * FROM journals
       WHERE reference LIKE ?
       OR verse_text LIKE ?
       OR notes LIKE ?
       ORDER BY timestamp DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
  }

  /**
   * Get unique book names from journal entries
   */
  getBooks() {
    return db.all('SELECT DISTINCT book FROM journals ORDER BY book');
  }

  /**
   * Extract book name from reference
   * Examples: "John 3:16" -> "John", "1 Corinthians 13:4" -> "1 Corinthians"
   */
  extractBookName(reference) {
    // Match everything before the first digit that's followed by a colon or space
    const match = reference.match(/^([^\d]*(?:\d+\s+)?[^\d]+)/);
    return match ? match[1].trim() : reference;
  }

  /**
   * Format timestamp for display
   */
  formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  /**
   * Get entry count
   */
  getCount() {
    const result = db.get('SELECT COUNT(*) as count FROM journals');
    return result ? result.count : 0;
  }
}

// Create and export global instance
window.journal = new Journal();

export default window.journal;
