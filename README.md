# Freezestack Website

Production static site for [freezestack.com](https://freezestack.com).

## Folder layout

```
├── website/          ← Deploy THIS folder (Vercel root: website)
│   ├── index.html    ← Entry (redirects to templates)
│   ├── login.html / signup.html
│   ├── templates.html, template.html, prompt-library.html
│   ├── css/  js/  data/  assets/  grok-templates/
├── docs/             ← AUTH-SETUP.md, payment docs
├── scripts/          ← Optional skills sync helpers
```

## Deploy

1. Vercel project: **freezestack** (root directory `website`)
2. Domains: freezestack.com (primary). Old domain xfreeze.com redirects here.
3. Auth: see `docs/AUTH-SETUP.md`.

## Local preview

```bash
cd website
python3 -m http.server 8765
```
