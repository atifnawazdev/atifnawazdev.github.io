# Atif Nawaz — Immersive Portfolio

Cinematic, scroll-driven portfolio: persistent Three.js scene, GSAP + ScrollTrigger, Lenis smooth scroll.
No build step — it's static files.

## Run it

Modules need a web server (double-clicking `index.html` won't work):

```bash
cd atif-portfolio
python3 -m http.server 8000      # or: npx serve
# open http://localhost:8000
```

Deploy by uploading the folder to Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.
An internet connection is needed for the CDN libraries (Three.js, GSAP, Lenis) and Google Fonts.

## What to edit — `content.js`

| What | Where |
|---|---|
| Email, phone, LinkedIn, YouTube | `CONTACT` — blank values are hidden on the live site |
| Work projects (add / remove / reorder) | `PROJECTS` — currently your seven live sites. Set `relation` (`built` / `contributed`), `role`, `summary` and `highlights` per project |
| Screenshots | Curated section crops live in `assets/<slug>-desktop.jpg` / `-mobile.jpg` (cart drawer, bundle selector, size picker, product sliders, mega menus). Metabolae and Pinnafit are set `hidden: true` in `content.js` until you supply screenshots |
| Built / contributed / concept | `relation` (keep `"concept"` until you have built and verified a showcase): `"built"`, `"contributed"` or `"concept"` (shown as a badge), plus `role` and `theme` |

While running on localhost you'll see "ADD IN content.js" hints on anything still empty.
Other copy lives in `index.html`; colours are CSS variables at the top of `styles.css`.

## Files

- `index.html` — semantic structure, SEO meta, JSON-LD
- `styles.css` — design system + responsive rules
- `main.js` — loader, WebGL scene, scroll choreography
- `content.js` — your editable data
- `assets/atif.jpg` — your portrait (About section)
- `_archive/` — the earlier concept mockups, not loaded by the site

## How the experience is built

- **Full-screen WebGL scene**: one fixed fragment shader. You travel down a corridor of product-grid panels while lime frames (screens) rush past and panels light up in data pulses. The corridor reshapes per chapter and reacts to scroll speed and pointer.
- **Scroll sequence** (About): a canvas "frame sequence" where a storefront assembles itself — wireframe → Liquid → alignment → polished — driven by scroll.
- **3D browser windows** (Expertise): five CSS-3D windows scrubbed by a pinned scroll, with pointer tilt.
- **Work**: a case study per project: pinned hero where the storefront scales to fill the screen, details with a Built/Contributed/Concept badge, then a gallery with cinematic image reveals and drifting phone mockups.
- **Reduced motion / no JS libs**: everything stays visible; pinning and animation are skipped.
- **Mobile**: lower pixel ratio, fewer particles, no antialiasing, lighter geometry, simplified layouts.

## Not included (yet)

- Rive: needs `.riv` files made in the Rive editor.
- Next.js / React Three Fiber port.
- Real project screenshots, favicon and social-share image.
