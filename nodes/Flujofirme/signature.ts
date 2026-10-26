export const NODE_TYPES = ['googlesheets', 'basicllmchain', 'structuredoutputparser', 'unknown'] as const;
export const ERROR_CLASSES = ['GOOGLE_SHEETS_RATE_LIMIT', 'MODEL_OUTPUT_SCHEMA_MISMATCH', 'UNKNOWN'] as const;
export type NodeType = (typeof NODE_TYPES)[number];
export type ErrorClass = (typeof ERROR_CLASSES)[number];
export interface FailureSignature {
 schemaVersion: 1; nodeType: NodeType; errorClass: ErrorClass;
 nodeVersion?: number; n8nVersion?: string; httpStatus?: number;
}
const SEMVER = /^\d+\.\d+\.\d+$/;
export function buildSignature(input: Record<string, unknown>): FailureSignature {
 if (!NODE_TYPES.includes(input.nodeType as NodeType)) throw new Error('Select a supported node type');
 if (!ERROR_CLASSES.includes(input.errorClass as ErrorClass)) throw new Error('Select a supported error class');
 const result: FailureSignature = {schemaVersion: 1, nodeType: input.nodeType as NodeType, errorClass: input.errorClass as ErrorClass};
 if (input.nodeVersion !== undefined && input.nodeVersion !== 0 && input.nodeVersion !== '') {
  if (typeof input.nodeVersion !== 'number' || !Number.isFinite(input.nodeVersion) || input.nodeVersion <= 0 || input.nodeVersion > 100) throw new Error('Node version must be a positive number up to 100');
  result.nodeVersion = input.nodeVersion;
 }
 if (input.n8nVersion !== undefined && input.n8nVersion !== '') {
  if (typeof input.n8nVersion !== 'string' || input.n8nVersion.length > 32 || !SEMVER.test(input.n8nVersion)) throw new Error('n8n version must use a numeric major.minor.patch format');
  result.n8nVersion = input.n8nVersion;
 }
 if (input.httpStatus !== undefined && input.httpStatus !== 0 && input.httpStatus !== '') {
  if (typeof input.httpStatus !== 'number' || !Number.isInteger(input.httpStatus) || input.httpStatus < 100 || input.httpStatus > 599) throw new Error('HTTP status must be an integer from 100 to 599');
  result.httpStatus = input.httpStatus;
 }
 return result;
}
export function diagnoseUrl(endpoint: unknown): string {
 if (typeof endpoint !== 'string') throw new Error('Enter the FlujoFirme service URL');
 const url = new URL(endpoint);
 if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Use an HTTPS service URL without credentials, a query or a fragment');
 url.pathname = url.pathname.replace(/\/$/, '') + '/v1/diagnose';
 return url.toString();
}
type JsonRecord = {[key: string]: unknown};
function record(value: unknown): JsonRecord {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid FlujoFirme response');
 return value as JsonRecord;
}
function text(value: unknown): string {
 if (typeof value !== 'string' || value.length > 10000) throw new Error('Invalid FlujoFirme text');
 return value;
}
function texts(value: unknown): string[] {
 if (!Array.isArray(value) || value.length > 30) throw new Error('Invalid FlujoFirme list');
 return value.map(text);
}
export interface DiagnosisMatch {
 id: string; title: string; cause: string; recommendation: string; manualTest: string[];
 rollback: string[]; sources: {url: string; checkedOn: string}[]; evidenceLevel: 'documentation'; limitations: string[];
}
export interface DiagnosisResponse {
 schemaVersion: 1; status: 'matched' | 'unmatched'; catalogVersion: string; matches: DiagnosisMatch[]; notice: string;
}
export function validateResponse(value: unknown): DiagnosisResponse {
 const raw = record(value);
 if (raw.schemaVersion !== 1 || !['matched', 'unmatched'].includes(raw.status as string) || !Array.isArray(raw.matches) || raw.matches.length > 10) throw new Error('Unsupported FlujoFirme response');
 const matches = raw.matches.map((value): DiagnosisMatch => {
  const match = record(value);
  if (match.evidenceLevel !== 'documentation' || !Array.isArray(match.sources) || match.sources.length > 10) throw new Error('Invalid FlujoFirme match');
  return {
   id: text(match.id), title: text(match.title), cause: text(match.cause), recommendation: text(match.recommendation),
   manualTest: texts(match.manualTest), rollback: texts(match.rollback), limitations: texts(match.limitations), evidenceLevel: 'documentation',
   sources: match.sources.map((value) => {
    const source = record(value); const url = text(source.url);
    if (new URL(url).protocol !== 'https:') throw new Error('Invalid source URL');
    const checkedOn = text(source.checkedOn);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) throw new Error('Invalid source date');
    return {url, checkedOn};
   }),
  };
 });
 if ((raw.status === 'unmatched' && matches.length !== 0) || (raw.status === 'matched' && matches.length === 0)) throw new Error('Inconsistent FlujoFirme match status');
 return {schemaVersion: 1, status: raw.status as 'matched' | 'unmatched', catalogVersion: text(raw.catalogVersion), matches, notice: text(raw.notice)};
}

