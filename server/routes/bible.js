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

    res.json({
      verses: results,
      total: results.length
    });
  } catch (error) {
    console.error('Error in /search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
