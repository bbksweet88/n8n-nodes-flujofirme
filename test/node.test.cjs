const test = require('node:test');
const assert = require('node:assert/strict');
const {buildSignature, validateResponse} = require('../dist/nodes/Flujofirme/signature.js');
const {Flujofirme} = require('../dist/nodes/Flujofirme/Flujofirme.node.js');
const serviceConfig = require('../dist/nodes/Flujofirme/serviceConfig.js');
const actualOrigin = serviceConfig.PUBLIC_SERVICE_ORIGIN;
// Synthetic mocked-helper fixture only. No external HTTP requests are made.
serviceConfig.PUBLIC_SERVICE_ORIGIN = 'https://flujofirme.invalid';
const unmatched = () => ({schemaVersion:1,status:'unmatched',catalogVersion:'0.1.0',matches:[],notice:'No documented match.'});
const parameters = {serviceUrl:'https://flujofirme.invalid',nodeType:'googlesheets',errorClass:'GOOGLE_SHEETS_RATE_LIMIT',nodeVersion:4.6,n8nVersion:'2.18.0',httpStatus:429};
function context(params, request, fail=false, count=1) {
 return {getInputData:()=>Array.from({length:count},()=>({json:{rawMessage:'PRIVATE',credentials:'NEVER_SEND',execution:{secret:'x'}}})),getNodeParameter:(key,_index,fallback)=>params[key]??fallback,getCredentials:async()=>{throw new Error('Unexpected credential access');},helpers:{httpRequest:request,httpRequestWithAuthentication:async()=>{throw new Error('Unexpected authenticated request');}},continueOnFail:()=>fail,getNode:()=>({name:'Unit test',type:'test',typeVersion:1,position:[0,0],parameters:{}})};
}
test('only typed allowlisted request fields are retained',()=>{
 const signature=buildSignature({...parameters,schemaVersion:99,rawMessage:'PRIVATE',items:[{customer:'PRIVATE'}],nodeName:'private',workflowId:'private'});
 assert.deepEqual(signature,{schemaVersion:1,nodeType:'googlesheets',errorClass:'GOOGLE_SHEETS_RATE_LIMIT',nodeVersion:4.6,n8nVersion:'2.18.0',httpStatus:429});
});
test('optional fields are omitted and unknown stays explicit',()=>{
 assert.deepEqual(buildSignature({nodeType:'unknown',errorClass:'UNKNOWN',nodeVersion:0,n8nVersion:'',httpStatus:0}),{schemaVersion:1,nodeType:'unknown',errorClass:'UNKNOWN'});
});
test('invalid versions and status do not enter the request',()=>{
 for (const field of [{n8nVersion:'2.18.0 customer@example.com'},{nodeVersion:NaN},{nodeVersion:101},{n8nVersion:'2.18.0-rc.1'},{n8nVersion:'2.18.0+customer42'},{httpStatus:429.2},{httpStatus:99},{nodeType:'private-customer-node'},{errorClass:'secret'}]) assert.throws(()=>buildSignature({...parameters,...field}));
});
test('the release candidate exposes neither a URL override nor a credential route',()=>{
 const node=new Flujofirme();
 assert.equal(node.description.properties.some(p=>p.name==='serviceUrl'||p.name==='authentication'),false);
 assert.deepEqual(node.description.credentials??[],[]);
 const metadata=require('../package.json');
 assert.deepEqual(metadata.n8n.credentials,[]);
 assert.equal(metadata.files.includes('dist/credentials'),false);
});
test('an unconfigured service fails without HTTP even if a legacy workflow supplies an endpoint',async()=>{
 serviceConfig.PUBLIC_SERVICE_ORIGIN='';
 try {
  let calls=0;
  const result=await Flujofirme.prototype.execute.call(context({...parameters,serviceUrl:'https://user-selected.invalid'},async()=>{calls++;return unmatched();},true));
  assert.equal(calls,0); assert.equal(result[0][0].json.status,'lookup_failed');
 } finally {serviceConfig.PUBLIC_SERVICE_ORIGIN='https://flujofirme.invalid';}
});
test('fixed endpoint validation requires an HTTPS origin without path, credentials, query or fragment',()=>{
 try {
  for(const origin of ['', 'http://localhost:8787','https://localhost','https://127.0.0.1','https://[::1]','https://user:password@example.com','https://example.com/path','https://example.com?a=secret','https://example.com/#secret']) {
   serviceConfig.PUBLIC_SERVICE_ORIGIN=origin;
   assert.throws(()=>serviceConfig.publicDiagnosisUrl());
  }
 } finally {serviceConfig.PUBLIC_SERVICE_ORIGIN='https://flujofirme.invalid';}
});
test('unknown response properties are not exposed as output',()=>{
 assert.deepEqual(validateResponse({...unmatched(),rawExecution:{secret:'PRIVATE'}}),unmatched());
 assert.throws(()=>validateResponse({...unmatched(),status:'matched'}));
 assert.throws(()=>validateResponse({...unmatched(),schemaVersion:2}));
});
test('execute uses HTTP helper with exact payload and preserves item linkage',async()=>{
 const calls=[];
 const result=await Flujofirme.prototype.execute.call(context(parameters,async request=>{calls.push(request);return unmatched();},false,2));
 assert.equal(calls.length,2); assert.equal(result[0].length,2);
 assert.equal(calls[0].url,'https://flujofirme.invalid/v1/diagnose');
 assert.equal(calls[0].method,'POST'); assert.equal(calls[0].timeout,90000);
 assert.equal(calls[0].disableFollowRedirect,true); assert.equal(calls[0].maxRedirects,0);
 assert.deepEqual(calls[0].body,buildSignature(parameters));
 assert.equal(JSON.stringify(calls).includes('PRIVATE'),false);
 assert.deepEqual(result[0].map(x=>x.pairedItem),[{item:0},{item:1}]);
});

