/* ==========================================================================
   ATIF NAWAZ — immersive portfolio
   Stack: Three.js (persistent WebGL scene) · GSAP + ScrollTrigger · Lenis
   No build step: libraries come from CDN (see index.html).
   Sections of this file:
     1. helpers            5. hero / intro / sequence
     2. DOM preparation    6. expertise (3D browser windows)
     3. WebGL scene        7. work · process · tech · contact
     4. boot + loader      8. cursor, nav, magnetic buttons
   ========================================================================== */
import { CONTACT, PROJECTS } from "./content.js";

/* ------------------------------------------------------------ 1. helpers */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const libsOK = !!(window.gsap && window.ScrollTrigger);
const reduced = prefersReduced || !libsOK;
if (reduced) root.classList.add("rm");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

let lenis = null;
let gl = null;
let introPlayed = false;

/** Split an element's text into masked words/chars. Returns the char spans. */
function splitText(el, { mask = true, label = true } = {}) {
  if (el.dataset.split) return $$(".c", el);
  const text = el.textContent.replace(/\s+/g, " ").trim();
  if (label) el.setAttribute("aria-label", text);
  el.dataset.split = "1";
  el.textContent = "";
  text.split(" ").forEach((word, wi, arr) => {
    const w = document.createElement("span");
    w.className = "w" + (mask ? "" : " free");
    w.setAttribute("aria-hidden", "true");
    [...word].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "c";
      c.textContent = ch;
      w.appendChild(c);
    });
    el.appendChild(w);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return $$(".c", el);
}

/** Wrap each word in a span (used for scroll-illuminated paragraphs). */
function splitWords(el) {
  const words = el.textContent.replace(/\s+/g, " ").trim().split(" ");
  el.textContent = "";
  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "word";
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return $$(".word", el);
}

/* ------------------------------------------------- 2. DOM preparation */
const isDevHost = ["localhost", "127.0.0.1", "[::1]", ""].includes(location.hostname) || location.protocol === "file:";
if (isDevHost) root.classList.add("dev-hint");

