// Create mock service instance that will be used by the router
const mockService = {
  getAvailableBibles: jest.fn(),
  getVerse: jest.fn(),
  search: jest.fn()
};

// Mock the Bible API service BEFORE requiring the router
jest.mock('../services/bibleApi', () => {
  return jest.fn().mockImplementation(() => mockService);
});

const request = require('supertest');
const express = require('express');
const bibleRouter = require('../routes/bible');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/bible', bibleRouter);

describe('Bible Routes', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockService.getAvailableBibles.mockClear();
    mockService.getVerse.mockClear();
    mockService.search.mockClear();
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