test('fixed public service ignores legacy endpoint/authentication fields and attached credentials',async()=>{
 const calls=[];
 const ctx=context({...parameters,serviceUrl:'https://elsewhere.invalid',authentication:'privateSite'},async request=>{calls.push(request);return unmatched();});
 ctx.credentials={flujofirmeApi:{id:'synthetic-id',name:'Attached but unused'}};
 assert.equal((await Flujofirme.prototype.execute.call(ctx))[0][0].json.status,'unmatched');
 assert.equal(calls[0].url,'https://flujofirme.invalid/v1/diagnose');
 assert.equal(calls[0].headers['OAI-Sites-Authorization'],undefined);
 assert.equal(calls[0].headers.Authorization,undefined);
 assert.equal(calls[0].timeout,90000);
});
test('request timeout remains bounded without claiming service reliability',async()=>{
 for(const timeoutSeconds of [1,90,120]) {
  let request;
  await Flujofirme.prototype.execute.call(context({...parameters,timeoutSeconds},async options=>{request=options;return unmatched();}));
  assert.equal(request.timeout,timeoutSeconds*1000);
 }
 for(const timeoutSeconds of [0,-1,121,1.5,NaN,Infinity,'90',null]) {
  let calls=0;
  const ctx=context({...parameters,timeoutSeconds},async()=>{calls++;return unmatched();});
  ctx.getNodeParameter=(key,_index,fallback)=>key==='timeoutSeconds'?timeoutSeconds:parameters[key]??fallback;
  await assert.rejects(()=>Flujofirme.prototype.execute.call(ctx));
  assert.equal(calls,0);
 }
});
test('HTTP failure is explicit and does not copy failure body',async()=>{
 const result=await Flujofirme.prototype.execute.call(context(parameters,async()=>{throw new Error('PRIVATE REQUEST SECRET');},true));
 assert.equal(result[0][0].json.status,'lookup_failed');
 assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
});
test('invalid request parameters fail before any HTTP helper call',async()=>{
 let calls=0; await assert.rejects(()=>Flujofirme.prototype.execute.call(context({...parameters,n8nVersion:'sensitive'},async()=>{calls++;return unmatched();})));
 assert.equal(calls,0);
});


 test('matched documented guidance is retained while unknown fields are dropped',()=>{
 const match={id:'google-sheets-rate-limit',title:'Google Sheets quota',cause:'Per-minute quota',recommendation:'Review quotas and use backoff',manualTest:['Run a small authorized test'],rollback:['Restore the saved workflow'],sources:[{url:'https://developers.google.com/workspace/sheets/api/limits',checkedOn:'2026-10-23',rawSecret:'PRIVATE'}],evidenceLevel:'documentation',limitations:['Not proof of a real repair'],rawSecret:'PRIVATE'};
 const value=validateResponse({...unmatched(),status:'matched',matches:[match]});
 assert.equal(value.matches[0].evidenceLevel,'documentation');assert.equal(value.matches[0].manualTest.length,1);assert.equal(JSON.stringify(value).includes('PRIVATE'),false);
 assert.throws(()=>validateResponse({...unmatched(),matches:[match]}));
});
 test('workflow example stays inactive with no production endpoint claimed',()=>{
 const workflow=require('../examples/error-workflow.json');assert.equal(workflow.active,false);const node=workflow.nodes.find(n=>n.name==='FlujoFirme');assert.equal(node.parameters.serviceUrl,undefined);assert.equal(node.parameters.authentication,undefined);assert.equal(node.parameters.nodeType,'unknown');assert.equal(node.parameters.errorClass,'UNKNOWN');
});

test.after(()=>{serviceConfig.PUBLIC_SERVICE_ORIGIN=actualOrigin;});
