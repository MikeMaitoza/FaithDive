// Bible Search Module

/**
 * Book name to API.Bible code mapping
 */
const BOOK_CODES = {
  // Old Testament
  'genesis': 'GEN', 'gen': 'GEN',
  'exodus': 'EXO', 'exo': 'EXO', 'exod': 'EXO',
  'leviticus': 'LEV', 'lev': 'LEV',
  'numbers': 'NUM', 'num': 'NUM',
  'deuteronomy': 'DEU', 'deut': 'DEU', 'deu': 'DEU',
  'joshua': 'JOS', 'josh': 'JOS', 'jos': 'JOS',
  'judges': 'JDG', 'judg': 'JDG', 'jdg': 'JDG',
  'ruth': 'RUT', 'rut': 'RUT',
  '1 samuel': '1SA', '1sam': '1SA', '1 sam': '1SA',
  '2 samuel': '2SA', '2sam': '2SA', '2 sam': '2SA',
  '1 kings': '1KI', '1ki': '1KI',
  '2 kings': '2KI', '2ki': '2KI',
  '1 chronicles': '1CH', '1chr': '1CH', '1 chr': '1CH',
  '2 chronicles': '2CH', '2chr': '2CH', '2 chr': '2CH',
  'ezra': 'EZR', 'ezr': 'EZR',
  'nehemiah': 'NEH', 'neh': 'NEH',
  'esther': 'EST', 'est': 'EST',
  'job': 'JOB',
  'psalms': 'PSA', 'psalm': 'PSA', 'psa': 'PSA', 'ps': 'PSA',
  'proverbs': 'PRO', 'prov': 'PRO', 'pro': 'PRO',
  'ecclesiastes': 'ECC', 'eccl': 'ECC', 'ecc': 'ECC',
  'song of solomon': 'SNG', 'song': 'SNG', 'sng': 'SNG',
  'isaiah': 'ISA', 'isa': 'ISA',
  'jeremiah': 'JER', 'jer': 'JER',
  'lamentations': 'LAM', 'lam': 'LAM',
  'ezekiel': 'EZK', 'ezek': 'EZK', 'ezk': 'EZK',
  'daniel': 'DAN', 'dan': 'DAN',
  'hosea': 'HOS', 'hos': 'HOS',
  'joel': 'JOL', 'joe': 'JOL',
  'amos': 'AMO', 'amo': 'AMO',
  'obadiah': 'OBA', 'obad': 'OBA', 'oba': 'OBA',
  'jonah': 'JON', 'jon': 'JON',
  'micah': 'MIC', 'mic': 'MIC',
  'nahum': 'NAM', 'nah': 'NAM', 'nam': 'NAM',
  'habakkuk': 'HAB', 'hab': 'HAB',
  'zephaniah': 'ZEP', 'zeph': 'ZEP', 'zep': 'ZEP',
  'haggai': 'HAG', 'hag': 'HAG',
  'zechariah': 'ZEC', 'zech': 'ZEC', 'zec': 'ZEC',
  'malachi': 'MAL', 'mal': 'MAL',

  // New Testament
  'matthew': 'MAT', 'matt': 'MAT', 'mat': 'MAT', 'mt': 'MAT',
  'mark': 'MRK', 'mrk': 'MRK', 'mk': 'MRK',
  'luke': 'LUK', 'luk': 'LUK', 'lk': 'LUK',
  'john': 'JHN', 'jhn': 'JHN', 'jn': 'JHN',
  'acts': 'ACT', 'act': 'ACT',
  'romans': 'ROM', 'rom': 'ROM',
  '1 corinthians': '1CO', '1cor': '1CO', '1 cor': '1CO',
  '2 corinthians': '2CO', '2cor': '2CO', '2 cor': '2CO',
  'galatians': 'GAL', 'gal': 'GAL',
  'ephesians': 'EPH', 'eph': 'EPH',
  'philippians': 'PHP', 'phil': 'PHP', 'php': 'PHP',
  'colossians': 'COL', 'col': 'COL',
  '1 thessalonians': '1TH', '1thess': '1TH', '1 thess': '1TH',
  '2 thessalonians': '2TH', '2thess': '2TH', '2 thess': '2TH',
  '1 timothy': '1TI', '1tim': '1TI', '1 tim': '1TI',
  '2 timothy': '2TI', '2tim': '2TI', '2 tim': '2TI',
  'titus': 'TIT', 'tit': 'TIT',
  'philemon': 'PHM', 'phlm': 'PHM', 'phm': 'PHM',
  'hebrews': 'HEB', 'heb': 'HEB',
  'james': 'JAS', 'jas': 'JAS', 'jas': 'JAS',
  '1 peter': '1PE', '1pet': '1PE', '1 pet': '1PE',
  '2 peter': '2PE', '2pet': '2PE', '2 pet': '2PE',
  '1 john': '1JN', '1jn': '1JN',
  '2 john': '2JN', '2jn': '2JN',
  '3 john': '3JN', '3jn': '3JN',
  'jude': 'JUD', 'jud': 'JUD',
  'revelation': 'REV', 'rev': 'REV'
};

