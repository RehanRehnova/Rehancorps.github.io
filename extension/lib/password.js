/**
 * REHNOVA Vault — CSPRNG password generator (shared with site tool).
 * Works in content scripts (classic) and ES modules.
 */
(function (root) {
  const CHARSETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digit: '0123456789',
    symbol: '!@#$%^&*()-_=+[]{};:,.?/',
  };

  const DEFAULTS = {
    length: 20,
    lower: true,
    upper: true,
    digit: true,
    symbol: true,
  };

  function randomFrom(str) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return str[arr[0] % str.length];
  }

  function generatePassword(opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    let pool = '';
    if (o.lower) pool += CHARSETS.lower;
    if (o.upper) pool += CHARSETS.upper;
    if (o.digit) pool += CHARSETS.digit;
    if (o.symbol) pool += CHARSETS.symbol;
    if (!pool) pool = CHARSETS.lower + CHARSETS.upper + CHARSETS.digit;

    let len = parseInt(o.length, 10) || 20;
    len = Math.min(128, Math.max(8, len));

    // Guarantee at least one char from each selected set
    const required = [];
    if (o.lower) required.push(randomFrom(CHARSETS.lower));
    if (o.upper) required.push(randomFrom(CHARSETS.upper));
    if (o.digit) required.push(randomFrom(CHARSETS.digit));
    if (o.symbol) required.push(randomFrom(CHARSETS.symbol));

    const chars = required.slice();
    while (chars.length < len) chars.push(randomFrom(pool));

    // Fisher–Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      const j = arr[0] % (i + 1);
      const t = chars[i];
      chars[i] = chars[j];
      chars[j] = t;
    }
    return chars.join('');
  }

  const api = { CHARSETS, DEFAULTS, generatePassword };
  root.RehnovaPassword = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : self);
