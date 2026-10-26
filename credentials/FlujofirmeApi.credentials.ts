import type { IAuthenticate, ICredentialTestRequest, ICredentialType, Icon, INodeProperties } from 'n8n-workflow';
import { assertPrivateServiceOrigin } from '../nodes/Flujofirme/serviceOrigin';

export class FlujofirmeApi implements ICredentialType {
 name = 'flujofirmeApi';
 displayName = 'FlujoFirme Private Site API';
 documentationUrl = 'https://flujofirme-catalog-api-20261024.bbksweet.chatgpt.site/';
 icon: Icon = {light: 'file:../nodes/Flujofirme/flujofirme.svg', dark: 'file:../nodes/Flujofirme/flujofirme.dark.svg'};
 properties: INodeProperties[] = [
  {
   displayName: 'Service Origin', name: 'serviceOrigin', type: 'string', default: '', required: true,
   placeholder: 'https://your-authorized-flujofirme-service.example',
   description: 'HTTPS origin of your authorized private service, without a path, query, fragment or user credentials',
  },
  {
   displayName: 'Access Token', name: 'accessToken', type: 'string', default: '', required: true,
   typeOptions: {password: true}, description: 'Private Site access token stored in n8n encrypted credentials',
  },
 ];
 authenticate: IAuthenticate = async (credentials, requestOptions) => {
  assertPrivateServiceOrigin(requestOptions.url, credentials.serviceOrigin);
  const accessToken = credentials.accessToken;
  if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 8192 || /\s/.test(accessToken)) {
   throw new Error('Enter a valid private service access token');
  }
  return {
   ...requestOptions,
   disableFollowRedirect: true,
   maxRedirects: 0,
   headers: {...requestOptions.headers, 'OAI-Sites-Authorization': `Bearer ${accessToken}`},
  };
 };
 test: ICredentialTestRequest = {
  request: {
   method: 'GET', url: '={{ $credentials.serviceOrigin.replace(/\\/$/, "") + "/health" }}',
   json: true, timeout: 90000, disableFollowRedirect: true, maxRedirects: 0,
   headers: {Accept: 'application/json'},
  },
 };
}
