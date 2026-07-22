"""
Public operator utility catalog.
All tools run client-side in the browser — no remote scanning from the server.
"""

TOOLS = [
    {
        'slug': 'nmap-builder',
        'title': 'Nmap Command Builder',
        'category': 'Recon',
        'icon': 'fa-network-wired',
        'excerpt': 'Compose safe, readable nmap commands. Educational builder — runs on your machine, not ours.',
        'thumbnail': 'images/tools/recon.jpg',
        'template': 'tools/nmap.html',
    },
    {
        'slug': 'port-lookup',
        'title': 'Port Lookup',
        'category': 'Recon',
        'icon': 'fa-ethernet',
        'excerpt': 'Common TCP/UDP ports, services, and what they usually mean during enum.',
        'thumbnail': 'images/tools/recon.jpg',
        'template': 'tools/ports.html',
    },
    {
        'slug': 'hash-lab',
        'title': 'Hash Lab',
        'category': 'Crypto',
        'icon': 'fa-fingerprint',
        'excerpt': 'SHA family digests in-browser. Hash text or understand digest length fingerprints.',
        'thumbnail': 'images/tools/crypto.jpg',
        'template': 'tools/hash.html',
    },
    {
        'slug': 'encode',
        'title': 'Encode / Decode',
        'category': 'Crypto',
        'icon': 'fa-code',
        'excerpt': 'Base64, URL, and hex — encode and decode without leaving the page.',
        'thumbnail': 'images/tools/crypto.jpg',
        'template': 'tools/encode.html',
    },
    {
        'slug': 'ciphers',
        'title': 'Classic Ciphers',
        'category': 'Crypto',
        'icon': 'fa-key',
        'excerpt': 'ROT13, Caesar, and XOR for labs, CTFs, and teaching — not modern secrecy.',
        'thumbnail': 'images/tools/crypto.jpg',
        'template': 'tools/ciphers.html',
    },
    {
        'slug': 'aes',
        'title': 'AES Encrypt / Decrypt',
        'category': 'Crypto',
        'icon': 'fa-lock',
        'excerpt': 'AES-GCM via Web Crypto. Keys and plaintext stay in your browser.',
        'thumbnail': 'images/tools/crypto.jpg',
        'template': 'tools/aes.html',
    },
    {
        'slug': 'jwt',
        'title': 'JWT Inspector',
        'category': 'Crypto',
        'icon': 'fa-id-card',
        'excerpt': 'Decode JWT header and payload. No signature verification — inspection only.',
        'thumbnail': 'images/tools/hub.jpg',
        'template': 'tools/jwt.html',
    },
    {
        'slug': 'uuid',
        'title': 'UUID Generator',
        'category': 'Utilities',
        'icon': 'fa-fingerprint',
        'excerpt': 'Generate UUID v4 strings for labs, tokens, and test fixtures — all local.',
        'thumbnail': 'images/tools/hub.jpg',
        'template': 'tools/uuid.html',
    },
    {
        'slug': 'timestamp',
        'title': 'Timestamp Converter',
        'category': 'Utilities',
        'icon': 'fa-clock',
        'excerpt': 'Unix epoch ↔ UTC / local time. Handy when reading logs and JWT exp claims.',
        'thumbnail': 'images/tools/hub.jpg',
        'template': 'tools/timestamp.html',
    },
    {
        'slug': 'json-format',
        'title': 'JSON Formatter',
        'category': 'Utilities',
        'icon': 'fa-file-code',
        'excerpt': 'Pretty-print or minify JSON in the browser. Validates syntax as you go.',
        'thumbnail': 'images/tools/hub.jpg',
        'template': 'tools/json.html',
    },
    {
        'slug': 'password',
        'title': 'Password Generator',
        'category': 'Utilities',
        'icon': 'fa-shield-halved',
        'excerpt': 'Generate strong random passwords with length and charset controls. Local only.',
        'thumbnail': 'images/tools/crypto.jpg',
        'template': 'tools/password.html',
    },
    {
        'slug': 'regex',
        'title': 'Regex Tester',
        'category': 'Utilities',
        'icon': 'fa-magnifying-glass',
        'excerpt': 'Test JavaScript regular expressions against sample text with flags and match list.',
        'thumbnail': 'images/tools/hub.jpg',
        'template': 'tools/regex.html',
    },
    {
        'slug': 'cidr',
        'title': 'CIDR / Subnet Calc',
        'category': 'Recon',
        'icon': 'fa-diagram-project',
        'excerpt': 'Parse IPv4 CIDR — network, broadcast, usable range, and host count.',
        'thumbnail': 'images/tools/recon.jpg',
        'template': 'tools/cidr.html',
    },
]


def get_all_tools():
    return TOOLS


def get_tool(slug):
    return next((t for t in TOOLS if t['slug'] == slug), None)


def get_tool_categories():
    cats = []
    for t in TOOLS:
        if t['category'] not in cats:
            cats.append(t['category'])
    return cats
