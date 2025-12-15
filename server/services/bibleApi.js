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
