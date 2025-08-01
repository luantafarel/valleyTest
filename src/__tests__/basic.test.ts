import request from 'supertest';
import express from 'express';
import aiRoutes from '../routes/aiRoutes';
import { aiService } from '../services/aiService';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRoutes);
  app.get('/health', (req, res) => res.json({ status: 'OK' }));
  return app;
};

describe('API Endpoints', () => {
  let app: express.Application;
  beforeEach(() => { app = createTestApp(); });

  it('health check should return OK', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body.status).toBe('OK');
  });

  it('AI status should return configuration status', async () => {
    const response = await request(app).get('/api/ai/status').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('configured');
    expect(response.body.data).toHaveProperty('status');
  });

  it('generate-sequence should require prospect_url and company_context', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({})
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('prospect_url and company_context required');
  });

  it('generate-sequence should work with valid input', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        prospect_url: 'https://linkedin.com/in/john-doe',
        company_context: 'We help SaaS companies automate sales',
        sequence_length: 2
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('messages');
    expect(response.body.data).toHaveProperty('thinking_process');
    expect(response.body.data).toHaveProperty('confidence_scores');
    expect(response.body.data).toHaveProperty('prospect_analysis');
    expect(Array.isArray(response.body.data.messages)).toBe(true);
  });

  it('generate-sequence should handle invalid URLs gracefully', async () => {
    const response = await request(app)
      .post('/api/ai/generate-sequence')
      .send({
        prospect_url: 'invalid-url',
        company_context: 'Test company'
      })
      .expect(200);
    
            expect(response.body.success).toBe(true);
        expect(response.body.data.prospect_analysis.name).toBe('Professional');
  });
});

describe('LinkedIn Name Extraction', () => {
  it('should extract names from LinkedIn HTML content', () => {
    const service = aiService as any;
    
    const mockHtml1 = '<title>John Doe | LinkedIn</title>';
    expect(service.extractName(mockHtml1)).toBe('John Doe');
    
    const mockHtml2 = '<h1 class="text-heading-xlarge">Jane Smith</h1>';
    expect(service.extractName(mockHtml2)).toBe('Jane Smith');
    
    const mockHtml3 = '<meta property="og:title" content="Maria Silva - Software Engineer">';
    expect(service.extractName(mockHtml3)).toBe('Maria Silva - Software Engineer');
    
    expect(service.extractName('<invalid>test</invalid>')).toBe(undefined);
  });
});

describe('AI Service Configuration', () => {
  it('should check if AI service is configured', () => {
    const isConfigured = aiService.isConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });
});