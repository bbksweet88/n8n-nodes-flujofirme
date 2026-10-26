import type { IExecuteFunctions } from 'n8n-workflow';

function httpsUrl(value: unknown): URL {
 if (typeof value !== 'string' || !URL.canParse(value) || value.includes('?') || value.includes('#')) {
  throw new Error('Use an HTTPS service URL without credentials, a query or a fragment');
 }
 const url = new URL(value);
 if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
  throw new Error('Use an HTTPS service URL without credentials, a query or a fragment');
 }
 return url;
}

export async function assertNodeServiceOrigin(this: IExecuteFunctions, url: string, itemIndex: number): Promise<void> {
 const credentials = await this.getCredentials('flujofirmeApi', itemIndex);
 assertPrivateServiceOrigin(url, credentials.serviceOrigin);
}

export function assertPrivateServiceOrigin(target: unknown, configuredOrigin: unknown): void {
 const targetUrl = httpsUrl(target);
 const originUrl = httpsUrl(configuredOrigin);
 if (originUrl.pathname !== '/' || targetUrl.origin !== originUrl.origin) {
  throw new Error('The service URL must match the credential service origin');
 }
}
