import net from 'node:net';

export async function portAvailable(host, port) {
  const probe = net.createServer();
  const free = await new Promise((resolve, reject) => {
    probe.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
    probe.listen(port, host, () => resolve(true));
  });
  if (free) await new Promise(resolve => probe.close(resolve));
  return free;
}

export async function phpReady(origin) {
  try {
    const response = await fetch(new URL('/api/health', origin), { signal: AbortSignal.timeout(1500) });
    const body = await response.json();
    return response.ok && body.status === 'ok' && body.service === 'thanh-y-cac-php';
  } catch { return false; }
}
