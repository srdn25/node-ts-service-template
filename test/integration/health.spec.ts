import request from 'supertest';
import { App } from '../../src/App';
import { container } from '../../src/container';
import { TYPES } from '../../src/constants/types';

let serviceInstance: App;

beforeAll(async () => {
  serviceInstance = container.get<App>(TYPES.App);
  await serviceInstance.start();
});

afterAll(async () => {
  await serviceInstance.stop();
});

describe('Health API', () => {
  describe('GET /health', () => {
    it('should return 200 and health information', async () => {
      const res = await request(serviceInstance.app.server).get('/health');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body.uptime).toHaveProperty('days');
      expect(res.body.uptime).toHaveProperty('hours');
      expect(res.body.uptime).toHaveProperty('minutes');
      expect(res.body.uptime).toHaveProperty('seconds');
      expect(res.body).toHaveProperty('mongodb');
      expect(res.body.mongodb).toHaveProperty('status');
      expect(res.body.mongodb).toHaveProperty('responseTime');
    });

    it('should return "up" status when service is healthy', async () => {
      const res = await request(serviceInstance.app.server).get('/health');

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('up');
      expect(res.body.mongodb.status).toEqual('up');
    });
  });
});

describe('Metrics API', () => {
  describe('GET /metrics', () => {
    it('should return 200 and metrics information', async () => {
      const res = await request(serviceInstance.app.server).get('/metrics');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('cpu');
      expect(res.body).toHaveProperty('mongodb');
      expect(res.body).toHaveProperty('process');

      expect(res.body.memory).toHaveProperty('heapTotal');
      expect(res.body.memory).toHaveProperty('heapUsed');
      expect(res.body.memory).toHaveProperty('rss');

      expect(res.body.process).toHaveProperty('uptime');
      expect(res.body.process.uptime).toHaveProperty('days');
      expect(res.body.process.uptime).toHaveProperty('hours');
      expect(res.body.process.uptime).toHaveProperty('minutes');
      expect(res.body.process.uptime).toHaveProperty('seconds');
      expect(res.body.process).toHaveProperty('pid');
    });

    it('should return valid metrics data', async () => {
      const res = await request(serviceInstance.app.server).get('/metrics');

      expect(res.statusCode).toEqual(200);

      expect(typeof res.body.memory.heapTotal).toBe('number');
      expect(typeof res.body.memory.heapUsed).toBe('number');
      expect(typeof res.body.process.uptime).toBe('object');
      expect(typeof res.body.process.uptime.days).toBe('number');
      expect(typeof res.body.process.uptime.hours).toBe('number');
      expect(typeof res.body.process.uptime.minutes).toBe('number');
      expect(typeof res.body.process.uptime.seconds).toBe('number');
      expect(typeof res.body.mongodb.status).toBe('string');
    });
  });
});
