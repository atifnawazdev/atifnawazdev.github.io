/* ==========================================================================
   EDIT ME — everything in this file is safe to change.
   Nothing here is invented: anything not supplied is left blank and hidden
   (or shown as a clearly labelled "screenshot pending" frame).
   ========================================================================== */

/* ---- Contact ---------------------------------------------------------- */
export const CONTACT = {
  email: "atifnawaz451@gmail.com",
  phone: "+923211717179",
  phoneDisplay: "+92 321 1717179",
  linkedin: "https://www.linkedin.com/in/atif-nawaz-47b07a281",
  whatsapp: "923211717179", // digits only, with country code (opens wa.me chat)
  youtube: "", // e.g. "https://www.youtube.com/@your-channel"  (blank = hidden)
};

/* ---- Projects -----------------------------------------------------------
   Live ecommerce storefronts. Add, remove or reorder freely.

   relation   Be explicit about your part. Shows as a badge; "" hides it.
                "built"       → "Built by me"
                "contributed" → "Development contribution"
   role       One line on what you did, e.g. "Custom cart drawer and product page".
   summary    One or two honest sentences. Leave "" for the default line.
   highlights Short list of what you actually built. [] hides it.
   desktopImage / mobileImage
              Screenshots. Save them in the assets folder using these exact names
              and they appear automatically; until then a labelled placeholder shows.
              Desktop ~1600x1000 (top of the page), mobile ~750x1500. JPG or WebP.
*/
export const PROJECTS_ALL = [
  {
    title: "CLARENDALE",
    category: "Ecommerce Storefront",
    relation: "",
    role: "",
    url: "https://clarendale.co/",
    summary: "Cart drawer — tiered discount progress bar, free-gift line, line items and secure checkout.",
    highlights: [],
    art: "rings",
    desktopImage: "assets/clarendale-desktop.jpg",
    mobileImage: "assets/clarendale-mobile.jpg",
  },
  {
    title: "ADRORA KITCHEN",
    category: "Ecommerce Storefront",
    relation: "",
    role: "",
    url: "https://adroraskitchen.com/products/vault-3-the-550-unlock",
    summary: "Product page — gallery, free-gift stack, urgency progress bar and feature badges.",
    highlights: [],
    art: "stripes",
    desktopImage: "assets/adrora-desktop.jpg",
    mobileImage: "assets/adrora-mobile.jpg",
  },
  {
    hidden: true, // no screenshots supplied yet
    title: "METABOLAE",
    category: "Ecommerce Storefront",
    relation: "",
    role: "",
    url: "https://metabolae.com/",
    summary: "",
    highlights: [],
    art: "dots",
    desktopImage: "assets/metabolae-desktop.jpg",
    mobileImage: "assets/metabolae-mobile.jpg",
  },
  {
    hidden: true, // no screenshots supplied yet
    title: "PINNAFIT",
    category: "Ecommerce Storefront",
    relation: "",
    role: "",
    url: "https://pinnafit.com/",
    summary: "",
    highlights: [],
    art: "rings",
    desktopImage: "assets/pinnafit-desktop.jpg",
    mobileImage: "assets/pinnafit-mobile.jpg",
  },
  {
    title: "SHOPJOGA",
    category: "Ecommerce Storefront",
    relation: "",
    role: "",
    url: "https://shopjoga.com/",
    summary: "Product slider cards with pricing and compare-at prices.",
    highlights: [],
    art: "stripes",
    desktopImage: "assets/shopjoga-desktop.jpg",
    mobileImage: "assets/shopjoga-mobile.jpg",
  },
  {
    title: "DONACCI",
    category: "Ecommerce Storefront",
    relation: "",
    role: "",
    url: "https://donacci.com/",
    summary: "Main menu with featured collection tiles, desktop and mobile.",
    highlights: [],
    art: "rings",
    desktopImage: "assets/donacci-desktop.jpg",
    mobileImage: "assets/donacci-mobile.jpg",
  },
  {
    title: "SNEAKERASK",
    category: "Ecommerce Storefront",
    relation: "",
    role: "",
    url: "https://sneakerask.com/",
    summary: "Brand grid with featured collections on desktop; product page on mobile.",
    highlights: [],
    art: "dots",
    desktopImage: "assets/sneakerask-desktop.jpg",
    mobileImage: "assets/sneakerask-mobile.jpg",
  },
];

export const PROJECTS = PROJECTS_ALL.filter((p) => !p.hidden);

export const AVAILABILITY = "AVAILABLE FOR SELECT PROJECTS";
