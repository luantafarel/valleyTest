import request from 'supertest';
import express from 'express';
import aiRoutes from '../routes/aiRoutes';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRoutes);
  return app;
};

describe('Edge Cases and Error Handling', () => {
  let app: express.Application;
  beforeEach(() => { app = createTestApp(); });

  it('should handle very long company context', async () => {
    const longContext = 'A'.repeat(1000);
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        prospect_url: 'https://linkedin.com/in/test',
        company_context: longContext,
        sequence_length: 1
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  it('should handle zero sequence length', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        prospect_url: 'https://linkedin.com/in/test',
        company_context: 'Test',
        sequence_length: 0
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.messages)).toBe(true);
  });

  it('should handle extreme tone values', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        prospect_url: 'https://linkedin.com/in/test',
        company_context: 'Test',
        tov_config: {
          formality: 999,
          warmth: -100,
          directness: 1.5
        }
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  it('should handle malformed JSON gracefully', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .set('Content-Type', 'application/json')
      .send('{"invalid": json}')
      .expect(400);
  });

  it('should handle missing content-type header', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send('prospect_url=test&company_context=test')
      .expect(400);
  });

  it('should handle various LinkedIn URL formats', async () => {
    const urls = [
      'https://linkedin.com/in/test',
      'http://linkedin.com/in/test',
      'https://www.linkedin.com/in/test',
      'https://linkedin.com/in/test/',
      'https://linkedin.com/in/test?param=value',
      'linkedin.com/in/test'
    ];

    for (const url of urls) {
      const response = await request(app)
        .post('/api/ai/generate-sequence')
        .send({
          prospect_url: url,
          company_context: 'Test'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    }
  });

  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 5 }, () => 
      request(app)
        .post('/api/ai/generate-sequence')
        .send({
          prospect_url: 'https://linkedin.com/in/concurrent-test',
          company_context: 'Concurrent test'
        })
    );

    const responses = await Promise.all(requests);
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Input Validation', () => {
  let app: express.Application;
  beforeEach(() => { app = createTestApp(); });

  it('should require prospect_url', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        company_context: 'Test'
      })
      .expect(400);
    
    expect(response.body.error).toContain('prospect_url and company_context required');
  });

  it('should require company_context', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        prospect_url: 'https://linkedin.com/in/test'
      })
      .expect(400);
    
    expect(response.body.error).toContain('prospect_url and company_context required');
  });

  it('should use default sequence_length when not provided', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        prospect_url: 'https://linkedin.com/in/test',
        company_context: 'Test'
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.messages.length).toBeGreaterThan(0);
  });
});