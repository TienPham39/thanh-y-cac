import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { spawn } from 'node:child_process';
import { portAvailable, phpReady } from './dev-services.mjs';
import { developmentEnvironment } from './dev-config.mjs';

if (existsSync('.env')) loadEnvFile('.env');
const env = developmentEnvironment(process.env);
const origin = new URL(env.PHP_API_ORIGIN);
if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error('PHP_API_ORIGIN must be a local HTTP origin, for example http://127.0.0.1:8787');
}
const port = Number(origin.port || 80);
const startPhp = await portAvailable(origin.hostname, port);
if (!startPhp && !await phpReady(origin)) {
  console.error(`Port ${port} is occupied by a service that is not the Thanh Y Cac PHP API. Set PHP_API_ORIGIN to a free port.`);
  process.exit(1);
}

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
if (startPhp) launch(env.PHP_BINARY || 'php', ['-S', `${origin.hostname}:${port}`, '-t', 'public', 'scripts/php-router.php']);
else console.log(`Reusing PHP API at ${origin.origin}`);
try {
  let ready = false;
  for (let i = 0; i < 50 && !stopping; i++) {
    ready = await phpReady(origin);
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('PHP API did not start. Check the PHP executable and port.');
  console.log(`PHP API ready at ${origin.origin}`);
  if (!process.argv.includes('--api-only')) {
    const webPort = Number(env.APP_PORT || '3000');
    if (!await portAvailable('0.0.0.0', webPort)) {
      const webOrigin = `http://127.0.0.1:${webPort}`;
      const page = await fetch(`${webOrigin}/admin/`, {signal: AbortSignal.timeout(15000)});
      if (page.ok && (await page.text()).includes('/_next/static/') && await phpReady(webOrigin)) {
        console.log(`Frontend already running at http://localhost:${webPort}`);
      } else throw new Error(`Frontend port ${webPort} is occupied by another service. Set APP_PORT to a free port.`);
    } else {
    launch(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '0.0.0.0', '--port', env.APP_PORT || '3000']);
    }
  }
} catch (error) { console.error(error.message); stop(1); }
