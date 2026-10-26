import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnose, validateSignature } from '../diagnose.mjs';
import { createCatalogueServer } from '../server.mjs';

const sheets = { schemaVersion: 1, nodeType: 'googlesheets', errorClass: 'GOOGLE_SHEETS_RATE_LIMIT', httpStatus: 429 };
test('a Sheets 429 returns a documentation-backed suggestion with sources and limits', () => {
  const result = diagnose(sheets);
  assert.equal(result.status, 'matched');
  assert.equal(result.matches[0].evidenceLevel, 'documentation');
  assert.ok(result.matches[0].sources[0].url.startsWith('https://developers.google.com/'));
  assert.ok(result.matches[0].manualTest.length);
  assert.ok(result.matches[0].rollback.length);
  assert.ok(result.matches[0].limitations.some((x) => x.includes('No live Google')));
});
test('a class without corroborating node type or HTTP code is unmatched', () => {
  assert.equal(diagnose({ ...sheets, nodeType: 'unknown' }).status, 'unmatched');
  const { httpStatus, ...noStatus } = sheets;
  assert.equal(diagnose(noStatus).status, 'unmatched');
});
test('schema mismatch does not infer a repair and does not echo input', () => {
  const input = { schemaVersion: 1, nodeType: 'structuredoutputparser', errorClass: 'MODEL_OUTPUT_SCHEMA_MISMATCH', n8nVersion: '2.18.0', nodeVersion: 1.2 };
  const before = structuredClone(input);
  assert.equal(diagnose(input).status, 'matched');
  assert.deepEqual(input, before);
  assert.equal('n8nVersion' in diagnose(input), false);
});
test('unknown failure has an empty match list', () => {
  assert.deepEqual(diagnose({ schemaVersion: 1, nodeType: 'unknown', errorClass: 'UNKNOWN' }).matches, []);
});
test('a caller cannot mutate catalogue guidance used by later calls', () => {
  const baseline = diagnose(sheets);
  const editable = diagnose(sheets);
  editable.matches[0].manualTest[0] = 'changed by a local caller';
  editable.matches[0].sources[0].url = 'https://example.invalid';
  assert.deepEqual(diagnose(sheets), baseline);
});
test('only the signature contract is accepted', () => {
  assert.equal(validateSignature({ ...sheets, message: 'example failure text' }), false);
  assert.equal(validateSignature({ ...sheets, n8nVersion: 'private-instance-name' }), false);
  assert.equal(validateSignature({ ...sheets, nodeVersion: 'example-version' }), false);
  assert.equal(validateSignature({ ...sheets, httpStatus: 429.5 }), false);
  assert.equal(validateSignature({ ...sheets, schemaVersion: 2 }), false);
});
test('local HTTP round trip returns matched, unmatched and contract errors', async () => {
  const server = createCatalogueServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (body) => fetch(`${base}/v1/diagnose`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const match = await post(sheets);
    assert.equal(match.status, 200);
    assert.equal((await match.json()).status, 'matched');
    const unknown = await post({ schemaVersion: 1, nodeType: 'unknown', errorClass: 'UNKNOWN' });
    assert.equal((await unknown.json()).status, 'unmatched');
    assert.equal((await post({ ...sheets, execution: { id: 'example' } })).status, 400);
    assert.equal((await fetch(`${base}/v1/diagnose`)).status, 405);
    assert.equal((await fetch(`${base}/v1/diagnose`, { method: 'POST', headers: { 'content-type': 'application/jsonp' }, body: JSON.stringify(sheets) })).status, 415);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
