/*
 * What anyone sees of www.chokunavi.shop from outside (one ordinary HTTPS request each — no scan, no probing):
 * the response headers of the top page (as curl -I shows them), the TLS certificate (as a browser shows it), the
 * script tags of the page (the template's base: EC-CUBE 4.1's default_frame.twig loads the same jQuery / Bootstrap / slick)
 * and that the bare chokunavi.shop does not answer. → outside.json
 *
 *   node tools/snapshots/ec-chokunavi-maintenance/outside.js
 */
const fs = require('fs');
const path = require('path');
const tls = require('tls');
const https = require('https');
const HOST = 'www.chokunavi.shop';
const UA = 'curl/8.9.1';

const head = () => new Promise((resolve, reject) => {
  const req = https.request({ host: HOST, path: '/', method: 'HEAD', headers: { 'User-Agent': UA, Accept: '*/*' } }, (res) => {
    const lines = [`HTTP/1.1 ${res.statusCode} ${res.statusMessage}`];
    for (let i = 0; i < res.rawHeaders.length; i += 2) lines.push(`${res.rawHeaders[i]}: ${res.rawHeaders[i + 1]}`);
    res.resume();
    resolve(lines);
  });
  req.on('error', reject);
  req.end();
});
const cert = () => new Promise((resolve, reject) => {
  const s = tls.connect({ host: HOST, port: 443, servername: HOST }, () => {
    const c = s.getPeerCertificate();
    const out = { subject: c.subject, issuer: c.issuer, valid_from: c.valid_from, valid_to: c.valid_to, subjectaltname: c.subjectaltname,
      serialNumber: c.serialNumber, fingerprint256: c.fingerprint256, protocol: s.getProtocol(), cipher: s.getCipher() };
    s.end();
    resolve(out);
  });
  s.on('error', reject);
});
const bare = () => new Promise((resolve) => {
  const req = https.request({ host: 'chokunavi.shop', path: '/', method: 'HEAD', timeout: 8000 }, (res) => { res.resume(); resolve(`HTTP ${res.statusCode}`); });
  req.on('timeout', () => { req.destroy(); resolve('timeout'); });
  req.on('error', (e) => resolve(e.code || e.message));
  req.end();
});

(async () => {
  const h = await head();
  const c = await cert();
  const page = await (await fetch(`https://${HOST}/`, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/131.0' } })).text();
  const scripts = [...page.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  const links = [...page.matchAll(/<link[^>]*href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
  const out = { capturedAt: new Date().toISOString(), head: h, cert: c, scripts, css: links, bare: await bare() };
  fs.writeFileSync(path.join(__dirname, 'outside.json'), JSON.stringify(out, null, 1));
  console.log(h.join('\n'));
  console.log(JSON.stringify(c, null, 1));
  console.log(scripts.join('\n'));
  console.log('bare chokunavi.shop:', out.bare);
})().catch((e) => { console.error(e); process.exit(1); });
