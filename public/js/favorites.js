// Favorites Module - Manage favorite Bible verses

class Favorites {
  constructor() {
    // No state needed - all data in database
  }

  /**
   * Get all favorites
   * @param {string} sortBy - Column to sort by ('created_at', 'reference', 'translation')
   * @param {string} order - Sort order ('ASC' or 'DESC')
   * @returns {Array} Array of favorite objects
   */
  getAll(sortBy = 'created_at', order = 'DESC') {
    const validColumns = ['created_at', 'reference', 'translation'];
    const validOrders = ['ASC', 'DESC'];

    const column = validColumns.includes(sortBy) ? sortBy : 'created_at';
    const orderDir = validOrders.includes(order) ? order : 'DESC';

    return db.all(`
      SELECT * FROM favorites
      ORDER BY ${column} ${orderDir}
    `);
  }

  /**
   * Get favorites by translation
   * @param {string} translation - Translation ID
   * @returns {Array} Array of favorite objects
   */
  getByTranslation(translation) {
    return db.all(
      'SELECT * FROM favorites WHERE translation = ? ORDER BY created_at DESC',
      [translation]
    );
  }

  /**
   * Get a single favorite by ID
   * @param {number} id - Favorite ID
   * @returns {Object|null} Favorite object or null
   */
  getById(id) {
    return db.get('SELECT * FROM favorites WHERE id = ?', [id]);
  }

  /**
   * Check if a verse is already favorited
   * @param {string} reference - Bible reference
   * @param {string} translation - Translation ID
   * @returns {boolean} True if already favorited
   */
  isFavorite(reference, translation) {
    const result = db.get(
      'SELECT id FROM favorites WHERE reference = ? AND translation = ?',
      [reference, translation]
    );
    return result !== null;
  }

  /**
   * Create a new favorite
   * @param {string} reference - Bible reference
   * @param {string} verseText - Full verse text
   * @param {string} translation - Translation ID
   * @returns {Object} Result object
   */
  create(reference, verseText, translation) {
    // Validate required parameters
    if (!reference || !verseText || !translation) {
      return {
        success: false,
        message: 'Missing required parameters'
      };
    }

    if (this.isFavorite(reference, translation)) {
      return {
        success: false,
        message: 'This verse is already in your favorites',
        isDuplicate: true
      };
    }

    const createdAt = new Date().toISOString();

    try {
      db.run(
        'INSERT INTO favorites (reference, verse_text, translation, created_at) VALUES (?, ?, ?, ?)',
        [reference, verseText, translation, createdAt]
      );

      return {
        success: true,
        message: 'Added to favorites successfully'
      };
    } catch (error) {
      console.error('Error creating favorite:', error);
      return {
        success: false,
        message: 'Failed to add to favorites'
      };
    }
  }

  /**
   * Delete a favorite
   * @param {number} id - Favorite ID
   * @returns {Object} Result object
   */
  delete(id) {
    // Validate ID parameter
    if (!id || typeof id !== 'number') {
      return {
        success: false,
        message: 'Invalid favorite ID'
      };
    }

    // Check if favorite exists
    const favorite = this.getById(id);
    if (!favorite) {
      return {
        success: false,
        message: 'Favorite not found'
      };
    }

    try {
      db.run('DELETE FROM favorites WHERE id = ?', [id]);

      return {
        success: true,
        message: 'Removed from favorites successfully'
      };
    } catch (error) {
      console.error('Error deleting favorite:', error);
      return {
        success: false,
        message: 'Failed to remove from favorites'
      };
    }
  }

  /**
   * Get total count
   * @returns {number} Count
   */
  getCount() {
    const result = db.get('SELECT COUNT(*) as count FROM favorites');
    return result ? result.count : 0;
  }

  /**
   * Format date for display
   * @param {string} isoString - ISO date
   * @returns {string} Formatted date
   */
  formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get translation display name
   * @param {string} translationId - Translation ID
   * @returns {string} Display name
   */
  getTranslationDisplayName(translationId) {
    const knownTranslations = {
      'de4e12af7f28f599-02': 'KJV',
      'de4e12af7f28f599-01': 'ASV',
      '9879dbb7cfe39e4d-01': 'WEB'
    };

    return knownTranslations[translationId] || translationId.substring(0, 8);
  }
}

// Create and export global instance
window.favorites = new Favorites();

export default window.favorites;
