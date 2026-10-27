// Release configuration, not an end-user parameter. Anonymous strict-TLS
// HTTP checks passed on 27 October 2026; runtime/reliability checks are separate.
export const PUBLIC_SERVICE_ORIGIN = 'https://flujofirme-catalog-api-20261024.bbksweet.chatgpt.site';

export function publicDiagnosisUrl(): string {
 if (!PUBLIC_SERVICE_ORIGIN) throw new Error('The public FlujoFirme service is not configured for release');
 const origin = new URL(PUBLIC_SERVICE_ORIGIN);
 if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/' || origin.hostname === 'localhost' || origin.hostname.endsWith('.localhost') || origin.hostname === '127.0.0.1' || origin.hostname === '[::1]') throw new Error('Release configuration requires the real public HTTPS service origin');
 return `${origin.origin}/v1/diagnose`;
}
