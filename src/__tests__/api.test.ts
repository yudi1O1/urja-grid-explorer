import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Basic API Endpoints', () => {
  it('GET /health should return 200 { status: "ok" }', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /api/meters?page=abc should return 400 INVALID_PAGE', async () => {
    const response = await request(app).get('/api/meters?page=abc');
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('INVALID_PAGE');
  });

  it('GET /api/meters?page=0 should return 400 INVALID_PAGE', async () => {
    const response = await request(app).get('/api/meters?page=0');
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('INVALID_PAGE');
  });

  it('GET /api/meters?q=abc&q=def should return 400 INVALID_QUERY for repeated parameters', async () => {
    const response = await request(app).get('/api/meters?q=abc&q=def');
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('INVALID_QUERY');
  });
});
