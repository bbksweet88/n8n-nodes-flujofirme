import { readFileSync } from 'node:fs';

const catalogue = JSON.parse(readFileSync(new URL('../catalog/catalog.json', import.meta.url), 'utf8'));
const allowedKeys = new Set(['schemaVersion', 'nodeType', 'nodeVersion', 'n8nVersion', 'errorClass', 'httpStatus']);
const nodeTypes = new Set(['googlesheets', 'basicllmchain', 'structuredoutputparser', 'unknown']);
const errorClasses = new Set(['GOOGLE_SHEETS_RATE_LIMIT', 'MODEL_OUTPUT_SCHEMA_MISMATCH', 'UNKNOWN']);
const version = /^\d+\.\d+\.\d+$/;

export function validateSignature(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;
  if (value.schemaVersion !== 1 || !nodeTypes.has(value.nodeType) || !errorClasses.has(value.errorClass)) return false;
  if ('nodeVersion' in value && (typeof value.nodeVersion !== 'number' || !Number.isFinite(value.nodeVersion) || value.nodeVersion <= 0 || value.nodeVersion > 100)) return false;
  if ('n8nVersion' in value && (typeof value.n8nVersion !== 'string' || value.n8nVersion.length > 32 || !version.test(value.n8nVersion))) return false;
  if ('httpStatus' in value && (!Number.isInteger(value.httpStatus) || value.httpStatus < 100 || value.httpStatus > 599)) return false;
  return true;
}

export function diagnose(signature) {
  if (!validateSignature(signature)) throw new TypeError('Invalid failure signature');
  const matches = catalogue.entries.filter((entry) =>
    entry.errorClass === signature.errorClass && entry.nodeTypes.includes(signature.nodeType) &&
    (entry.httpStatus === undefined || entry.httpStatus === signature.httpStatus)
  ).map(({ errorClass, nodeTypes, httpStatus, ...entry }) => structuredClone(entry));
  return {
    schemaVersion: 1,
    status: matches.length ? 'matched' : 'unmatched',
    catalogVersion: catalogue.catalogVersion,
    matches,
    notice: matches.length
      ? 'Documentation-backed guidance only. Confirm the cause locally before changing anything. No workflow was modified.'
      : 'No catalogue match. Inspect the execution locally. No cause or repair is inferred and no workflow was modified.',
  };
}
