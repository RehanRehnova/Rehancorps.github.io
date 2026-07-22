# Ship REHNOVA Vault free (GitHub only — no store fee)

## Reality check (read this once)

| Want | Possible free? |
|------|----------------|
| Host the files for $0 | **Yes** — GitHub / this site |
| Chrome “Add to Chrome” one button | **No** — Google only allows that via Chrome Web Store ($5) |
| Users never open `chrome://extensions` | **No on Chrome** without the store |

We **skip the paid store**. Best free UX:

1. User lands on **your site** `/vault` (not raw GitHub file browser)
2. Hits **Download free**
3. Unzips + Load unpacked once (3 steps, written on the page)

That is the smoothest path that stays $0 and legal.

---

## What you do (checklist)

### 1. Rebuild the zip (after any extension change)

```powershell
cd C:\Users\muham\Downloads\Rehancorps.github.io
.\extension\pack.ps1
```

This writes:

- `static/downloads/rehnova-vault.zip` ← what `/vault` serves  
- `rehnova-vault-1.1.0.zip` ← optional GitHub Release attach  

### 2. Push the site (free hosting)

Commit and push the whole repo (including `static/downloads/` and `templates/vault.html`).

Your live URLs (after deploy):

| Page | URL |
|------|-----|
| Install | `https://<your-domain>/vault` |
| Zip | `https://<your-domain>/static/downloads/rehnova-vault.zip` |
| Privacy | `https://<your-domain>/static/downloads/vault-privacy.html` |

Nav already has **Vault**. Tools page has a banner → `/vault`.

### 3. Tell people one link only

Share:

```
https://rehancorps.github.io/vault
```

(or whatever host you use). **Not** “go to GitHub → clone → …”

### 4. Optional: GitHub Release

For nerds who want version tags:

1. GitHub → Releases → New  
2. Tag `vault-v1.1.0`  
3. Attach `rehnova-vault-1.1.0.zip`  
4. Body: “Prefer the install page: /vault”

Still point normal users at `/vault`.

---

## User journey (what they see)

1. Open `/vault`  
2. **Download free**  
3. Unzip to e.g. `Documents\rehnova-vault`  
4. `chrome://extensions` → Developer mode → Load unpacked → that folder  
5. Pin extension → Enable AES lock  

---

## Do not bother with (for now)

- Chrome Web Store ($5)  
- Paying for hosting the zip (GitHub Pages / your existing host is enough)  
- Asking users to browse the `extension/` source tree  

---

## Later (only if you want true one-click)

| Store | Cost | Audience |
|-------|------|----------|
| Chrome Web Store | $5 once | Chrome |
| Edge Add-ons | usually $0 | Edge |
| Firefox AMO | $0 | Firefox |

Until then: **GitHub + `/vault` page** is the plan.