class BibleSearch {
  constructor() {
    this.apiBaseUrl = '/api/bible';
  }

  /**
   * Parse user-friendly reference to API.Bible format
   * Examples:
   *   "John 3:16" -> "JHN.3.16"
   *   "Genesis 1:1-3" -> "GEN.1.1-GEN.1.3"
   *   "Psalm 23" -> "PSA.23"
   */
  parseReference(reference) {
    // Clean up the input
    const cleaned = reference.trim().toLowerCase();

    // Match patterns like "John 3:16" or "Genesis 1:1-3"
    const match = cleaned.match(/^([\d\s]*[a-z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);

    if (!match) {
      throw new Error('Invalid reference format. Use format like "John 3:16" or "Genesis 1:1-3"');
    }

    const bookName = match[1].trim().toLowerCase();
    const chapter = match[2];
    const verseStart = match[3];
    const verseEnd = match[4];

    // Look up book code
    const bookCode = BOOK_CODES[bookName];
    if (!bookCode) {
      throw new Error(`Unknown book: ${bookName}`);
    }

    // Build API.Bible reference
    let apiReference = `${bookCode}.${chapter}`;

    if (verseStart) {
      apiReference += `.${verseStart}`;

      if (verseEnd) {
        apiReference += `-${bookCode}.${chapter}.${verseEnd}`;
      }
    }

    return apiReference;
  }

  /**
   * Search for a verse by reference
   */
  async searchByReference(reference) {
    try {
      const apiReference = this.parseReference(reference);
      const bibleId = await this.getPreferredTranslation();

      const response = await fetch(
        `${this.apiBaseUrl}/verse/${encodeURIComponent(apiReference)}?bible_id=${bibleId}`
      );

      if (!response.ok) {
        throw new Error('Verse not found');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching by reference:', error);
      throw error;
    }
  }

  /**
   * Search for verses by keyword
   */
  async searchByKeyword(query, limit = 20) {
    try {
      const bibleId = await this.getPreferredTranslation();

      const response = await fetch(
        `${this.apiBaseUrl}/search?q=${encodeURIComponent(query)}&bible_id=${bibleId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching by keyword:', error);
      throw error;
    }
  }

  /**
   * Get available Bible translations
   */
  async getTranslations() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/translations`);

      if (!response.ok) {
        throw new Error('Failed to fetch translations');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching translations:', error);
      throw error;
    }
  }

  /**
   * Get preferred translation from database settings
   */
  async getPreferredTranslation() {
    const setting = db.get('SELECT value FROM settings WHERE key = ?', ['translation']);
    return setting ? setting.value : 'de4e12af7f28f599-02'; // Default to KJV
  }

  /**
   * Set preferred translation
   */
  async setPreferredTranslation(bibleId) {
    db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['translation', bibleId]
    );
  }
}

// Create and export global instance
window.bibleSearch = new BibleSearch();

export default window.bibleSearch;
