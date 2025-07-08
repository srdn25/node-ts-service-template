import request from 'supertest';
import { App } from '../../src/App';
import { container } from '../../src/container';
import { TYPES } from '../../src/constants/types';
import { TConfig } from '../../src/types/container';

let serviceInstance: App;
let config: TConfig;

beforeAll(async () => {
  serviceInstance = container.get<App>(TYPES.App);
  config = container.get<TConfig>(TYPES.Config);
  await serviceInstance.start();
});

afterAll(async () => {
  await serviceInstance.stop();
});

describe('Swagger Documentation', () => {
  describe('GET /docs', () => {
    it('should return 200 and HTML content without authentication', async () => {
      const res = await request(serviceInstance.app.server).get(
        `${config.values.SWAGGER_PATH}/`,
      );

      expect(res.statusCode).toEqual(200);
      expect(res.type).toBe('text/html');
      expect(res.text).toContain('swagger-ui');
    });

    it('should return 200 for swagger.json without authentication', async () => {
      const res = await request(serviceInstance.app.server).get(
        `${config.values.SWAGGER_PATH}/json`,
      );

      expect(res.statusCode).toEqual(200);
      expect(res.type).toBe('application/json');
      expect(res.body).toHaveProperty('swagger');
      expect(res.body).toHaveProperty('info');
      expect(res.body).toHaveProperty('paths');
      expect(res.body.info).toHaveProperty('title', 'Service Template API');
    });

    it('should include health and metrics endpoints in documentation', async () => {
      const res = await request(serviceInstance.app.server).get(
        `${config.values.SWAGGER_PATH}/json`,
      );

      expect(res.body.paths).toHaveProperty('/health');
      expect(res.body.paths).toHaveProperty('/metrics');
      expect(res.body.paths['/health']).toHaveProperty('get');
      expect(res.body.paths['/metrics']).toHaveProperty('get');
    });

    it('should include authentication endpoints in documentation', async () => {
      const res = await request(serviceInstance.app.server).get(
        `${config.values.SWAGGER_PATH}/json`,
      );

      expect(res.body.paths).toHaveProperty('/register');
      expect(res.body.paths).toHaveProperty('/login');
      expect(res.body.paths['/register']).toHaveProperty('post');
      expect(res.body.paths['/login']).toHaveProperty('post');
    });
  });
});
