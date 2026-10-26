const test = require('node:test');
const assert = require('node:assert/strict');
const {buildSignature, diagnoseUrl, validateResponse} = require('../dist/nodes/Flujofirme/signature.js');
const {Flujofirme} = require('../dist/nodes/Flujofirme/Flujofirme.node.js');
const {FlujofirmeApi} = require('../dist/credentials/FlujofirmeApi.credentials.js');
const {assertPrivateServiceOrigin} = require('../dist/nodes/Flujofirme/serviceOrigin.js');
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
test('service URL appends only the contract path and requires HTTPS',()=>{
 assert.equal(diagnoseUrl('https://flujofirme.invalid/base/'),'https://flujofirme.invalid/base/v1/diagnose');
 for (const url of ['http://localhost:8787','https://user:password@example.com','https://example.com?a=secret','https://example.com/#secret']) assert.throws(()=>diagnoseUrl(url));
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

test('private authentication uses only the n8n credential helper after matching the origin',async()=>{
 const ctx=context({...parameters,authentication:'privateSite'},async()=>assert.fail('Unauthenticated helper must not be used'));
 const credentialCalls=[]; const calls=[];
 ctx.getCredentials=async(type,index)=>{credentialCalls.push({type,index});return {serviceOrigin:'https://flujofirme.invalid',accessToken:'SYNTHETIC_PRIVATE_TOKEN'};};
 ctx.helpers.httpRequestWithAuthentication=async function(type,request){assert.equal(this,ctx);calls.push({type,request});return unmatched();};
 const result=await Flujofirme.prototype.execute.call(ctx);
 assert.deepEqual(credentialCalls,[{type:'flujofirmeApi',index:0}]);
 assert.equal(calls[0].type,'flujofirmeApi'); assert.equal(calls[0].request.disableFollowRedirect,true); assert.equal(calls[0].request.maxRedirects,0);
 assert.deepEqual(calls[0].request.body,buildSignature(parameters));
 assert.equal(JSON.stringify({calls,result}).includes('SYNTHETIC_PRIVATE_TOKEN'),false);
});
test('none authentication does not read credentials even when a credential is attached',async()=>{
 const calls=[];
 const ctx=context({...parameters,authentication:'none'},async request=>{calls.push(request);return unmatched();});
 ctx.credentials={flujofirmeApi:{id:'synthetic-id',name:'Attached but unused'}};
 assert.equal((await Flujofirme.prototype.execute.call(ctx))[0][0].json.status,'unmatched');
 assert.equal(calls[0].headers['OAI-Sites-Authorization'],undefined);
 assert.equal(calls[0].headers.Authorization,undefined);
 assert.equal(calls[0].timeout,90000);
});
test('request timeout is configurable for a cold public service but remains bounded',async()=>{
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
test('private authentication refuses mismatched or invalid origins before making an HTTP request',async()=>{
 for(const serviceOrigin of ['',undefined,'https://elsewhere.invalid','http://flujofirme.invalid','https://flujofirme.invalid:8443','https://flujofirme.invalid/path','https://u:p@flujofirme.invalid','https://flujofirme.invalid?token=PRIVATE','https://flujofirme.invalid/#PRIVATE','https://flujofirme.invalid?','https://flujofirme.invalid#','PRIVATE']) {
  let calls=0; const ctx=context({...parameters,authentication:'privateSite'},async()=>{calls++;return unmatched();});
  ctx.getCredentials=async()=>({serviceOrigin,accessToken:'SYNTHETIC_PRIVATE_TOKEN'});
  ctx.helpers.httpRequestWithAuthentication=async()=>{calls++;return unmatched();};
  await assert.rejects(()=>Flujofirme.prototype.execute.call(ctx),error=>!error.message.includes('PRIVATE'));
  assert.equal(calls,0);
 }
 assert.doesNotThrow(()=>assertPrivateServiceOrigin('https://flujofirme.invalid/base/v1/diagnose','https://flujofirme.invalid/'));
});
test('credential authentication sets the private Site header and prevents redirects',async()=>{
 const credential=new FlujofirmeApi();
 assert.equal(credential.properties.find(p=>p.name==='accessToken').typeOptions.password,true);
 const request=await credential.authenticate({serviceOrigin:'https://flujofirme.invalid',accessToken:'SYNTHETIC_PRIVATE_TOKEN'},{url:'https://flujofirme.invalid/v1/diagnose',headers:{Accept:'application/json'},disableFollowRedirect:false,maxRedirects:10});
 assert.equal(request.headers['OAI-Sites-Authorization'],'Bearer SYNTHETIC_PRIVATE_TOKEN');
 assert.equal(request.headers.Accept,'application/json'); assert.equal(request.disableFollowRedirect,true); assert.equal(request.maxRedirects,0);
 await assert.rejects(()=>credential.authenticate({serviceOrigin:'https://flujofirme.invalid',accessToken:'SYNTHETIC_PRIVATE_TOKEN'},{url:'https://elsewhere.invalid/v1/diagnose'}));
 for(const accessToken of ['', 'PRIVATE\r\nInjected: yes']) await assert.rejects(()=>credential.authenticate({serviceOrigin:'https://flujofirme.invalid',accessToken},{url:'https://flujofirme.invalid/v1/diagnose'}));
});
test('authenticated failures do not expose credentials or upstream errors',async()=>{
 const ctx=context({...parameters,authentication:'privateSite'},async()=>assert.fail('Unexpected unauthenticated request'),true);
 ctx.getCredentials=async()=>({serviceOrigin:'https://flujofirme.invalid',accessToken:'SYNTHETIC_PRIVATE_TOKEN'});
 ctx.helpers.httpRequestWithAuthentication=async()=>{throw new Error('OAI-Sites-Authorization: Bearer SYNTHETIC_PRIVATE_TOKEN');};
 const result=await Flujofirme.prototype.execute.call(ctx);
 assert.equal(result[0][0].json.status,'lookup_failed'); assert.equal(JSON.stringify(result).includes('SYNTHETIC_PRIVATE_TOKEN'),false);
});
test('missing credentials and unsupported authentication fail before HTTP requests',async()=>{
 for(const authentication of ['privateSite','unsupported']) {
  let calls=0; const ctx=context({...parameters,authentication},async()=>{calls++;return unmatched();});
  ctx.helpers.httpRequestWithAuthentication=async()=>{calls++;return unmatched();};
  await assert.rejects(()=>Flujofirme.prototype.execute.call(ctx)); assert.equal(calls,0);
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
 const workflow=require('../examples/error-workflow.json');assert.equal(workflow.active,false);const node=workflow.nodes.find(n=>n.name==='FlujoFirme');assert.equal(node.parameters.serviceUrl,'');assert.equal(node.parameters.nodeType,'unknown');assert.equal(node.parameters.errorClass,'UNKNOWN');
});
