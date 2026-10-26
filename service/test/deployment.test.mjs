import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createCatalogueServer, resolveListenOptions } from '../server.mjs';

test('local listener remains loopback and Render listener accepts explicit HOST and PORT', () => {
  assert.deepEqual(resolveListenOptions({}), { host: '127.0.0.1', port: 8787 });
  assert.deepEqual(resolveListenOptions({ HOST: '0.0.0.0', PORT: '10000' }), { host: '0.0.0.0', port: 10000 });
  for (const PORT of ['0', '65536', '-1', '1.2', '10000x', '']) assert.throws(() => resolveListenOptions({ PORT }));
  assert.throws(() => resolveListenOptions({ HOST: 'unexpected.example' }));
});

test('public pilot exposes ordinary health/contract and rejects malformed or oversized signatures', async () => {
  const server = createCatalogueServer({ publicPilot: true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: 'ok', mode: 'public-pilot' });
    const contract = await (await fetch(base)).json();
    assert.equal(contract.authentication, 'none');
    assert.equal(contract.requestFields.includes('errorClass'), true);
    const post = body => fetch(`${base}/v1/diagnose`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    assert.equal((await post('{')).status, 400);
    assert.equal((await post('x'.repeat(4097))).status, 413);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('production CLI accepts explicit listener settings and exits cleanly on SIGTERM', async () => {
  const reservation = createCatalogueServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [new URL('../server.mjs', import.meta.url).pathname], {
    env: { PATH: process.env.PATH, HOST: '0.0.0.0', PORT: String(port), FLUJOFIRME_PUBLIC_PILOT: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Listener did not start: ${stderr}`)), 5000);
      child.stdout.on('data', () => { if (stdout.includes('listening')) { clearTimeout(timeout); resolve(); } });
      child.once('error', reject);
    });
    const health = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
    assert.deepEqual(health, { status: 'ok', mode: 'public-pilot' });
    assert.match(stdout, /Node v24\.22\.1/);
    const exit = once(child, 'exit');
    child.kill('SIGTERM');
    assert.deepEqual(await exit, [0, null]);
  } finally {
    child.kill('SIGKILL');
  }
});
