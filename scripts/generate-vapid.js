#!/usr/bin/env node
// Generate a VAPID key pair for Web Push, without any external dependency.
// Usage:  node scripts/generate-vapid.js
// Then copy the two keys into Vercel → Settings → Environment Variables:
//   VAPID_PUBLIC_KEY   = <PublicKey output>
//   VAPID_PRIVATE_KEY  = <PrivateKey output>
// The public key is also served at /api/vapid-public-key for the browser to
// subscribe with pushManager.subscribe({ applicationServerKey: <public> }).

const crypto = require('crypto');

function urlBase64(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding:  { type: 'spki',  format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});

// Extract the 65-byte uncompressed EC point from the SPKI blob. The uncompressed
// point always starts with 0x04 and occupies the last 65 bytes of an SPKI for P-256.
const pubPoint = publicKey.slice(publicKey.length - 65);

// The raw 32-byte private scalar lives near the end of the PKCS8 blob; extract it
// via a quick ASN.1 scan (OCTET STRING tag 0x04 + length 0x20 + 32 scalar bytes).
function extractPrivateScalar(pkcs8) {
  for (let i = 0; i < pkcs8.length - 34; i++) {
    if (pkcs8[i] === 0x04 && pkcs8[i + 1] === 0x20) {
      return pkcs8.slice(i + 2, i + 34);
    }
  }
  throw new Error('Could not extract private scalar');
}
const priv = extractPrivateScalar(privateKey);

console.log('VAPID_PUBLIC_KEY  =', urlBase64(pubPoint));
console.log('VAPID_PRIVATE_KEY =', urlBase64(priv));
console.log('');
console.log('Add these two to Vercel Environment Variables, then redeploy.');
