import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { diagnose, validateSignature } from './diagnose.mjs';

const MAX_BYTES = 4096;
function send(response, code, value) {
  response.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(value));
}

export function resolveListenOptions(env = process.env) {
  const host = env.HOST || '127.0.0.1';
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host)) throw new TypeError('HOST must be an explicit loopback or all-interface address');
  const portText = env.PORT ?? '8787';
  if (!/^\d{1,5}$/.test(portText)) throw new TypeError('PORT must be an integer from 1 through 65535');
  const port = Number(portText);
  if (port < 1 || port > 65535) throw new TypeError('PORT must be an integer from 1 through 65535');
  return { host, port };
}

export function createCatalogueServer({ publicPilot = false } = {}) {
  const server = createServer(async (request, response) => {
    if (request.url === '/health' && request.method === 'GET') {
      return send(response, 200, { status: 'ok', mode: publicPilot ? 'public-pilot' : 'local-development' });
    }
    if (request.url === '/' && request.method === 'GET') {
      return send(response, 200, {
        service: 'FlujoFirme catalogue', mode: publicPilot ? 'public-pilot' : 'local-development',
        endpoints: { health: 'GET /health', diagnose: 'POST /v1/diagnose' }, authentication: 'none',
        requestFields: ['schemaVersion', 'nodeType', 'nodeVersion', 'n8nVersion', 'errorClass', 'httpStatus'],
        notice: 'Only categorical signatures. Do not send raw errors, workflow exports, credentials, prompts or personal data. Documentation-backed guidance only; no workflow is changed. No availability or support guarantee.',
      });
    }
    if (request.url !== '/v1/diagnose') return send(response, 404, { error: 'Not found' });
    if (request.method !== 'POST') return send(response, 405, { error: 'POST required' });
    if ((request.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase() !== 'application/json') return send(response, 415, { error: 'JSON required' });
    let body = '';
    let size = 0;
    try {
      for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BYTES) {
          send(response, 413, { error: 'Signature too large' });
          request.resume();
          return;
        }
        body += chunk.toString('utf8');
      }
      const signature = JSON.parse(body);
      if (!validateSignature(signature)) return send(response, 400, { error: 'Invalid failure signature' });
      return send(response, 200, diagnose(signature));
    } catch {
      return send(response, 400, { error: 'Invalid JSON signature' });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { host, port } = resolveListenOptions();
  const server = createCatalogueServer({ publicPilot: process.env.FLUJOFIRME_PUBLIC_PILOT === '1' });
  server.listen(port, host, () => console.log(`FlujoFirme catalogue listening on ${host}:${port}; Node ${process.version}`));
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    server.close(() => process.exit(0));
    server.closeIdleConnections();
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
