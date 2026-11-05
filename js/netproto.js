/**
 * Helpers the simulated shell needs to behave like a real one:
 * IPv4/CIDR arithmetic, md5, base64, and a tiny HTTP client for lab hosts.
 * Pure functions, no DOM, so the Node tests can import them directly.
 */

/* ---------------- IPv4 / CIDR ---------------- */

export function ipToInt(ip) {
  const parts = String(ip).trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

export function intToIp(n) {
  const v = n >>> 0;
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

const maskFor = (prefix) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);

export function parseCidr(input) {
  const raw = String(input || '').trim();
  const [ipPart, prefixPart] = raw.split('/');
  const base = ipToInt(ipPart);
  if (base === null) return { error: `invalid address: ${ipPart || raw}` };
  const prefix = prefixPart === undefined ? 32 : Number(prefixPart);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return { error: `invalid prefix: /${prefixPart}` };
  const mask = maskFor(prefix);
  const network = (base & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const count = 2 ** (32 - prefix);
  const usable = prefix >= 31 ? count : Math.max(count - 2, 0);
  return {
    input: raw,
    base,
    prefix,
    mask,
    network,
    broadcast,
    first: prefix >= 31 ? network : (network + 1) >>> 0,
    last: prefix >= 31 ? broadcast : (broadcast - 1) >>> 0,
    count,
    usable,
    netIp: intToIp(network),
    broadcastIp: intToIp(broadcast),
    maskIp: intToIp(mask),
    firstIp: intToIp(prefix >= 31 ? network : (network + 1) >>> 0),
    lastIp: intToIp(prefix >= 31 ? broadcast : (broadcast - 1) >>> 0)
  };
}

export function ipcalc(input) {
  const r = parseCidr(input);
  if (r.error) return r.error;
  return [
    `Address:   ${r.input}`,
    `Netmask:   ${r.maskIp} = /${r.prefix}`,
    `Network:   ${r.netIp}/${r.prefix}`,
    `Broadcast: ${r.broadcastIp}`,
    `Host range: ${r.firstIp} - ${r.lastIp}`,
    `Addresses: ${r.count} total, ${r.usable} usable host${r.usable === 1 ? '' : 's'}`
  ].join('\n');
}

export function inSubnet(ip, cidr) {
  const r = parseCidr(cidr);
  const n = ipToInt(ip);
  if (r.error || n === null) return false;
  return (n & r.mask) >>> 0 === r.network;
}

/* ---------------- md5 ---------------- */

export function md5(str) {
  const s = utf8Bytes(String(str));
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  const rol = (num, cnt) => (num << cnt) | (num >>> (32 - cnt));
  const cmn = (q, a, b, x, s2, t) => safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s2), b);
  const ff = (a, b, c, d, x, s2, t) => cmn((b & c) | (~b & d), a, b, x, s2, t);
  const gg = (a, b, c, d, x, s2, t) => cmn((b & d) | (c & ~d), a, b, x, s2, t);
  const hh = (a, b, c, d, x, s2, t) => cmn(b ^ c ^ d, a, b, x, s2, t);
  const ii = (a, b, c, d, x, s2, t) => cmn(c ^ (b | ~d), a, b, x, s2, t);

  const blocks = [];
  const bitLen = s.length * 8;
  const withPad = s.slice();
  withPad.push(0x80);
  while (withPad.length % 64 !== 56) withPad.push(0);
  for (let i = 0; i < 4; i++) withPad.push((bitLen >>> (8 * i)) & 0xff);
  for (let i = 0; i < withPad.length; i += 64) {
    const w = [];
    for (let j = 0; j < 64; j += 4) {
      w.push(withPad[i + j] | (withPad[i + j + 1] << 8) | (withPad[i + j + 2] << 16) | (withPad[i + j + 3] << 24));
    }
    blocks.push(w);
  }

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (const x of blocks) {
    const [oa, ob, oc, od] = [a, b, c, d];
    a = ff(a, b, c, d, x[0], 7, -680876936);
    d = ff(d, a, b, c, x[1], 12, -389564586);
    c = ff(c, d, a, b, x[2], 17, 606105819);
    b = ff(b, c, d, a, x[3], 22, -1044525330);
    a = ff(a, b, c, d, x[4], 7, -176418897);
    d = ff(d, a, b, c, x[5], 12, 1200080426);
    c = ff(c, d, a, b, x[6], 17, -1473231341);
    b = ff(b, c, d, a, x[7], 22, -45705983);
    a = ff(a, b, c, d, x[8], 7, 1770035416);
    d = ff(d, a, b, c, x[9], 12, -1958414417);
    c = ff(c, d, a, b, x[10], 17, -42063);
    b = ff(b, c, d, a, x[11], 22, -1990404162);
    a = ff(a, b, c, d, x[12], 7, 1804603682);
    d = ff(d, a, b, c, x[13], 12, -40341101);
    c = ff(c, d, a, b, x[14], 17, -1502002290);
    b = ff(b, c, d, a, x[15], 22, 1236535329);

    a = gg(a, b, c, d, x[1], 5, -165796510);
    d = gg(d, a, b, c, x[6], 9, -1069501632);
    c = gg(c, d, a, b, x[11], 14, 643717713);
    b = gg(b, c, d, a, x[0], 20, -373897302);
    a = gg(a, b, c, d, x[5], 5, -701558691);
    d = gg(d, a, b, c, x[10], 9, 38016083);
    c = gg(c, d, a, b, x[15], 14, -660478335);
    b = gg(b, c, d, a, x[4], 20, -405537848);
    a = gg(a, b, c, d, x[9], 5, 568446438);
    d = gg(d, a, b, c, x[14], 9, -1019803690);
    c = gg(c, d, a, b, x[3], 14, -187363961);
    b = gg(b, c, d, a, x[8], 20, 1163531501);
    a = gg(a, b, c, d, x[13], 5, -1444681467);
    d = gg(d, a, b, c, x[2], 9, -51403784);
    c = gg(c, d, a, b, x[7], 14, 1735328473);
    b = gg(b, c, d, a, x[12], 20, -1926607734);

    a = hh(a, b, c, d, x[5], 4, -378558);
    d = hh(d, a, b, c, x[8], 11, -2022574463);
    c = hh(c, d, a, b, x[11], 16, 1839030562);
    b = hh(b, c, d, a, x[14], 23, -35309556);
    a = hh(a, b, c, d, x[1], 4, -1530992060);
    d = hh(d, a, b, c, x[4], 11, 1272893353);
    c = hh(c, d, a, b, x[7], 16, -155497632);
    b = hh(b, c, d, a, x[10], 23, -1094730640);
    a = hh(a, b, c, d, x[13], 4, 681279174);
    d = hh(d, a, b, c, x[0], 11, -358537222);
    c = hh(c, d, a, b, x[3], 16, -722521979);
    b = hh(b, c, d, a, x[6], 23, 76029189);
    a = hh(a, b, c, d, x[9], 4, -640364487);
    d = hh(d, a, b, c, x[12], 11, -421815835);
    c = hh(c, d, a, b, x[15], 16, 530742520);
    b = hh(b, c, d, a, x[2], 23, -995338651);

    a = ii(a, b, c, d, x[0], 6, -198630844);
    d = ii(d, a, b, c, x[7], 10, 1126891415);
    c = ii(c, d, a, b, x[14], 15, -1416354905);
    b = ii(b, c, d, a, x[5], 21, -57434055);
    a = ii(a, b, c, d, x[12], 6, 1700485571);
    d = ii(d, a, b, c, x[3], 10, -1894986606);
    c = ii(c, d, a, b, x[10], 15, -1051523);
    b = ii(b, c, d, a, x[1], 21, -2054922799);
    a = ii(a, b, c, d, x[8], 6, 1873313359);
    d = ii(d, a, b, c, x[15], 10, -30611744);
    c = ii(c, d, a, b, x[6], 15, -1560198380);
    b = ii(b, c, d, a, x[13], 21, 1309151649);
    a = ii(a, b, c, d, x[4], 6, -145523070);
    d = ii(d, a, b, c, x[11], 10, -1120210379);
    c = ii(c, d, a, b, x[2], 15, 718787259);
    b = ii(b, c, d, a, x[9], 21, -343485551);

    a = safeAdd(a, oa);
    b = safeAdd(b, ob);
    c = safeAdd(c, oc);
    d = safeAdd(d, od);
  }

  const hex = (n) => {
    let out = '';
    for (let i = 0; i < 4; i++) out += ((n >>> (i * 8 + 4)) & 0x0f).toString(16) + ((n >>> (i * 8)) & 0x0f).toString(16);
    return out;
  };
  return hex(a) + hex(b) + hex(c) + hex(d);
}