function wireContact() {
  const { email, phone, phoneDisplay } = CONTACT;
  const norm = (u) => (u && !/^https?:/i.test(u) ? "https://" + u : u);
  const linkedin = norm(CONTACT.linkedin), youtube = norm(CONTACT.youtube);
  const pretty = (u) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const missing = [];
  $$("[data-contact]").forEach((a) => {
    const k = a.dataset.contact;
    let href = "", label = "";
    if (k === "email" && email) { href = `mailto:${email}`; label = email; }
    if (k === "phone" && phone) { href = `tel:${phone}`; label = phoneDisplay || phone; }
    if (k === "linkedin" && linkedin) { href = linkedin; label = pretty(linkedin); }
    if (k === "whatsapp" && CONTACT.whatsapp) { href = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Atif, I found your portfolio and would like to discuss a Shopify project.")}`; label = "WhatsApp"; }
    if (k === "youtube" && youtube) { href = youtube; label = pretty(youtube); }
    if (k === "start") {
      if (email) href = `mailto:${email}?subject=${encodeURIComponent("Shopify project enquiry")}`;
      else if (linkedin) href = linkedin;
    }
    const val = $("[data-val]", a);
    if (href) {
      a.href = href;
      if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      if (val && label) val.textContent = label;
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      a.classList.add("is-missing");
      a.tabIndex = -1;
      if (k !== "start" && !missing.includes(k)) missing.push(k);
    }
  });
  if (missing.length) console.warn(`[portfolio] Add these in content.js → CONTACT: ${missing.join(", ")}`);
}

function artSVG(kind) {
  let body = "";
  if (kind === "stripes") {
    for (let k = -6; k < 40; k++) body += `<line x1="${k * 55}" y1="1000" x2="${k * 55 + 900}" y2="0" stroke="rgba(233,233,229,.06)" stroke-width="1"/>`;
    body += `<line x1="760" y1="1000" x2="1660" y2="0" stroke="rgba(181,239,66,.55)" stroke-width="3"/>`;
  } else if (kind === "dots") {
    for (let gx = 0; gx < 33; gx++) for (let gy = 0; gy < 21; gy++) {
      const hot = (gx * 3 + gy * 5) % 17 === 0;
      body += `<circle cx="${gx * 50 + 25}" cy="${gy * 50 + 25}" r="${hot ? 5 : 2}" fill="${hot ? "rgba(181,239,66,.8)" : "rgba(233,233,229,.12)"}"/>`;
    }
  } else {
    for (let r = 120; r < 1400; r += 110) body += `<circle cx="1150" cy="520" r="${r}" fill="none" stroke="rgba(233,233,229,.06)"/>`;
    body += `<circle cx="1150" cy="520" r="430" fill="none" stroke="rgba(181,239,66,.45)" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;
}

function placeholder(kind, label = "") {
  const nav = kind === "desk" ? '<span style="display:flex;gap:5%;width:42%;height:45%"><i class="bx" style="flex:1"></i><i class="bx" style="flex:1"></i><i class="bx" style="flex:1"></i></span>' : '<i class="bx" style="width:16%;height:60%"></i>';
  const cards = kind === "desk" ? 4 : 2;
  return `<div class="ph" aria-hidden="true">
    <div class="ph-h"><i class="bx" style="width:${kind === "desk" ? 16 : 28}%;height:60%"></i>${nav}</div>
    <div class="bx ph-hero"></div>
    <div class="ph-grid">${'<i class="bx"></i>'.repeat(cards)}</div>
    <span class="ph-label">${esc(label || "Screenshot")} · SCREENSHOT PENDING</span>
  </div>`;
}

const REL = { built: "Built by me", contributed: "Development contribution", concept: "Concept" };

function buildScenes() {
  const stage = $("#workStage");
  const hud = $(".work-hud", stage);
  const total = PROJECTS.length;
  $("#workTotal").textContent = pad2(total);
  PROJECTS.forEach((p, i) => {
    let host = p.category;
    if (p.url) { try { host = new URL(p.url).hostname.replace(/^www\./, ""); } catch {} }
    const shot = (src, kind, what) => src
      ? `<img src="${esc(src)}" alt="${esc(p.title)} — ${what} storefront" data-kind="${kind}" data-label="${esc(host)} · ${what}" loading="lazy" decoding="async">`
      : placeholder(kind, `${host} · ${what}`);
    const deskFrame = `<div class="frame frame--desk">
        <div class="win-bar"><i></i><i></i><i></i><span class="win-url">${esc(host)}</span></div>
        <div class="frame-screen">${shot(p.desktopImage, "desk", "desktop")}</div></div>`;
    const mobFrame = `<div class="frame frame--mob"><div class="frame-screen">${shot(p.mobileImage, "mob", "mobile")}</div></div>`;
    const wrap = (inner) => p.url
      ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" data-cursor="VISIT" aria-label="Visit ${esc(p.title)} (opens in a new tab)">${inner}</a>`
      : inner;
    const rel = REL[p.relation];
    const el = document.createElement("article");
    el.className = "scene scene--project";
    el.dataset.scene = String(i + 1);
    el.setAttribute("aria-label", p.title);
    el.innerHTML = `
      <div class="scene-cam">
        <div class="scene-bg">${artSVG(p.art)}</div>
        <div class="scene-cat mono"><span>${esc(p.category)}</span>${rel ? `<span class="badge badge--${esc(p.relation)}">${rel}</span>` : ""}</div>
        <div class="scene-num mono">${pad2(i + 1)} / ${pad2(total)}</div>
        <h3 class="scene-title">${esc(p.title)}</h3>
        <div class="mock mock--desk">${wrap(deskFrame)}</div>
        <div class="mock mock--mob">${wrap(mobFrame)}</div>
        <div class="scene-info">
          ${p.role ? `<p class="role">${esc(p.role)}</p>` : ""}
          <p>${esc(p.summary || "A live ecommerce storefront.")}</p>
          <ul>${(p.highlights || []).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
          ${p.url ? `<a class="scene-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Visit ${esc(host)} <span aria-hidden="true">↗</span></a>` : ""}
        </div>
      </div>
      <div class="scene-shade"></div>`;
    stage.insertBefore(el, hud);
    /* until a screenshot file exists, show the labelled placeholder instead of a broken image */
    /* fit the frame to each screenshot's own aspect ratio: no padding, no cropping of content */
    $$("img[data-kind]", el).forEach((im) => im.addEventListener("load", () => {
      if (!im.naturalWidth) return;
      const mob = im.dataset.kind === "mob";
      if (mob) return; /* phone frames keep one fixed size for every project (see CSS) */
      const r = Math.min(3.2, Math.max(1.0, im.naturalWidth / im.naturalHeight));
      im.parentElement.style.aspectRatio = String(r);
      if (!mob) { const mk = im.closest(".mock--desk"); if (mk) mk.style.width = `min(52vw, ${(60 * r).toFixed(1)}vh)`; }
    }));
    $$("img[data-kind]", el).forEach((im) => im.addEventListener("error", () => {
      const holder = im.parentElement;
      holder.innerHTML = placeholder(im.dataset.kind, im.dataset.label);
    }, { once: true }));
  });
  // wrap the intro scene's content in a camera wrapper too (for the push-out)
  const intro = $(".scene--intro", stage);
  const inner = $(".scene-inner", intro);
  const cam = document.createElement("div");
  cam.className = "scene-cam";
  intro.insertBefore(cam, inner);
  cam.appendChild(inner);
  const shade = document.createElement("div");
  shade.className = "scene-shade";
  intro.appendChild(shade);
}

/* expertise: five CSS-3D browser windows with distinct animated interfaces */
const WIN_URLS = ["theme / sections / featured-product.liquid", "journey / home → collection → product → cart", "product / gallery + variants", "audit / friction points", "viewport / 1440 → 768 → 390"];
function winBody(i) {
  if (i === 0) {
    const L = [
      '<span class="c">{% comment %} sections/featured-product.liquid {% endcomment %}</span>',
      '<span class="t">&lt;section</span> class=<span class="s">"featured"</span><span class="t">&gt;</span>',
      '  {%- for variant in product.variants -%}',
      '    {% render <span class="s">\'swatch\'</span>, variant: variant %}',
      '  {%- endfor -%}',
      '<span class="t">&lt;/section&gt;</span>',
      '',
      '{% schema %}',
      '  { <span class="s">"name"</span>: <span class="s">"Featured product"</span>,',
      '    <span class="s">"presets"</span>: [{ <span class="s">"name"</span>: <span class="s">"Featured product"</span> }] }',
      '{% endschema %}',
    ];
    return `<div class="code">${L.map((l, n) => `<span class="code-line" style="--n:${n}">${l || " "}</span>`).join("")}</div>`;
  }
  if (i === 1) {
    const n = (t) => `<div class="flow-node"><span>${t}</span><div style="display:grid;gap:.3rem"><i class="bx" style="height:.4rem"></i><i class="bx" style="height:.4rem;width:70%"></i><i class="bx" style="height:.4rem;width:45%"></i></div></div>`;
    return `<div class="flow">${n("Home")}${n("Collection")}${n("Product")}${n("Cart")}</div>`;
  }
  if (i === 2) {
    return `<div class="pdp">
      <div class="pdp-thumbs"><i class="bx"></i><i class="bx"></i><i class="bx"></i></div>
      <div class="pdp-main"></div>
      <div class="pdp-info">
        <i class="bx" style="height:.9rem;width:80%"></i><i class="bx" style="height:.6rem;width:35%"></i>
        <div class="sw"><i></i><i></i><i></i></div>
        <div class="chips"><i>S</i><i>M</i><i>L</i><i>XL</i></div>
        <i class="bx l" style="height:1.9rem;margin-top:auto"></i>
      </div></div>`;
  }
  if (i === 3) {
    return `<div class="cro">
      <i class="bx" style="height:1.3rem"></i>
      <div class="bx o" style="position:relative"><i class="bx" style="position:absolute;left:8%;top:18%;width:42%;height:.9rem"></i><i class="bx" style="position:absolute;left:8%;top:34%;width:30%;height:.9rem"></i><i class="bx l" style="position:absolute;left:8%;top:56%;width:20%;height:1.5rem"></i><i class="bx" style="position:absolute;right:6%;top:12%;width:34%;height:70%"></i></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem"><i class="bx" style="height:2.6rem"></i><i class="bx" style="height:2.6rem"></i><i class="bx" style="height:2.6rem"></i></div>
      <i class="pin" style="left:30%;top:46%;animation-delay:0s" data-t="Clear CTA">1</i>
      <i class="pin" style="left:58%;top:30%;animation-delay:.6s" data-t="Fewer steps">2</i>
      <i class="pin" style="left:10%;top:82%;animation-delay:1.2s" data-t="Trust cues">3</i>
    </div>`;
  }
  const dev = (cls, label, rows) => `<div class="dev ${cls}">${rows}<span>${label}</span></div>`;
  const rows = '<i class="bx" style="height:.5rem"></i><i class="bx l" style="height:.5rem;width:40%"></i><i class="bx" style="height:2.2rem"></i><i class="bx" style="height:.5rem;width:70%"></i>';
  return `<div class="resp">${dev("desk", "1440", rows)}${dev("tab", "768", rows)}${dev("mob", "390", rows)}</div>`;
}
function buildWindows() {
  const stage = $("#exStage");
  const tilt = document.createElement("div");
  tilt.className = "ex-tilt";
  for (let i = 0; i < 5; i++) {
    const w = document.createElement("div");
    w.className = "win";
    w.innerHTML = `<div class="win-bar"><i></i><i></i><i></i><span class="win-url">${WIN_URLS[i]}</span></div><div class="win-body">${winBody(i)}</div>`;
    tilt.appendChild(w);
  }
  stage.appendChild(tilt);
}

const TECH = [
  { file: "product-grid.liquid", code: "{% for product in collection.products %}\n  {% render 'product-card',\n     product: product,\n     lazy: forloop.index > 4 %}\n{% endfor %}" },
  { file: "index.html", code: '<main id="main">\n  <section aria-labelledby="featured">\n    <h2 id="featured">Featured</h2>\n  </section>\n</main>' },
  { file: "product-grid.css", code: ".product-grid {\n  display: grid;\n  grid-template-columns:\n    repeat(auto-fill, minmax(220px, 1fr));\n  gap: 1.5rem;\n}" },
  { file: "variant-picker.js", code: "document\n  .querySelectorAll('[data-variant]')\n  .forEach((input) => {\n    input.addEventListener('change', updateVariant);\n  });" },
  { file: "templates/product.json", code: '{\n  "sections": {\n    "main": { "type": "main-product" }\n  },\n  "order": ["main"]\n}' },
  { file: "animations.js", code: "gsap.from('.product-card', {\n  y: 40,\n  opacity: 0,\n  stagger: 0.08,\n  ease: 'power3.out'\n});" },
  { file: "terminal", code: "$ git switch -c feature/product-gallery\n$ git add sections/\n$ git commit -m \"Add variant selector\"" },
];
const TECH_MARQUEE = ["Shopify Liquid", "HTML5", "CSS3", "JavaScript", "Online Store 2.0", "GSAP", "Git"];
function buildMarquees() {
  $$(".marquee-track").forEach((t) => {
    const html = TECH_MARQUEE.map((n) => `<span>${esc(n)}</span>`).join("");
    t.innerHTML = html + html;
  });
  const band = $(".band-row--a");
  if (band) band.innerHTML += band.innerHTML; // longer travel
}

/* ------------------------------------------------------- 3. WebGL scene */
const KEYS = ["hw", "hh", "roll", "tile", "lime", "dim", "F", "portal"];
/* hw/hh: tunnel half width/height · roll: camera roll · tile: panel size · lime: accent energy
   dim: overall brightness (kept low behind text-heavy chapters) · F: spacing of lime frames · portal: far-end light */
const KF_DESKTOP = {
  hero:      { hw: 2.2, hh: 1.35, roll: 0.0,  tile: 0.9,  lime: 1.0,  dim: 1.0,  F: 4.0, portal: 0.0 },
  about:     { hw: 1.5, hh: 1.5,  roll: 0.35, tile: 0.75, lime: 0.85, dim: 0.62, F: 3.0, portal: 0.0 },
  expertise: { hw: 2.5, hh: 1.1,  roll: -0.22, tile: 0.6, lime: 0.8,  dim: 0.52, F: 2.2, portal: 0.0 },
  work:      { hw: 1.8, hh: 1.8,  roll: 0.0,  tile: 1.2,  lime: 0.5,  dim: 0.32, F: 6.0, portal: 0.0 },
  process:   { hw: 1.15, hh: 2.0, roll: 0.6,  tile: 0.8,  lime: 1.1,  dim: 0.55, F: 2.0, portal: 0.0 },
  tech:      { hw: 2.7, hh: 0.9,  roll: 0.0,  tile: 0.4,  lime: 1.0,  dim: 0.5,  F: 1.5, portal: 0.0 },
  contact:   { hw: 1.6, hh: 1.0,  roll: 0.0,  tile: 0.9,  lime: 1.2,  dim: 0.8,  F: 3.5, portal: 1.0 },
};
const KF_MOBILE = {
  hero:      { hw: 2.0, hh: 1.6, roll: 0.0,  tile: 0.9,  lime: 0.9,  dim: 0.78, F: 4.0, portal: 0.0 },
  about:     { hw: 1.5, hh: 1.5, roll: 0.3,  tile: 0.75, lime: 0.8,  dim: 0.42, F: 3.0, portal: 0.0 },
  expertise: { hw: 2.0, hh: 1.2, roll: -0.2, tile: 0.6,  lime: 0.75, dim: 0.4,  F: 2.2, portal: 0.0 },
  work:      { hw: 1.8, hh: 1.8, roll: 0.0,  tile: 1.2,  lime: 0.45, dim: 0.25, F: 6.0, portal: 0.0 },
  process:   { hw: 1.3, hh: 2.0, roll: 0.5,  tile: 0.8,  lime: 1.0,  dim: 0.4,  F: 2.0, portal: 0.0 },
  tech:      { hw: 2.2, hh: 1.0, roll: 0.0,  tile: 0.45, lime: 0.9,  dim: 0.38, F: 1.5, portal: 0.0 },
  contact:   { hw: 1.6, hh: 1.2, roll: 0.0,  tile: 0.9,  lime: 1.1,  dim: 0.6,  F: 3.5, portal: 0.9 },
};
const KF_ORDER = ["hero", "about", "expertise", "work", "process", "tech", "contact"];

/* Full-screen fragment shader: you travel down a storefront "corridor" made of
   product-grid panels. Lime frames (browser windows / screens) rush past, panels
   light up in data pulses, and the corridor reshapes per chapter. */
const FRAG = /* glsl */ `
precision highp float;
uniform float uTime, uTravel, uVel, uIntro;
uniform vec2 uRes, uMouse;
uniform vec4 uA;   // hw, hh, roll, tile
uniform vec4 uB;   // lime, dim, frame spacing, portal
const vec3 BG   = vec3(0.0627, 0.0706, 0.0784);
const vec3 LIME = vec3(0.710, 0.937, 0.259);
const vec3 OFF  = vec3(0.914, 0.914, 0.898);

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main(){
  vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  p *= rot(uA.z + uVel * 0.04);
  p -= uMouse * 0.14;
  vec3 rd = normalize(vec3(p, 1.2));

  float hw = uA.x, hh = uA.y, s = uA.w;
  float tx = hw / max(abs(rd.x), 1e-4);
  float ty = hh / max(abs(rd.y), 1e-4);
  bool side = tx < ty;
  float t = side ? tx : ty;
  vec3 hit = rd * t;
  hit.z += uTravel;
  vec2 uv = side ? vec2(hit.y + 7.0 * sign(rd.x), hit.z) : vec2(hit.x + 13.0 * sign(rd.y), hit.z);

  vec2 g = uv / s;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float aa = clamp(2.4 * t / (uRes.y * s), 0.003, 0.5);
  vec2 e = min(f, 1.0 - f);
  float line = 1.0 - smoothstep(0.0, aa * 1.3 + 0.012, min(e.x, e.y));

  float h = hash(id + (side ? 3.0 : 9.0));
  vec3 panel = mix(vec3(0.100, 0.112, 0.125), vec3(0.190, 0.210, 0.230), h);
  // soft vertical falloff inside each panel, like a lit tile
  panel *= 0.82 + 0.18 * smoothstep(0.0, 0.5, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));

  // data pulses: tiles light up in waves travelling toward the camera
  float pulse = sin(id.y * 0.55 - uTime * 1.4 + h * 3.0) * 0.5 + 0.5;
  float lit = smoothstep(0.88, 1.0, pulse * 0.85 + h * 0.2) * step(0.3, h);
  vec3 col = panel;
  col += LIME * lit * 0.55 * uB.x;
  col = mix(col, OFF * 0.7, line * (0.16 + 0.3 * lit));

  // lime frames: screens racing past
  float F = uB.z;
  float fz = abs(fract(hit.z / F + 0.5) - 0.5) * F;
  float ring = 1.0 - smoothstep(0.0, 0.035 + aa * s * 1.6, fz);
  float ringGlow = exp(-fz * 3.2);
  col += LIME * (ring * 1.0 + ringGlow * 0.20) * uB.x * (1.0 + uVel * 1.5);

  // moving light that follows the pointer: metallic sheen
  vec3 L = vec3(uMouse.x * hw * 0.85, uMouse.y * hh * 0.85, uTravel + 2.8);
  float d = length(hit - L);
  col += mix(OFF, LIME, 0.55) * (0.26 / (1.0 + d * d * 0.55)) * (0.35 + panel.r * 3.0);

  // depth fog + far-end portal
  float fog = exp(-t * 0.12);
  col = mix(BG, col, fog);
  float c2 = dot(p, p);
  col += mix(LIME, OFF, 0.35) * uB.w * exp(-c2 * 4.2) * 0.55;

  col = mix(BG, col, uB.y * uIntro);
  col *= mix(0.45, 1.0, 1.0 - smoothstep(0.35, 2.0, length(p * vec2(0.8, 1.0))));
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 160.0;
  gl_FragColor = vec4(col, 1.0);
}`;

async function initGL() {
  const THREE = await import("three");
  const canvas = $("#gl");
  const mobile = innerWidth < 900 || matchMedia("(pointer: coarse)").matches;
  const KF = mobile ? KF_MOBILE : KF_DESKTOP;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(mobile ? 0.7 : Math.min(devicePixelRatio || 1, 1.25));
  renderer.setClearColor(0x101214, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 }, uTravel: { value: 0 }, uVel: { value: 0 }, uIntro: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(0, 0) },
    uA: { value: new THREE.Vector4() }, uB: { value: new THREE.Vector4() },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: FRAG,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  const cur = { ...KF.hero };
  const intro = { fly: 0, fade: 1 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let chapters = [], lastY = 0, vel = 0, travel = 0, hasPointer = false;
  let lastW = innerWidth, lastH = innerHeight;

  function measure() {
    chapters = KF_ORDER.map((id) => {
      const el = document.querySelector(`[data-chapter="${id}"]`);
      const r = el.getBoundingClientRect();
      return { id, top: r.top + scrollY, h: r.height };
    });
  }
  function poseAt(y) {
    const vh = innerHeight, m = y + vh * 0.5, w = vh * 0.5;
    let c = 0;
    while (c < chapters.length - 1 && m >= chapters[c + 1].top) c++;
    const blend = (a, b, u) => { const o = {}; KEYS.forEach((k) => (o[k] = lerp(KF[a][k], KF[b][k], u))); return o; };
    const id = chapters[c].id;
    if (c > 0 && m - chapters[c].top < w) return blend(chapters[c - 1].id, id, smooth(clamp01((m - chapters[c].top + w) / (2 * w))));
    if (c < chapters.length - 1 && chapters[c + 1].top - m < w) return blend(id, chapters[c + 1].id, smooth(clamp01((m - chapters[c + 1].top + w) / (2 * w))));
    return KF[id];
  }

  function resize(force) {
    const w = innerWidth, h = innerHeight;
    if (!force && w === lastW && Math.abs(h - lastH) < 160) return; // ignore mobile URL-bar resizes
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    renderer.getDrawingBufferSize(uniforms.uRes.value);
  }
  resize(true);
  addEventListener("resize", () => { resize(false); if (reduced) draw(0, 0.016, true); });

  if (finePointer && !reduced) {
    addEventListener("pointermove", (e) => {
      hasPointer = true;
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });
  }

  function draw(time, dt, snap) {
    const y = scrollY;
    const target = reduced ? KF.hero : poseAt(y);
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.2);
    KEYS.forEach((key) => (cur[key] += (target[key] - cur[key]) * k));

    if (!hasPointer && !reduced) { mouse.tx = Math.sin(time * 0.22) * 0.18; mouse.ty = Math.cos(time * 0.17) * 0.1; }
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 2.5));
    mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 2.5));

    const dy = (y - lastY) / Math.max(dt, 0.001);
    lastY = y;
    vel += (clamp01(Math.abs(dy) / 3500) - vel) * (1 - Math.exp(-dt * 4));

    travel = reduced ? 0 : y * 0.0042 + time * 0.28;
    uniforms.uTime.value = reduced ? 1.0 : time;
    uniforms.uTravel.value = travel - intro.fly;
    uniforms.uVel.value = vel;
    uniforms.uIntro.value = intro.fade;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uA.value.set(cur.hw, cur.hh, cur.roll, cur.tile);
    uniforms.uB.value.set(cur.lime, cur.dim, cur.F, cur.portal);
    renderer.render(scene, camera);
  }

  intro.fade = 0;
  measure();
  draw(0, 0.016, true);

  return {
    measure,
    setCovered() {},
    render(time, dt) {
      if (reduced || document.hidden) return;
      draw(time, Math.min(dt, 0.05), false);
    },
    /* cinematic intro: the corridor fades up while the camera flies forward */
    intro() {
      if (reduced) { intro.fade = 1; intro.fly = 0; draw(0, 0.016, true); return; }
      intro.fly = 26; intro.fade = 0;
      return gsap.timeline()
        .to(intro, { fade: 1, duration: 2.2, ease: "power2.out" }, 0)
        .to(intro, { fly: 0, duration: 3.6, ease: "expo.out" }, 0);
    },
    snapIntro() { intro.fade = 1; intro.fly = 0; },
  };
}

/* ------------------------------------------------ 4. boot + loader */
async function boot() {
  wireContact();
  buildScenes();
  buildWindows();
  buildMarquees();
  prepTerminal();

  if (!libsOK || reduced) {
    // reduced motion, or CDN unreachable: everything stays visible and readable
    try { gl = await initGL(); gl.intro(); } catch (e) { console.warn("[portfolio] WebGL disabled:", e); root.classList.add("no-webgl"); }
    buildSeq();
    setupMotionless();
    wireNavBasic();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const glPromise = initGL().catch((e) => { console.warn("[portfolio] WebGL disabled:", e); root.classList.add("no-webgl"); return null; });
  const fonts = document.fonts?.ready ?? Promise.resolve();

  /* ---- loader ---- */
  root.classList.add("is-loading");
  const loader = $("#loader");
  const word = $("#loaderWord");
  const count = $("#loaderCount");
  const bar = $("#loaderBar");
  const wordChars = splitText(word, { mask: false, label: false });
  gsap.from(wordChars, { yPercent: 100, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.04 });
  const prog = { v: 0 };
  const paint = () => {
    count.textContent = String(Math.round(prog.v)).padStart(3, "0");
    gsap.set(bar, { scaleX: prog.v / 100 });
  };
  const toNinety = gsap.to(prog, { v: 90, duration: 2.2, ease: "power2.out", onUpdate: paint });
  const minWait = new Promise((r) => setTimeout(r, 1500));

  [gl] = await Promise.all([glPromise, fonts, minWait]);
  toNinety.kill();

  initLenis();
  buildSeq();
  setupAll();
  wireNavFull();
  initCursor();
  setupVelocitySkew();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  ScrollTrigger.refresh();
  gl?.measure();

  await new Promise((resolve) => gsap.to(prog, { v: 100, duration: 0.5, ease: "power2.inOut", onUpdate: paint, onComplete: resolve }));

  /* ---- reveal ---- */
  const exit = gsap.timeline({
    onComplete: () => {
      loader.remove();
      root.classList.remove("is-loading");
      lenis?.start();
      introPlayed = true;
    },
  });
  lenis?.stop();
  exit.to(word.querySelectorAll(".c"), { yPercent: -100, opacity: 0, duration: 0.6, ease: "power3.in", stagger: 0.02 }, 0)
    .to([".loader-top", ".loader-bottom"], { opacity: 0, duration: 0.4 }, 0.1)
    .fromTo(loader, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, 0.45)
    .add(() => { gl?.intro(); heroIntro?.play(); }, 0.75);
}

/* ------------------------------------------------------------ Lenis */
function initLenis() {
  if (!window.Lenis) return;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time, dt) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}
/* single render loop (separate from lenis so it can be paused independently) */
function startRenderLoop() {
  if (!gl) return;
  gsap.ticker.add((time, dt) => gl.render(time, dt / 1000));
}

/* ------------------------------------------- 5. hero / intro / sequence */
let heroIntro = null;

const SEQ = { p: 0 };
let seqCtx = null, seqW = 0, seqH = 0;
const sr = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
const SEQ_EL = (() => {
  const a = [];
  let i = 0;
  const add = (k, x, y, w, h) => a.push({ k, x, y, w, h, i, jx: sr(i + 1), jy: sr(i + 7) }) && i++;
  add("hdr", 0.04, 0.05, 0.92, 0.09);
  add("logo", 0.06, 0.072, 0.1, 0.045);
  for (let n = 0; n < 3; n++) add("nav", 0.5 + n * 0.1, 0.078, 0.08, 0.034);
  add("cart", 0.86, 0.07, 0.07, 0.05);
  add("hero", 0.04, 0.18, 0.92, 0.34);
  add("h1", 0.08, 0.25, 0.42, 0.06);
  add("h2", 0.08, 0.33, 0.3, 0.045);
  add("cta", 0.08, 0.42, 0.15, 0.065);
  add("img", 0.56, 0.2, 0.36, 0.3);
  for (let c = 0; c < 4; c++) {
    const x = 0.04 + c * 0.2375;
    add("card", x, 0.57, 0.2125, 0.37);
    add("cimg", x + 0.012, 0.585, 0.2125 - 0.024, 0.24);
    add("ct", x + 0.012, 0.845, 0.12, 0.03);
    add("cp", x + 0.012, 0.89, 0.06, 0.025);
  }
  return a;
})();
const SEQ_NAMES = ["01 / 04 — WIREFRAME", "02 / 04 — LIQUID & CODE", "03 / 04 — ALIGN & TUNE", "04 / 04 — POLISHED"];

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A procedurally-rendered "image sequence": the storefront assembles itself as you scroll. */
function drawSeq(p) {
  const ctx = seqCtx;
  if (!ctx) return;
  const W = seqW, H = seqH;
  ctx.clearRect(0, 0, W, H);
  const a = clamp01(p / 0.25), f = clamp01((p - 0.25) / 0.25), g = clamp01((p - 0.5) / 0.25), h = clamp01((p - 0.75) / 0.25);
  const jig = 1 - ease(g);
  const N = SEQ_EL.length;

  /* alignment guides (stage 3) */
  if (g > 0 && h < 1) {
    ctx.save();
    ctx.strokeStyle = `rgba(181,239,66,${0.6 * g * (1 - h)})`;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    [0.04, 0.96].forEach((x) => { ctx.beginPath(); ctx.moveTo(x * W, 0); ctx.lineTo(x * W, H); ctx.stroke(); });
    [0.18, 0.57].forEach((y) => { ctx.beginPath(); ctx.moveTo(0, y * H); ctx.lineTo(W, y * H); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(181,239,66,${g * (1 - h)})`;
    ctx.font = `500 ${Math.max(9, W * 0.014)}px "JetBrains Mono", monospace`;
    ctx.fillText("GRID · 8PX", W * 0.8, H * 0.985);
    ctx.restore();
  }

  SEQ_EL.forEach((el) => {
    const t = ease(clamp01(a * (1 + N * 0.03) - el.i * 0.03));
    if (t <= 0) return;
    const x = el.x * W + el.jx * W * 0.018 * jig;
    const y = el.y * H + el.jy * H * 0.018 * jig;
    const w = el.w * W, hh = el.h * H;
    const container = el.k === "hdr" || el.k === "hero" || el.k === "card";
    const peri = 2 * (w + hh);
    ctx.save();

    /* fills */
    if (!container && f > 0) {
      if (el.k === "cta") {
        ctx.fillStyle = `rgba(181,239,66,${0.1 * f + 0.9 * h})`;
      } else if (el.k === "img" || el.k === "cimg") {
        const gr = ctx.createLinearGradient(x, y, x + w, y + hh);
        gr.addColorStop(0, `rgba(181,239,66,${0.07 * f + (el.k === "img" ? 0.3 : 0.12) * h})`);
        gr.addColorStop(1, `rgba(233,233,229,${0.04 * f + 0.07 * h})`);
        ctx.fillStyle = gr;
      } else {
        ctx.fillStyle = `rgba(233,233,229,${0.09 * f})`;
      }
      rr(ctx, x, y, w, hh, 3);
      ctx.fill();
    }

    /* outline that draws itself on */
    ctx.setLineDash([peri]);
    ctx.lineDashOffset = peri * (1 - t);
    ctx.lineWidth = 1.2;
    const strokeA = (container ? 0.4 : 0.5) * (1 - 0.55 * h);
    ctx.strokeStyle = el.k === "cta" && h > 0 ? `rgba(181,239,66,1)` : `rgba(233,233,229,${strokeA})`;
    rr(ctx, x, y, w, hh, 3);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Liquid code printed into the hero image (stage 2) */
    if (el.k === "img" && f > 0) {
      const lines = ['{% section "hero" %}', "  {% render 'card',", "     product: p %}", "{% schema %}", '  "name": "Hero"', "{% endschema %}"];
      let fs = Math.max(8, W * 0.0125);
      ctx.font = `400 ${fs}px "JetBrains Mono", monospace`;
      /* shrink so the longest line always fits inside the hero image, and clip to it */
      const maxLine = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const room = w * 0.86;
      if (maxLine > room) { fs = Math.max(5, fs * room / maxLine); ctx.font = `400 ${fs}px "JetBrains Mono", monospace`; }
      ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
      ctx.fillStyle = `rgba(181,239,66,${0.9 * f * (1 - h)})`;
      const shown = Math.floor(lines.length * ease(f) + 0.0001);
      lines.slice(0, Math.max(1, shown)).forEach((l, n) => ctx.fillText(l, x + w * 0.07, y + hh * 0.18 + n * fs * 1.6));
    }
    /* product badge (stage 4) */
    if (el.k === "cimg" && h > 0 && el.i % 2 === 0) {
      ctx.fillStyle = `rgba(181,239,66,${h})`;
      rr(ctx, x + w * 0.06, y + hh * 0.06, w * 0.28, hh * 0.1, 2);
      ctx.fill();
    }
    ctx.restore();
  });

  /* pointer click on the CTA (stage 4) */
  if (h > 0) {
    const cta = SEQ_EL.find((e) => e.k === "cta");
    const tx = (cta.x + cta.w * 0.55) * W, ty = (cta.y + cta.h * 0.6) * H;
    const c = ease(clamp01(h / 0.6));
    const px = lerp(W * 0.8, tx, c), py = lerp(H * 0.8, ty, c);
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = "#E9E9E5";
    ctx.strokeStyle = "#101214";
    ctx.lineWidth = 1;
    ctx.beginPath();
    [[0, 0], [0, 16], [4.5, 12.5], [7.5, 19], [10, 18], [7, 11.5], [12, 11.5]].forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    if (h > 0.6) {
      const rp = (h - 0.6) / 0.4;
      ctx.save();
      ctx.strokeStyle = `rgba(181,239,66,${0.8 * (1 - rp)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tx, ty, rp * W * 0.06, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }
}
function sizeSeq() {
  const cv = $("#seqCanvas");
  if (!cv) return;
  const r = cv.getBoundingClientRect();
  if (!r.width) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(r.width * dpr);
  cv.height = Math.round(r.height * dpr);
  seqCtx = cv.getContext("2d");
  seqCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seqW = r.width; seqH = r.height;
  drawSeq(SEQ.p);
}
function updateSeqUI(p) {
  const idx = Math.min(3, Math.floor(p * 4));
  $$("#seqWords li").forEach((li, i) => {
    li.classList.toggle("is-active", i === idx);
    li.classList.toggle("is-done", i < idx);
  });
  $("#seqCaption").textContent = SEQ_NAMES[idx];
}
function buildSeq() {
  sizeSeq();
  addEventListener("resize", sizeSeq);
  updateSeqUI(0);
}

/* ---------------------------------------- main animation setup (GSAP) */
function setupAll() {
  const mm = gsap.matchMedia();
  mm.add({ desktop: "(min-width: 900px)", mobile: "(max-width: 899px)" }, (ctx) => {
    const { desktop } = ctx.conditions;
    setupHero();
    setupHeadings();
    setupIntro();
    setupExpertise(desktop);
    setupWork();
    setupProcess();
    setupTech();
    setupContact();
    setupNavSpy();
    return () => {};
  });
  bindTilt();
  startRenderLoop();
  ScrollTrigger.addEventListener("refresh", () => { gl?.measure(); sizeSeq(); });
}

function setupMotionless() {
  /* reduced motion: content is fully visible; only interactive bits are wired */
  $$("[data-words]").forEach((h) => h.setAttribute("aria-label", h.textContent.trim()));
  drawSeq((SEQ.p = 1));
  $$("#seqWords li").forEach((li, i) => li.classList.add(i === 3 ? "is-active" : "is-done"));
  $("#seqCaption").textContent = SEQ_NAMES[3];
  layoutWindows(0);
  setTech(0, true);
  $$(".step").forEach((s) => s.classList.add("is-done"));
  setupTechEvents();
  setupMagnetic();
}

function setupHero() {
  const lines = $$(".hero-title .line");
  const chars = lines.flatMap((l) => splitText(l, { mask: false, label: false }));
  const words = $$(".hero-title .w");
  const first = !introPlayed;

  if (first) {
    gsap.set(chars, { yPercent: 90, opacity: 0, rotationZ: 7 });
    gsap.set(["#heroRole", "#heroQuote", "#heroSupport", "#scrollInd"], { opacity: 0, y: 24 });
    gsap.set(".hero-bgword", { opacity: 0, scale: 0.9 });
    heroIntro = gsap.timeline({ paused: true })
      .to(".hero-bgword", { opacity: 1, scale: 1, duration: 2, ease: "expo.out" }, 0)
      .to(chars, { yPercent: 0, opacity: 1, rotationZ: 0, duration: 1.5, ease: "expo.out", stagger: 0.07 }, 0.1)
      .to(["#heroRole", "#heroQuote", "#heroSupport", "#scrollInd"], { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.12 }, 0.7);
  }

  /* scroll-out: letters drift through the viewport at different speeds */
  const out = gsap.timeline({
    scrollTrigger: { trigger: ".hero-inner", start: "top top", end: "bottom top", scrub: 0.8 },
  });
  words.forEach((w, i) => out.to(w, { yPercent: -gsap.utils.random(40, 130, 1), rotationZ: gsap.utils.random(-8, 8), ease: "none", duration: 1 }, 0));
  out.to(".hero-title .line--1", { xPercent: -10, ease: "none", duration: 1 }, 0)
    .to(".hero-title .line--2", { xPercent: 10, ease: "none", duration: 1 }, 0)
    .to(".hero-bgword", { xPercent: -14, scale: 1.15, ease: "none", duration: 1 }, 0)
    .to(["#heroRole", "#heroQuote", "#heroSupport"], { y: -80, opacity: 0, ease: "none", duration: 0.6 }, 0)
    .to("#scrollInd", { opacity: 0, duration: 0.15, ease: "none" }, 0);

  gsap.to(".band-row--a", { xPercent: -32, ease: "none", scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });
}

function setupHeadings() {
  $$("[data-words]").forEach((h) => {
    const chars = splitText(h);
    gsap.from(chars, {
      yPercent: 115, duration: 1.15, ease: "expo.out", stagger: 0.016,
      scrollTrigger: { trigger: h, start: "top 88%", once: true },
    });
  });
}

function setupIntro() {
  /* paragraphs illuminate word by word as you scroll */
  $$("#introText p").forEach((p) => {
    const words = $$(".word", p).length ? $$(".word", p) : splitWords(p);
    gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1, ease: "none", stagger: 0.12,
      scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 52%", scrub: true },
    });
  });

  /* DESIGN → DEVELOP → OPTIMIZE → IMPROVE : pinned, scroll-scrubbed frame sequence */
  SEQ.p = 0;
  gsap.to(SEQ, {
    p: 1, ease: "none",
    scrollTrigger: { trigger: "#seqPin", start: "top top", end: "+=320%", pin: true, scrub: 0.6, anticipatePin: 1 },
    onUpdate: () => { drawSeq(SEQ.p); updateSeqUI(SEQ.p); },
  });
}

/* ---------------------------------- 6. expertise: 3D browser windows */
function layoutWindows(v) {
  const wins = $$(".win");
  wins.forEach((w, i) => {
    const d = i - v;
    let x, y, z, op, ry = -15, rx = 5;
    if (d >= 0) {
      x = d * 9; y = -d * 7; z = -d * 230; op = 1 - d * 0.3;
    } else {
      x = d * 80; y = d * 22; z = -d * 140; op = 1 + d * 1.25; ry = -15 + d * 10;
    }
    op = clamp01(op);
    w.style.visibility = op <= 0.01 ? "hidden" : "visible";
    w.style.opacity = op.toFixed(3);
    w.style.zIndex = String(50 - Math.round(Math.abs(d) * 10));
    w.style.transform = `translate3d(${x}%, ${y}%, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
    w.classList.toggle("is-front", Math.abs(d) < 0.5);
  });
  const active = Math.min(4, Math.max(0, Math.round(v)));
  $$(".ex-item").forEach((it, i) => it.classList.toggle("is-active", i === active));
  const c = $("#exCur");
  if (c) c.textContent = pad2(active + 1);
}

function setupExpertise(desktop) {
  const state = { v: 0 };
  layoutWindows(0);
  gsap.to(state, {
    v: 4, ease: "none",
    scrollTrigger: { trigger: "#exPin", start: "top top", end: "+=" + (desktop ? 380 : 340) + "%", pin: true, scrub: 0.7, anticipatePin: 1 },
    onUpdate: () => layoutWindows(state.v),
  });

}

let tiltBound = false;
function bindTilt() {
  if (tiltBound || !finePointer || reduced) return;
  tiltBound = true;
  const tilt = $(".ex-tilt");
  const pin = $("#exPin");
  pin.addEventListener("pointermove", (e) => {
    if (innerWidth < 900) return;
    const r = pin.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.setProperty("--ry", `${nx * 10}deg`);
    tilt.style.setProperty("--rx", `${-ny * 8}deg`);
  });
}

/* ------------------------------------------------- 7. work (pinned scenes) */
function setupWork() {
  const stage = $("#workStage");
  const scenes = $$(".scene", stage);
  const N = scenes.length; // intro + projects
  const idxEl = $("#workIdx"), progEl = $("#workProg");

  gsap.fromTo(".scene--intro .lead", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: "#work", start: "top 40%", once: true } });
  gsap.set(scenes.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: stage, start: "top top",
      end: () => "+=" + N * innerHeight,
      pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (self) => {
        const t = self.progress * tl.duration();
        idxEl.textContent = pad2(Math.min(N - 1, Math.round(t)));
        gsap.set(progEl, { scaleX: self.progress });
      },
    },
  });

  scenes.forEach((sc, i) => {
    if (i === 0) return;
    const T = i;            // time at which this scene is fully visible
    const t0 = T - 0.55;    // wipe starts here
    const q = (s) => $(s, sc);
    const prev = scenes[i - 1];

    /* the previous scene is pushed away (camera pulls back) while this one wipes in */
    tl.to($(".scene-cam", prev), { scale: 0.9, duration: 0.55 }, t0)
      .to($(".scene-shade", prev), { opacity: 0.3, duration: 0.55 }, t0)
      .fromTo(sc, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power2.inOut" }, t0)
      .fromTo(q(".scene-bg"), { yPercent: 12, scale: 1.18 }, { yPercent: 0, scale: 1, duration: 0.55 }, t0)
      .to(q(".scene-bg"), { scale: 1.08, yPercent: -4, duration: 1 }, T)
      .fromTo([q(".scene-cat"), q(".scene-num")], { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04 }, t0 + 0.2);

    const chars = splitText(q(".scene-title"));
    tl.fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 0.4, stagger: { each: 0.012, ease: "none" } }, t0 + 0.12);

    /* scroll-controlled scaling of desktop + mobile mockups, with depth parallax between them */
    tl.fromTo(q(".mock--desk .frame"), { scale: 0.7, yPercent: 14, rotationY: -14, rotationX: 6, transformPerspective: 1400 },
      { scale: 1, yPercent: 0, rotationY: 0, rotationX: 0, duration: 0.7, ease: "power2.out" }, t0 + 0.05)
      .to(q(".mock--desk .frame"), { scale: 1.07, duration: 1 }, T + 0.15)
      .fromTo(q(".mock--mob .frame"), { scale: 0.6, yPercent: 40, rotationY: 16, transformPerspective: 1400 },
        { scale: 1, yPercent: 0, rotationY: 0, duration: 0.75, ease: "power2.out" }, t0 + 0.12)
      .to(q(".mock--mob .frame"), { yPercent: -7, scale: 1.05, duration: 1 }, T + 0.15)
      .fromTo(q(".scene-info").children, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.07 }, t0 + 0.3);
  });
  tl.to({}, { duration: 0.001 }, N); // final scene holds for one unit

  /* portrait: wipe-in reveal with a slow parallax */
  const portrait = $("#portrait");
  if (portrait) {
    const st = { trigger: portrait, start: "top 85%", once: true };
    gsap.fromTo(".portrait-img", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", scrollTrigger: st });
    gsap.fromTo(".portrait-img img", { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: st });
    gsap.fromTo(".portrait-img img", { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: portrait, start: "top bottom", end: "bottom top", scrub: true } });
  }
}

