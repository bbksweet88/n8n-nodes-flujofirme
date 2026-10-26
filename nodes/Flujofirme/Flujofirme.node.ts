import { NodeConnectionTypes, NodeOperationError, type IExecuteFunctions, type INodeExecutionData, type INodeType, type INodeTypeDescription, type IDataObject, type IHttpRequestOptions } from 'n8n-workflow';
import { buildSignature, diagnoseUrl, validateResponse } from './signature';
import { assertNodeServiceOrigin } from './serviceOrigin';

export class Flujofirme implements INodeType {
 description: INodeTypeDescription = {
  displayName: 'FlujoFirme', name: 'flujofirme', icon: {light: 'file:flujofirme.svg', dark: 'file:flujofirme.dark.svg'},
  group: ['output'], version: 1, description: 'Look up documented workflow failure classes in the FlujoFirme catalogue',
  defaults: {name: 'FlujoFirme'}, usableAsTool: true, subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  inputs: [NodeConnectionTypes.Main], outputs: [NodeConnectionTypes.Main],
  credentials: [{name: 'flujofirmeApi', required: true, displayOptions: {show: {authentication: ['privateSite']}}}],
  properties: [
   {displayName: 'Free catalogue pilot: use the public FlujoFirme endpoint with Authentication None. Results are documented guidance, not demonstrated repairs. This node never changes workflows.', name: 'notice', type: 'notice', default: ''},
   {displayName: 'Resource', name: 'resource', type: 'options', noDataExpression: true, options: [{name: 'Failure', value: 'failure'}], default: 'failure'},
   {displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, options: [{name: 'Diagnose', value: 'diagnose', action: 'Diagnose a failure', description: 'Find documented guidance for an explicitly selected error class'}], default: 'diagnose'},
   {displayName: 'Authentication', name: 'authentication', type: 'options', noDataExpression: true, options: [{name: 'None', value: 'none'}, {name: 'Private Site Access', value: 'privateSite'}], default: 'none', description: 'The public pilot needs no account or credential. Private Site Access is only for a separately authorized legacy endpoint.'},
   {displayName: 'Service URL', name: 'serviceUrl', type: 'string', default: '', required: true, placeholder: 'https://your-flujofirme-service.example', description: 'HTTPS base URL of the FlujoFirme catalogue API. Public pilot access uses Authentication None.'},
   {displayName: 'Request Timeout (Seconds)', name: 'timeoutSeconds', type: 'number', default: 90, typeOptions: {minValue: 1, maxValue: 120, numberPrecision: 0}, description: 'How long to wait for one catalogue request, from 1 to 120 seconds. Free hosting may need about one minute to wake after idle.'},
   {displayName: 'Node Type', name: 'nodeType', type: 'options', options: [
    {name: 'Basic LLM Chain', value: 'basicllmchain'}, {name: 'Google Sheets', value: 'googlesheets'},
    {name: 'Structured Output Parser', value: 'structuredoutputparser'}, {name: 'Unknown', value: 'unknown'},
   ], default: 'unknown', description: 'Select explicitly; an Error Trigger node name does not establish its type'},
   {displayName: 'Error Class', name: 'errorClass', type: 'options', options: [
    {name: 'Google Sheets Rate Limit', value: 'GOOGLE_SHEETS_RATE_LIMIT'},
    {name: 'Model Output Schema Mismatch', value: 'MODEL_OUTPUT_SCHEMA_MISMATCH'},
    {name: 'Unknown', value: 'UNKNOWN'},
   ], default: 'UNKNOWN', description: 'Classify locally. Do not pass an error message or workflow payload.'},
   {displayName: 'Node Version', name: 'nodeVersion', type: 'number', default: 0, typeOptions: {minValue: 0, maxValue: 100}, description: 'Optional numeric node version; zero omits the field'},
   {displayName: 'N8n Version', name: 'n8nVersion', type: 'string', default: '', placeholder: '2.18.0', description: 'Optional numeric major.minor.patch version; leave empty when unknown'},
   {displayName: 'HTTP Status', name: 'httpStatus', type: 'number', default: 0, typeOptions: {minValue: 0, maxValue: 599}, description: 'Optional HTTP response status from 100 to 599; zero omits the field'},
  ],
 };
 async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const output: INodeExecutionData[] = [];
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
   try {
    const signature = buildSignature({
     nodeType: this.getNodeParameter('nodeType', itemIndex),
     errorClass: this.getNodeParameter('errorClass', itemIndex),
     nodeVersion: this.getNodeParameter('nodeVersion', itemIndex),
     n8nVersion: this.getNodeParameter('n8nVersion', itemIndex),
     httpStatus: this.getNodeParameter('httpStatus', itemIndex),
    });
    const url = diagnoseUrl(this.getNodeParameter('serviceUrl', itemIndex));
    const timeoutSeconds = this.getNodeParameter('timeoutSeconds', itemIndex, 90);
    if (typeof timeoutSeconds !== 'number' || !Number.isInteger(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 120) throw new NodeOperationError(this.getNode(), 'Request timeout must be an integer from 1 to 120 seconds', {itemIndex});
    const authentication = this.getNodeParameter('authentication', itemIndex, 'none');
    if (authentication !== 'none' && authentication !== 'privateSite') throw new NodeOperationError(this.getNode(), 'Select a supported authentication method', {itemIndex});
    const request: IHttpRequestOptions = {
     method: 'POST', url, body: signature, json: true, timeout: timeoutSeconds * 1000,
     disableFollowRedirect: true, maxRedirects: 0,
     headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    };
    let response: unknown;
    if (authentication === 'privateSite') {
     await assertNodeServiceOrigin.call(this, url, itemIndex);
     response = await this.helpers.httpRequestWithAuthentication.call(this, 'flujofirmeApi', request);
    } else {
     response = await this.helpers.httpRequest(request);
    }
    const result = validateResponse(response);
    output.push({json: result as unknown as IDataObject, pairedItem: {item: itemIndex}});
   } catch {
    const message = 'FlujoFirme lookup failed. Check the selected fields and service availability locally; no repair has been applied.';
    if (this.continueOnFail()) {
     output.push({json: {status: 'lookup_failed', error: message}, pairedItem: {item: itemIndex}});
     continue;
    }
    throw new NodeOperationError(this.getNode(), message, {itemIndex});
   }
  }
  return [output];
 }
}

