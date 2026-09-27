import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { developmentEnvironment } from './dev-config.mjs';

if (existsSync('.env')) loadEnvFile('.env');
const env = developmentEnvironment(process.env);
const origin = new URL(env.PHP_API_ORIGIN);
if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error('PHP_API_ORIGIN must be a local HTTP origin, for example http://127.0.0.1:8787');
}
const port = Number(origin.port || 80);
const probe = net.createServer();
await new Promise((resolve, reject) => {
  probe.once('error', () => reject(new Error(`PHP port ${port} is already in use. Stop the other service or set PHP_API_ORIGIN to a free port.`)));
  probe.listen(port, origin.hostname, resolve);
});
await new Promise(resolve => probe.close(resolve));

const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill();
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
function launch(command, args) {
  const child = spawn(command, args, { env, stdio: 'inherit' });
  children.push(child);
  child.on('error', error => { console.error(`Cannot start ${command}: ${error.message}`); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
  return child;
}
launch(env.PHP_BINARY || 'php', ['-S', `${origin.hostname}:${port}`, '-t', 'public', 'scripts/php-router.php']);
try {
  let ready = false;
  for (let i = 0; i < 50 && !stopping; i++) {
    try {
      const response = await fetch(new URL('/api/health', origin), { signal: AbortSignal.timeout(1000) });
      ready = response.ok && (await response.json()).status === 'ok';
    } catch { /* PHP may still be starting. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('PHP API did not start. Check the PHP executable and port.');
  console.log(`PHP API ready at ${origin.origin}`);
  if (!process.argv.includes('--api-only')) {
    launch(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '0.0.0.0', '--port', env.APP_PORT || '3000']);
  }
} catch (error) { console.error(error.message); stop(1); }
