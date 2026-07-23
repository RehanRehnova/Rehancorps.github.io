# REHNOVA Passfill v1.2.1

**Copyright (c) 2026 REHNOVA. All rights reserved.**

Generate · save · fill passwords. Local-first browser extension for Chrome, Edge, Brave, Arc, and Firefox 115+.

| Feature | Detail |
|--------|--------|
| Generate | CSPRNG on password fields |
| Save / fill | Per-site credentials (you confirm) |
| AES lock | AES-256-GCM + PBKDF2 |
| Export / import | JSON backup |
| Network | No vault upload to REHNOVA |

## License (important)

This is **not** MIT / open-source-for-rebrand.

- **Allowed:** free personal / internal use of the **official** package  
- **Not allowed:** redistribute, rebrand, resell, or claim authorship  

Full terms: see **`LICENSE`** and **`COPYRIGHT`** in this folder.

Contact for other rights: **rehnova@proton.me**

## Official download only

Install only from the REHNOVA site **Passfill** page (`/passfill` or `/vault` on the official deployment).  
Packages from random mirrors may be modified or unsafe.

## Install

See the site install guide, or:

1. Unzip so `manifest.json` is at the folder root  
2. Chrome/Edge/Brave: `chrome://extensions` → Developer mode → Load unpacked  
3. Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `manifest.json`

## Install count

On first install, Passfill hits a free public counter (+1). No passwords or sites.
Disable in `config.js`: `PASSFILL_COUNT_ENABLE = false`.

## Publishing a review

1. User submits form on `/passfill` → email to rehnova@proton.me  
2. Add to `data/passfill_reviews.json` and push:

```json
{
  "reviews": [
    { "name": "Ops", "rating": 5, "body": "Solid.", "date": "2026-07-23" }
  ]
}
```

## Pack (maintainers)

```powershell
.\extension\pack.ps1
```

Produces `static/downloads/rehnova-passfill.zip` including LICENSE + COPYRIGHT.