/* ------------------------------------------------------------ process */
function setupProcess() {
  const steps = $$(".step");
  steps.forEach((s) => {
    const t = $(".step-title", s);
    const chars = splitText(t);
    gsap.from(chars, { yPercent: 110, duration: 1, ease: "expo.out", stagger: 0.03, scrollTrigger: { trigger: s, start: "top 72%", once: true } });
  });
  gsap.fromTo("#procFill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#procList", start: "top 60%", end: "bottom 62%", scrub: 0.4 } });
  steps.forEach((s) => {
    ScrollTrigger.create({
      trigger: s, start: "top 62%", end: "bottom 62%",
      onToggle: (self) => s.classList.toggle("is-active", self.isActive),
      onLeave: () => s.classList.add("is-done"),
      onEnterBack: () => s.classList.remove("is-done"),
    });
  });
}

/* --------------------------------------------------------- technology */
let techTween = null;
function prepTerminal() { setTech(0, true); }
function setTech(i, instant) {
  $$(".tech-item").forEach((b, n) => b.classList.toggle("is-active", n === i));
  const t = TECH[i];
  $("#termFile").textContent = t.file;
  const code = $("#termCode");
  techTween?.kill();
  if (instant || reduced || !window.gsap) { code.textContent = t.code; return; }
  const o = { n: 0 };
  techTween = gsap.to(o, {
    n: t.code.length, duration: Math.min(1.3, t.code.length * 0.014), ease: "none",
    onUpdate: () => { code.textContent = t.code.slice(0, Math.round(o.n)); },
  });
}
function setupTechEvents() {
  $$(".tech-item").forEach((b) => {
    const i = +b.dataset.i;
    ["mouseenter", "focus", "click"].forEach((ev) => b.addEventListener(ev, () => setTech(i)));
  });
}
let techEventsBound = false;
function setupTech() {
  if (!techEventsBound) { setupTechEvents(); techEventsBound = true; }
  ScrollTrigger.create({ trigger: ".tech-grid", start: "top 75%", once: true, onEnter: () => setTech(0) });

  /* marquees: speed reacts to scroll velocity */
  $$(".marquee-track").forEach((track) => {
    const dir = +track.dataset.dir;
    const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 55, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: ".tech", start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const v = Math.abs(self.getVelocity());
        gsap.to(tween, { timeScale: 1 + Math.min(v / 250, 7), duration: 0.2, overwrite: true, onComplete: () => gsap.to(tween, { timeScale: 1, duration: 1.2 }) });
      },
    });
  });

  gsap.from(".tech-item", { opacity: 0, x: -40, duration: 0.9, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: ".tech-list", start: "top 80%", once: true } });
}

