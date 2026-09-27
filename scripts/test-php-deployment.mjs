import assert from 'node:assert/strict';

// Read-only checks against an Apache/PHP preview or explicitly selected deployment.
const base = process.env.PHP_SMOKE_BASE_URL;
if (!base) throw new Error('Set PHP_SMOKE_BASE_URL to the Apache/PHP website to check.');
for (const route of ['/api/health', '/api/ready', '/chi-tiet-trang-phuc/']) {
  assert.equal((await fetch(new URL(route, base))).status, 200, route);
}
for (const route of ['/api/.db-password', '/api/_config.php', '/api/_auth.php']) {
  assert.equal((await fetch(new URL(route, base))).status, 403, route);
}
assert.equal((await fetch(new URL('/api/admin/products', base))).status, 401);
const catalog = await fetch(new URL('/api/products?pageSize=1', base));
assert.equal(catalog.status, 200);
const item = (await catalog.json()).data[0];
if (item) {
  const redirect = await fetch(new URL('/trang-phuc/' + encodeURIComponent(item.slug), base), { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  const target = new URL(redirect.headers.get('location'), base);
  assert.equal(target.pathname, '/chi-tiet-trang-phuc/');
  assert.equal(target.searchParams.get('slug'), item.slug);
}
console.log('PASS Apache/PHP deployment: public routes, private files, admin authorization, detail redirect.');
