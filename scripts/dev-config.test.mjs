import assert from 'node:assert/strict';
import { test } from 'node:test';
import { developmentEnvironment } from './dev-config.mjs';

test('PHP development inherits the existing local database without using Apache port 8080', () => {
  const env = developmentEnvironment({ DATABASE_URL: 'mysql://shop:pass%23word@127.0.0.1:3307/catalog?connection_limit=5' });
  assert.equal(env.PHP_API_ORIGIN, 'http://127.0.0.1:8787');
  assert.equal(env.DB_PORT, '3307');
  assert.equal(env.DB_NAME, 'catalog');
  assert.equal(env.DB_PASSWORD, 'pass#word');
  assert.equal(env.APP_ORIGIN, 'http://localhost:3000');
});
test('explicit PHP database settings take precedence over old environment variables', () => {
  const env = developmentEnvironment({ DATABASE_URL: 'mysql://old:old@localhost/old', DB_NAME: 'current', DB_PASSWORD: 'current', PHP_API_ORIGIN: 'http://127.0.0.1:9000' });
  assert.equal(env.DB_NAME, 'current');
  assert.equal(env.DB_PASSWORD, 'current');
  assert.equal(env.PHP_API_ORIGIN, 'http://127.0.0.1:9000');
});