/* ------------------------------------------------------------ contact */
function setupContact() {
  gsap.from([".contact-copy p", ".cta .btn"], { opacity: 0, y: 36, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".contact-copy", start: "top 85%", once: true } });
  gsap.from(".contact-links li", { opacity: 0, y: 30, duration: 0.9, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: ".contact-links", start: "top 88%", once: true } });
  gsap.from(".footer p", { opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".footer", start: "top 98%", once: true } });
}

/* ---------------------------------------------- 8. nav, cursor, extras */
function scrollToTarget(sel) {
  const el = sel === "#top" ? null : $(sel);
  if (lenis) lenis.scrollTo(el ?? 0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else (el ?? document.body).scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
}
function wireNavBasic() {
  const toggle = $("#navToggle"), menu = $("#navMenu");
  toggle?.addEventListener("click", () => setMenu(menu.hidden));
  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    lenis?.[open ? "stop" : "start"]();
    if (!lenis) root.style.overflow = open ? "hidden" : "";
  }
  $$("[data-scroll]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const inMenu = !!a.closest("#navMenu");
    if (inMenu) setMenu(false);
    setTimeout(() => scrollToTarget(a.dataset.scroll), inMenu ? 60 : 0);
  }));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });
}
function wireNavFull() { wireNavBasic(); setupMagnetic(); }

