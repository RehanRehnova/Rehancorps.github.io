(function () {
  const inp = document.getElementById('cidr-in');
  const out = document.getElementById('cidr-out');
  const err = document.getElementById('cidr-err');
  if (!inp || !out) return;

  function ipToInt(ip) {
    const p = ip.split('.').map((x) => parseInt(x, 10));
    if (p.length !== 4 || p.some((n) => isNaN(n) || n < 0 || n > 255)) return null;
    return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
  }

  function intToIp(n) {
    return [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255,
    ].join('.');
  }

  function calc() {
    err.textContent = '';
    const raw = (inp.value || '').trim();
    const m = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
    if (!m) {
      err.textContent = 'Use IPv4 CIDR like 10.0.0.0/24';
      out.value = '';
      return;
    }
    const prefix = parseInt(m[2], 10);
    if (prefix < 0 || prefix > 32) {
      err.textContent = 'Prefix must be 0–32.';
      return;
    }
    const ip = ipToInt(m[1]);
    if (ip === null) {
      err.textContent = 'Invalid IPv4 address.';
      return;
    }
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const size = Math.pow(2, 32 - prefix);
    const usable = prefix >= 31 ? size : size - 2;
    const first = prefix >= 31 ? network : (network + 1) >>> 0;
    const last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;

    out.value = [
      'CIDR:          ' + intToIp(network) + '/' + prefix,
      'Netmask:       ' + intToIp(mask),
      'Wildcard:      ' + intToIp((~mask) >>> 0),
      'Network:       ' + intToIp(network),
      'Broadcast:     ' + intToIp(broadcast),
      'First usable:  ' + intToIp(first),
      'Last usable:   ' + intToIp(last),
      'Total hosts:   ' + size,
      'Usable hosts:  ' + usable,
    ].join('\n');
  }

  document.getElementById('cidr-calc').addEventListener('click', calc);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calc();
  });
  document.getElementById('cidr-copy').addEventListener('click', () => {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).catch(() => {});
    err.textContent = 'copied.';
  });
})();
