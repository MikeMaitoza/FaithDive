// Mock node-fetch before importing the service
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

const BibleApiService = require('../services/bibleApi');

describe('BibleApiService', () => {
  let service;

  beforeEach(() => {
    service = new BibleApiService('test-api-key');
    mockFetch.mockClear();
  });

  describe('getVerse', () => {
    it('should fetch a verse successfully', async () => {
      const mockResponse = {
        data: {
          reference: 'John 3:16',
          content: 'For God so loved the world...'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.getVerse('John 3:16', 'test-bible-id');

      expect(result).toEqual({
        reference: 'John 3:16',
        text: 'For God so loved the world...',
        bibleId: 'test-bible-id'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/passages/John%203%3A16'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'api-key': 'test-api-key'
          })
        })
      );
    });

    it('should return null on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await service.getVerse('Invalid 99:99', 'test-bible-id');

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const mockResponse = {
        data: {
          verses: [
            { reference: 'John 3:16', text: 'For God so loved...' },
            { reference: '1 John 4:8', text: 'God is love' }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await service.search('love', 'test-bible-id', 10);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        reference: 'John 3:16',
        text: 'For God so loved...'
      });
    });
  });

  describe('getAvailableBibles', () => {
    it('should return list of Bibles', async () => {
      const mockResponse = {
        data: [
          { id: 'KJV', name: 'King James Version', abbreviation: 'KJV' },
          { id: 'ESV', name: 'English Standard Version', abbreviation: 'ESV' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await service.getAvailableBibles();

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'KJV',
        name: 'King James Version',
        abbreviation: 'KJV'
      });
    });
  });
});
