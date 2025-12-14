const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      status: 'healthy',
      service: 'Faith Dive API'
    });
  });
});