function utf8Bytes(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  return out;
}

/* ---------------- base64 ---------------- */

export function b64encode(text) {
  const bytes = utf8Bytes(String(text));
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | ((b1 || 0) >> 4)];
    out += b1 === undefined ? '=' : chars[((b1 & 15) << 2) | ((b2 || 0) >> 6)];
    out += b2 === undefined ? '=' : chars[b2 & 63];
  }
  return out;
}

export function b64decode(text) {
  const clean = String(text).replace(/[^A-Za-z0-9+/=]/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = chars.indexOf(clean[i]);
    const c1 = chars.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] === '=' || clean[i + 2] === undefined ? -1 : chars.indexOf(clean[i + 2]);
    const c3 = clean[i + 3] === '=' || clean[i + 3] === undefined ? -1 : chars.indexOf(clean[i + 3]);
    if (c0 < 0 || c1 < 0) break;
    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 >= 0) bytes.push(((c2 & 3) << 6) | c3);
  }
  let out = '';
  try {
    out = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    out = bytes.map((b) => String.fromCharCode(b)).join('');
  }
  return out;
}

/* ---------------- tiny HTTP for lab hosts ---------------- */

export function httpRequest(host, rawUrl) {
  const url = String(rawUrl);
  const m = url.match(/^https?:\/\/([^/:]+)(?::(\d+))?(\/[^\s]*)?$/);
  if (!m) return { error: `curl: (3) URL rejected: ${url}` };
  const [, name, portRaw, pathRaw] = m;
  const port = Number(portRaw || (url.startsWith('https') ? 443 : 80));
  const path = pathRaw || '/';
  const target = (host.ports || []).find((p) => p.port === port);
  if (!target) return { error: `curl: (7) Failed to connect to ${name} port ${port}: Connection refused` };
  const web = target.web || {};
  let body = web[path];
  if (body === undefined) {
    const decoded = path.replace(/%27/g, "'").replace(/%20/g, ' ');
    body = web[decoded];
    if (body === undefined) {
      const star = Object.keys(web).find((k) => k.endsWith('*') && (path.startsWith(k.slice(0, -1)) || decoded.startsWith(k.slice(0, -1))));
      if (star) body = web[star];
    }
  }
  if (body === undefined) {
    return {
      status: '404 Not Found',
      headers: { server: target.version || 'nginx', 'content-type': 'text/html' },
      body: `<h1>404 Not Found</h1><p>${path} does not exist on this server.</p>`
    };
  }
  return {
    status: '200 OK',
    headers: { server: target.version || 'nginx', 'content-type': 'text/html', ...(web.__headers || {}) },
    body
  };
}