/* scroll velocity gently skews the big headlines (desktop) */
function setupVelocitySkew() {
  if (!lenis || !finePointer) return;
  const targets = $$(".display");
  const set = gsap.quickSetter(targets, "skewY", "deg");
  let cur = 0;
  gsap.ticker.add(() => {
    const t = gsap.utils.clamp(-3.5, 3.5, lenis.velocity * 0.12);
    cur += (t - cur) * 0.1;
    set(Math.abs(cur) < 0.01 ? 0 : cur);
  });
}

function setupNavSpy() {
  $$("[data-link]").forEach((link) => {
    const ch = document.querySelector(`[data-chapter="${link.dataset.link}"]`);
    if (!ch) return;
    ScrollTrigger.create({
      trigger: ch, start: "top 55%", end: "bottom 55%",
      onToggle: (self) => { link.classList.toggle("is-active", self.isActive); if (self.isActive) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current"); },
    });
  });
}

function setupMagnetic() {
  if (!finePointer || reduced) return;
  $$("[data-magnetic]").forEach((el) => {
    const span = $("span", el);
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: x * 0.25, y: y * 0.35, duration: 0.4, ease: "power3.out" });
      gsap.to(span, { x: x * 0.12, y: y * 0.18, duration: 0.4, ease: "power3.out" });
    });
    el.addEventListener("pointerleave", () => {
      gsap.to([el, span], { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, .4)" });
    });
  });
}

function initCursor() {
  if (!finePointer || reduced) return;
  const cur = $("#cursor");
  const dot = $(".cursor-dot"), ring = $(".cursor-ring");
  const label = $("#cursorLabel");
  const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" }), dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
  gsap.set([dot, ring], { x: -100, y: -100 });
  addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-cursor], a, button");
    cur.classList.remove("is-hover", "is-label");
    if (!t) return;
    if (t.dataset.cursor) { label.textContent = t.dataset.cursor; cur.classList.add("is-label"); }
    else cur.classList.add("is-hover");
  });
  document.documentElement.addEventListener("pointerleave", () => gsap.to(cur, { opacity: 0, duration: 0.2 }));
  document.documentElement.addEventListener("pointerenter", () => gsap.to(cur, { opacity: 1, duration: 0.2 }));
}

/* go */
boot().catch((err) => {
  console.error("[portfolio] boot failed — falling back to static content", err);
  root.classList.remove("is-loading");
  root.classList.add("rm");
  $("#loader")?.remove();
});
