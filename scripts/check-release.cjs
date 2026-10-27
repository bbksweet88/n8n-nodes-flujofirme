// This configuration gate prevents accidental publication with no service.
// It does not replace external integration and reliability verification.
const {publicDiagnosisUrl} = require('../dist/nodes/Flujofirme/serviceConfig.js');
try {
 const endpoint = publicDiagnosisUrl();
 const hostname = new URL(endpoint).hostname;
 if (['invalid', 'example', 'test'].some(tld => hostname.endsWith(`.${tld}`)) || hostname === 'example.com' || hostname.endsWith('.example.com')) throw new Error('A placeholder service endpoint cannot be published');
 console.log(`Fixed service endpoint configured: ${endpoint}`);
 console.log('External integration and reliability evidence must still be reviewed before publication.');
} catch (error) {
 console.error(`Publication blocked: ${error.message}`);
 process.exitCode = 1;
}
