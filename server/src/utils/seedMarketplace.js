import { connectDatabase } from "../config/db.js";
import { Category } from "../models/Category.js";
import { MenuSettings } from "../models/MenuSettings.js";
import { Page } from "../models/Page.js";
import { Product } from "../models/Product.js";
import { SeoPage } from "../models/SeoPage.js";
import { User } from "../models/User.js";
import { DESIGNED_SEO_PAGES } from "./designedSeoPages.js";
import { slugify } from "./slugify.js";

const adminCredentials = {
  name: "Platform Admin",
  email: "admin@marketplace.local",
  password: "Admin@12345",
  role: "admin",
  status: "active"
};

const categoriesSeed = [
  {
    name: "Home Decor",
    description: "Statement lighting, sculptural accents, mirrors, textiles, and elevated room details.",
    image: "https://picsum.photos/seed/marketplace-home-decor/1200/800",
    seo: {
      metaTitle: "Home Decor | MarketSphere",
      metaDescription: "Shop modern home decor, lamps, mirrors, and elevated styling pieces from curated marketplace sellers.",
      keywords: ["home decor", "modern decor", "lamps", "mirrors"]
    }
  },
  {
    name: "Kitchen & Dining",
    description: "Cookware, ceramics, prep tools, serveware, and table pieces designed for daily use.",
    image: "https://picsum.photos/seed/marketplace-kitchen-dining/1200/800",
    seo: {
      metaTitle: "Kitchen & Dining | MarketSphere",
      metaDescription: "Browse cookware, dinnerware, serveware, and practical kitchen upgrades for polished everyday meals.",
      keywords: ["kitchen", "dining", "serveware", "cookware"]
    }
  },
  {
    name: "Apparel",
    description: "Modern layers, outerwear, knitwear, and wardrobe staples for everyday wear.",
    image: "https://picsum.photos/seed/marketplace-apparel/1200/800",
    seo: {
      metaTitle: "Apparel | MarketSphere",
      metaDescription: "Discover premium apparel, jackets, tops, and everyday wardrobe staples from independent stores.",
      keywords: ["apparel", "jackets", "shirts", "fashion"]
    }
  },
  {
    name: "Footwear",
    description: "Sneakers, slides, and versatile footwear built for comfort, movement, and daily styling.",
    image: "https://picsum.photos/seed/marketplace-footwear/1200/800",
    seo: {
      metaTitle: "Footwear | MarketSphere",
      metaDescription: "Explore versatile footwear, sneakers, and comfort-first styles for everyday wear.",
      keywords: ["footwear", "sneakers", "slides", "shoes"]
    }
  },
  {
    name: "Bags & Accessories",
    description: "Crossbody bags, totes, wallets, travel accessories, and everyday carry upgrades.",
    image: "https://picsum.photos/seed/marketplace-bags/1200/800",
    seo: {
      metaTitle: "Bags & Accessories | MarketSphere",
      metaDescription: "Shop crossbody bags, wallets, totes, and premium accessories for everyday carry.",
      keywords: ["bags", "accessories", "crossbody", "wallets"]
    }
  },
  {
    name: "Beauty & Skincare",
    description: "Serums, moisturizers, treatment products, and daily skincare essentials.",
    image: "https://picsum.photos/seed/marketplace-beauty-skincare/1200/800",
    seo: {
      metaTitle: "Beauty & Skincare | MarketSphere",
      metaDescription: "Discover skincare essentials, hydration products, and treatment routines for daily care.",
      keywords: ["beauty", "skincare", "moisturizer", "serum"]
    }
  },
  {
    name: "Fragrance",
    description: "Signature scents, layering mists, and refined fragrance picks for daily wear.",
    image: "https://picsum.photos/seed/marketplace-fragrance/1200/800",
    seo: {
      metaTitle: "Fragrance | MarketSphere",
      metaDescription: "Shop signature scents, travel sprays, and fragrance collections with refined profiles.",
      keywords: ["fragrance", "perfume", "eau de parfum", "scent"]
    }
  },
  {
    name: "Tech & Gadgets",
    description: "Chargers, audio, smart accessories, and compact gadgets built for modern routines.",
    image: "https://picsum.photos/seed/marketplace-tech-gadgets/1200/800",
    seo: {
      metaTitle: "Tech & Gadgets | MarketSphere",
      metaDescription: "Browse chargers, gadgets, and smart accessories designed for clean setups and daily convenience.",
      keywords: ["tech", "gadgets", "chargers", "electronics"]
    }
  },
  {
    name: "Workspace",
    description: "Desk organization, lighting, monitor risers, and accessories for productive workspaces.",
    image: "https://picsum.photos/seed/marketplace-workspace/1200/800",
    seo: {
      metaTitle: "Workspace | MarketSphere",
      metaDescription: "Upgrade your workspace with desk shelves, organizers, and refined productivity accessories.",
      keywords: ["workspace", "desk setup", "productivity", "office accessories"]
    }
  },
  {
    name: "Fitness & Recovery",
    description: "Training tools, recovery equipment, wellness accessories, and portable fitness gear.",
    image: "https://picsum.photos/seed/marketplace-fitness/1200/800",
    seo: {
      metaTitle: "Fitness & Recovery | MarketSphere",
      metaDescription: "Find massage guns, recovery tools, and fitness accessories for movement and post-workout care.",
      keywords: ["fitness", "recovery", "wellness", "massage gun"]
    }
  },
  {
    name: "Travel Essentials",
    description: "Packing systems, organizers, travel bottles, and compact accessories for smoother trips.",
    image: "https://picsum.photos/seed/marketplace-travel/1200/800",
    seo: {
      metaTitle: "Travel Essentials | MarketSphere",
      metaDescription: "Shop travel organizers, packing systems, and compact accessories for smarter trips.",
      keywords: ["travel", "packing cubes", "organizers", "travel essentials"]
    }
  },
  {
    name: "Pet Living",
    description: "Comfort-led pet beds, bowls, storage, and lifestyle pieces designed for home interiors.",
    image: "https://picsum.photos/seed/marketplace-pet-living/1200/800",
    seo: {
      metaTitle: "Pet Living | MarketSphere",
      metaDescription: "Discover refined pet beds, bowls, and home-friendly pet accessories for modern spaces.",
      keywords: ["pet living", "pet bed", "pet accessories", "dog bed"]
    }
  }
];

const vendorsSeed = [
  {
    name: "Aisha Khan",
    email: "vendor1@marketplace.local",
    password: "Vendor@12345",
    phone: "+92-300-111-0001",
    storeName: "Oak & Ivory",
    storeDescription: "Oak & Ivory curates calm home pieces, table styling essentials, and thoughtful gifting products.",
    theme: "decor",
    address: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    }
  },
  {
    name: "Bilal Ahmed",
    email: "vendor2@marketplace.local",
    password: "Vendor@12345",
    phone: "+92-300-111-0002",
    storeName: "Northline Studio",
    storeDescription: "Northline Studio focuses on fashion layers, beauty kits, and premium accessories for daily use.",
    theme: "style",
    address: {
      city: "Lahore",
      state: "Punjab",
      country: "Pakistan"
    }
  },
  {
    name: "Sana Malik",
    email: "vendor3@marketplace.local",
    password: "Vendor@12345",
    phone: "+92-300-111-0003",
    storeName: "Signal & Spice",
    storeDescription: "Signal & Spice blends desk tech, kitchen upgrades, and utility-led products with cleaner aesthetics.",
    theme: "utility",
    address: {
      city: "Islamabad",
      state: "Islamabad Capital Territory",
      country: "Pakistan"
    }
  }
];

const productBlueprints = {
  decor: [
    {
      name: "Sculptural Travertine Table Lamp",
      category: "Home Decor",
      price: 124,
      compareAtPrice: 156,
      shortDescription: "Stone-look statement lamp with a soft linen shade for premium bedside and console styling.",
      weight: 3.8,
      tags: ["lamp", "travertine", "ambient lighting", "home decor"],
      highlights: ["travertine-look base", "warm linen shade", "soft ambient spread", "styled for shelves and consoles"],
      benefitsHeading: "Why shoppers choose this lamp",
      benefitsPoints: ["Creates a warm low-glare glow.", "Adds a sculptural focal point to neutral interiors.", "Pairs easily with wood, linen, and stone accents."],
      options: [
        { name: "Finish", values: ["Sand", "Graphite"] },
        { name: "Size", values: ["Standard", "Tall"] }
      ],
      optionPriceAdjustments: { Finish: { Graphite: 8 }, Size: { Tall: 18 } },
      optionWeightAdjustments: { Size: { Tall: 0.6 } },
      optionStockAdjustments: { Finish: { Sand: 6, Graphite: 3 }, Size: { Standard: 4, Tall: 2 } },
      imageOption: "Finish"
    },
    {
      name: "Stoneware Brunch Plate Set",
      category: "Kitchen & Dining",
      price: 68,
      compareAtPrice: 84,
      shortDescription: "Hand-finished stoneware plates sized for breakfast, lunch, and layered table styling.",
      weight: 2.6,
      tags: ["stoneware", "dinnerware", "plates", "kitchen"],
      highlights: ["reactive glaze finish", "stackable shape", "dishwasher safe", "designed for daily hosting"],
      benefitsHeading: "Built for everyday hosting",
      benefitsPoints: ["Balances artisanal texture with durable daily use.", "Stacks cleanly inside narrow cabinets.", "Works for brunch spreads, desserts, and shared plates."],
      options: [
        { name: "Color", values: ["Ivory", "Pebble"] },
        { name: "Set Size", values: ["4 Piece", "6 Piece"] }
      ],
      optionPriceAdjustments: { Color: { Pebble: 4 }, "Set Size": { "6 Piece": 22 } },
      optionWeightAdjustments: { "Set Size": { "6 Piece": 1.4 } },
      optionStockAdjustments: { Color: { Ivory: 7, Pebble: 5 }, "Set Size": { "4 Piece": 4, "6 Piece": 2 } },
      imageOption: "Color"
    },
    {
      name: "Weekender Packing Cube System",
      category: "Travel Essentials",
      price: 44,
      compareAtPrice: 57,
      shortDescription: "Structured packing cube system for carry-on organization with compression-ready panels.",
      weight: 0.9,
      tags: ["travel", "packing cubes", "organizer", "carry on"],
      highlights: ["water-resistant shell", "mesh visibility panel", "nesting cube sizes", "two-way zip access"],
      benefitsHeading: "Faster packing, cleaner carry-ons",
      benefitsPoints: ["Separates outfits, laundry, and essentials in one system.", "Reduces bag clutter for short-haul travel.", "Works well for both carry-on and checked luggage."],
      options: [
        { name: "Color", values: ["Clay", "Slate"] },
        { name: "Bundle", values: ["3 Cube", "5 Cube"] }
      ],
      optionPriceAdjustments: { Color: { Slate: 3 }, Bundle: { "5 Cube": 16 } },
      optionWeightAdjustments: { Bundle: { "5 Cube": 0.4 } },
      optionStockAdjustments: { Color: { Clay: 8, Slate: 6 }, Bundle: { "3 Cube": 5, "5 Cube": 2 } },
      imageOption: "Color"
    },
    {
      name: "Orthopedic Pet Lounge Bed",
      category: "Pet Living",
      price: 96,
      compareAtPrice: 119,
      shortDescription: "Supportive memory-foam pet bed wrapped in a home-friendly woven cover.",
      weight: 4.7,
      tags: ["pet bed", "orthopedic", "dog bed", "pet living"],
      highlights: ["supportive foam core", "machine-wash cover", "anti-slip base", "neutral home palette"],
      benefitsHeading: "Supportive comfort without visual clutter",
      benefitsPoints: ["Designed to look good in living spaces.", "Helps support pets needing softer rest surfaces.", "The zip cover removes easily for cleaning."],
      options: [
        { name: "Color", values: ["Oat", "Charcoal"] },
        { name: "Size", values: ["Medium", "Large"] }
      ],
      optionPriceAdjustments: { Color: { Charcoal: 5 }, Size: { Large: 20 } },
      optionWeightAdjustments: { Size: { Large: 1.6 } },
      optionStockAdjustments: { Color: { Oat: 5, Charcoal: 4 }, Size: { Medium: 4, Large: 2 } },
      imageOption: "Color"
    }
  ],
  style: [
    {
      name: "Tailored Utility Field Jacket",
      category: "Apparel",
      price: 118,
      compareAtPrice: 149,
      shortDescription: "Structured utility jacket with a clean silhouette, lined body, and everyday layering weight.",
      weight: 1.2,
      tags: ["jacket", "outerwear", "utility", "apparel"],
      highlights: ["structured cotton twill", "lined interior", "storm flap details", "designed for layering"],
      benefitsHeading: "Made for repeat wear",
      benefitsPoints: ["Sharp enough for city dressing and practical enough for daily use.", "Easy to layer over tees, shirts, and knits.", "Balanced silhouette avoids bulk while keeping structure."],
      options: [
        { name: "Color", values: ["Olive", "Black"] },
        { name: "Size", values: ["M", "L"] }
      ],
      optionPriceAdjustments: { Color: { Black: 6 }, Size: { L: 8 } },
      optionWeightAdjustments: { Size: { L: 0.15 } },
      optionStockAdjustments: { Color: { Olive: 6, Black: 4 }, Size: { M: 3, L: 2 } },
      imageOption: "Color"
    },
    {
      name: "Pebbled Leather Crossbody Bag",
      category: "Bags & Accessories",
      price: 92,
      compareAtPrice: 116,
      shortDescription: "Minimal crossbody bag with soft structure, secure interior pockets, and daily-carry proportions.",
      weight: 0.8,
      tags: ["crossbody", "bag", "leather", "accessories"],
      highlights: ["pebbled vegan leather", "adjustable strap", "zip pocket organization", "clean matte hardware"],
      benefitsHeading: "Sized for daily essentials",
      benefitsPoints: ["Carries phone, wallet, keys, and compact extras without bulk.", "Works across casual and polished looks.", "Interior pockets keep small items easy to reach."],
      options: [
        { name: "Color", values: ["Tan", "Black"] },
        { name: "Strap", values: ["Classic", "Webbing"] }
      ],
      optionPriceAdjustments: { Color: { Black: 4 }, Strap: { Webbing: 6 } },
      optionWeightAdjustments: { Strap: { Webbing: 0.08 } },
      optionStockAdjustments: { Color: { Tan: 6, Black: 5 }, Strap: { Classic: 3, Webbing: 2 } },
      imageOption: "Color"
    },
    {
      name: "Barrier Repair Night Cream",
      category: "Beauty & Skincare",
      price: 34,
      compareAtPrice: 42,
      shortDescription: "Ceramide-rich night cream designed to lock in hydration and support skin barrier recovery.",
      weight: 0.22,
      tags: ["night cream", "ceramide", "skincare", "beauty"],
      highlights: ["ceramide blend", "fragrance-light formula", "overnight hydration", "soft cream texture"],
      benefitsHeading: "A stronger overnight recovery step",
      benefitsPoints: ["Helps reduce morning dryness and tightness.", "Supports a smoother, more hydrated skin feel.", "Fits easily into simple evening routines."],
      options: [
        { name: "Size", values: ["50ml", "100ml"] },
        { name: "Bundle", values: ["Single", "Duo"] }
      ],
      optionPriceAdjustments: { Size: { "100ml": 18 }, Bundle: { Duo: 30 } },
      optionWeightAdjustments: { Size: { "100ml": 0.14 }, Bundle: { Duo: 0.18 } },
      optionStockAdjustments: { Size: { "50ml": 8, "100ml": 5 }, Bundle: { Single: 4, Duo: 2 } },
      imageOption: "Size"
    },
    {
      name: "Cedar Vetiver Daily Eau De Parfum",
      category: "Fragrance",
      price: 62,
      compareAtPrice: 78,
      shortDescription: "Fresh woody fragrance with citrus lift, dry vetiver depth, and a clean daily-wear profile.",
      weight: 0.28,
      tags: ["fragrance", "perfume", "vetiver", "daily scent"],
      highlights: ["citrus top notes", "cedar and vetiver heart", "clean dry-down", "designed for everyday wear"],
      benefitsHeading: "A versatile signature scent",
      benefitsPoints: ["Fresh opening with a grounded woody finish.", "Transitions well from day to evening wear.", "Balanced projection without overpowering rooms."],
      options: [
        { name: "Size", values: ["30ml", "50ml"] },
        { name: "Format", values: ["Bottle", "Travel Spray"] }
      ],
      optionPriceAdjustments: { Size: { "50ml": 20 }, Format: { "Travel Spray": -8 } },
      optionWeightAdjustments: { Size: { "50ml": 0.1 }, Format: { "Travel Spray": -0.04 } },
      optionStockAdjustments: { Size: { "30ml": 7, "50ml": 5 }, Format: { Bottle: 3, "Travel Spray": 4 } },
      imageOption: "Format"
    },
    {
      name: "Cushioned Transit Runner",
      category: "Footwear",
      price: 86,
      compareAtPrice: 109,
      shortDescription: "Comfort-led city runner with lightweight foam support and a clean low-profile upper.",
      weight: 0.95,
      tags: ["footwear", "sneakers", "runner", "comfort"],
      highlights: ["lightweight foam sole", "breathable knit upper", "all-day comfort", "minimal stitched detailing"],
      benefitsHeading: "Comfort without bulky styling",
      benefitsPoints: ["Soft underfoot support for long city days.", "Neutral shape works across casual fits.", "Easy to style with trousers, denim, or travel outfits."],
      options: [
        { name: "Color", values: ["Bone", "Black"] },
        { name: "Size", values: ["42", "43"] }
      ],
      optionPriceAdjustments: { Color: { Black: 4 }, Size: { "43": 2 } },
      optionWeightAdjustments: { Size: { "43": 0.06 } },
      optionStockAdjustments: { Color: { Bone: 5, Black: 5 }, Size: { "42": 3, "43": 2 } },
      imageOption: "Color"
    }
  ],
  utility: [
    {
      name: "Magnetic 3-in-1 Charging Stand",
      category: "Tech & Gadgets",
      price: 74,
      compareAtPrice: 92,
      shortDescription: "Compact charging stand for phone, earbuds, and smartwatch with a tidy cable footprint.",
      weight: 0.7,
      tags: ["charger", "wireless charging", "desk tech", "gadgets"],
      highlights: ["multi-device charging", "foldable frame", "clean cable routing", "travel friendly form"],
      benefitsHeading: "One charger for the daily carry stack",
      benefitsPoints: ["Reduces cable clutter on desks and bedside tables.", "Folds down neatly for travel bags.", "Keeps core devices charged from a single station."],
      options: [
        { name: "Finish", values: ["Silver", "Black"] },
        { name: "Plug", values: ["UK", "EU"] }
      ],
      optionPriceAdjustments: { Finish: { Black: 5 }, Plug: { EU: 0 } },
      optionWeightAdjustments: { Plug: { EU: 0.02 } },
      optionStockAdjustments: { Finish: { Silver: 6, Black: 5 }, Plug: { UK: 3, EU: 2 } },
      imageOption: "Finish"
    },
    {
      name: "Walnut Monitor Riser Desk Shelf",
      category: "Workspace",
      price: 88,
      compareAtPrice: 108,
      shortDescription: "Desk riser shelf with concealed storage space and a warm wood-look finish.",
      weight: 2.9,
      tags: ["workspace", "monitor riser", "desk shelf", "organizer"],
      highlights: ["elevated screen position", "under-shelf storage", "wood-look top", "stable steel base"],
      benefitsHeading: "Cleaner desk lines, better screen height",
      benefitsPoints: ["Creates storage space under the monitor line.", "Helps lift screens to a more comfortable viewing height.", "Adds warmth to minimal desk setups."],
      options: [
        { name: "Finish", values: ["Walnut", "Ash"] },
        { name: "Width", values: ["Small", "Large"] }
      ],
      optionPriceAdjustments: { Finish: { Ash: 4 }, Width: { Large: 14 } },
      optionWeightAdjustments: { Width: { Large: 0.9 } },
      optionStockAdjustments: { Finish: { Walnut: 6, Ash: 4 }, Width: { Small: 3, Large: 2 } },
      imageOption: "Finish"
    },
    {
      name: "Deep Tissue Recovery Massage Gun",
      category: "Fitness & Recovery",
      price: 112,
      compareAtPrice: 139,
      shortDescription: "Portable recovery gun with multiple heads, adjustable intensity, and a travel case.",
      weight: 1.1,
      tags: ["massage gun", "recovery", "fitness", "wellness"],
      highlights: ["quiet motor", "multiple attachments", "carry case included", "three recovery speeds"],
      benefitsHeading: "Recovery support that travels well",
      benefitsPoints: ["Useful after gym sessions, runs, and long work days.", "Compact enough for home, office, or travel use.", "Attachment kit supports targeted muscle groups."],
      options: [
        { name: "Color", values: ["Stone", "Black"] },
        { name: "Kit", values: ["Core", "Pro"] }
      ],
      optionPriceAdjustments: { Color: { Black: 4 }, Kit: { Pro: 24 } },
      optionWeightAdjustments: { Kit: { Pro: 0.2 } },
      optionStockAdjustments: { Color: { Stone: 5, Black: 4 }, Kit: { Core: 3, Pro: 2 } },
      imageOption: "Color"
    }
  ]
};

const marketplacePagesSeed = [
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    seo: {
      metaTitle: "Privacy Policy | MarketSphere",
      metaDescription: "How MarketSphere collects, uses, stores, and protects customer, vendor, and visitor information."
    },
    content: `
      <h2>Overview</h2>
      <p>MarketSphere values privacy across the marketplace. This policy explains how we collect account details, order information, device data, and support communications when customers, vendors, and administrators use the platform.</p>
      <h2>Information We Collect</h2>
      <p>We may collect names, email addresses, phone numbers, billing and shipping details, order history, vendor storefront information, login activity, and messages sent through marketplace features.</p>
      <h2>How We Use Information</h2>
      <p>Information is used to process orders, manage vendor accounts, prevent fraud, improve customer support, personalize storefront experiences, and meet legal obligations.</p>
      <h2>Sharing and Retention</h2>
      <p>We share data only where necessary to complete purchases, operate logistics, process payments, provide support, or comply with law. Data is retained only as long as needed for operations, compliance, dispute handling, and security review.</p>
      <h2>Your Choices</h2>
      <p>Customers and vendors may request updates to account information, ask questions about stored data, and contact support regarding privacy requests through the marketplace support channels.</p>
    `
  },
  {
    title: "Terms and Conditions",
    slug: "terms-and-conditions",
    seo: {
      metaTitle: "Terms and Conditions | MarketSphere",
      metaDescription: "The rules, responsibilities, and legal terms that apply when using the MarketSphere marketplace."
    },
    content: `
      <h2>Acceptance of Terms</h2>
      <p>By accessing or using MarketSphere, customers, vendors, and administrators agree to follow these marketplace terms and all applicable laws and platform policies.</p>
      <h2>Marketplace Role</h2>
      <p>MarketSphere provides marketplace technology, catalog presentation, communication tools, and operational workflows. Vendors remain responsible for the accuracy, legality, and fulfillment of their listings unless stated otherwise.</p>
      <h2>Accounts and Conduct</h2>
      <p>Users must provide accurate information, protect account credentials, and avoid abusive conduct, fraudulent transactions, policy circumvention, or misuse of the platform.</p>
      <h2>Orders, Pricing, and Availability</h2>
      <p>Orders are subject to availability, review, fraud screening, and operational acceptance. MarketSphere or participating vendors may correct listing errors, pricing mistakes, or inventory issues before dispatch.</p>
      <h2>Enforcement</h2>
      <p>Accounts, listings, orders, or messages may be limited, suspended, or removed where policy violations, abuse, safety concerns, or legal risk are identified.</p>
    `
  },
  {
    title: "Shipping Policy",
    slug: "shipping-policy",
    seo: {
      metaTitle: "Shipping Policy | MarketSphere",
      metaDescription: "Shipping timelines, fulfillment expectations, delivery exceptions, and logistics responsibilities for marketplace orders."
    },
    content: `
      <h2>Processing Time</h2>
      <p>Most orders are processed after payment confirmation and vendor acceptance. Processing windows may vary by product type, seller handling time, and destination.</p>
      <h2>Delivery Estimates</h2>
      <p>Estimated delivery dates are shown for planning purposes and may change due to stock availability, courier delays, customs processing, weather, or peak volume periods.</p>
      <h2>Split Shipments</h2>
      <p>Because MarketSphere supports multiple vendors, items in one checkout may ship separately and arrive in multiple packages with different tracking updates.</p>
      <h2>Address Accuracy</h2>
      <p>Customers are responsible for providing correct delivery details. Additional fees or delays caused by incorrect addresses may be charged where permitted.</p>
      <h2>Delivery Issues</h2>
      <p>If a parcel is delayed, lost, or marked delivered but not received, customers should contact support promptly so the marketplace can coordinate with the vendor and shipping carrier.</p>
    `
  },
  {
    title: "Return and Refund Policy",
    slug: "return-and-refund-policy",
    seo: {
      metaTitle: "Return and Refund Policy | MarketSphere",
      metaDescription: "Eligibility, timelines, conditions, and review steps for returns, replacements, and refunds on MarketSphere."
    },
    content: `
      <h2>Return Eligibility</h2>
      <p>Return eligibility depends on item condition, category restrictions, seller policy, and the time elapsed since delivery. Some categories may be final sale for hygiene, safety, or customization reasons.</p>
      <h2>Request Windows</h2>
      <p>Customers should submit return requests within the allowed return period shown on the relevant order or listing. Late requests may be declined unless required by law.</p>
      <h2>Refund Review</h2>
      <p>Refunds are typically reviewed after the seller confirms the returned item or the marketplace verifies a delivery or product issue. Approved refunds are returned to the original payment method where possible.</p>
      <h2>Non-Returnable Items</h2>
      <p>Items damaged by misuse, worn products, digital goods, perishable items, or customized products may not be eligible for return or refund.</p>
      <h2>Dispute Handling</h2>
      <p>If a customer and vendor cannot resolve a return issue directly, MarketSphere may review order records, messages, shipment scans, and product evidence before making a marketplace decision.</p>
    `
  },
  {
    title: "Disclaimer",
    slug: "disclaimer",
    seo: {
      metaTitle: "Disclaimer | MarketSphere",
      metaDescription: "Important disclaimers regarding product information, availability, and marketplace operation on MarketSphere."
    },
    content: `
      <h2>General Information</h2>
      <p>MarketSphere makes reasonable efforts to maintain accurate content, pricing, availability, and vendor information, but platform content may change without notice.</p>
      <h2>Vendor Listings</h2>
      <p>Product descriptions, specifications, images, and claims may originate from vendors. Customers should review details carefully before purchasing and contact support when clarification is needed.</p>
      <h2>No Guaranteed Availability</h2>
      <p>Listings, prices, promotions, payment methods, shipping estimates, and seller participation may change or end without prior notice.</p>
      <h2>Limitation Context</h2>
      <p>Nothing in this disclaimer limits rights that cannot be excluded under applicable law. Where local law grants mandatory protections, those protections continue to apply.</p>
    `
  },
  {
    title: "FAQs",
    slug: "faqs",
    seo: {
      metaTitle: "FAQs | MarketSphere",
      metaDescription: "Answers to common questions about orders, shipping, returns, seller accounts, payments, and support."
    },
    content: `
      <h2>Frequently Asked Questions</h2>
      <h3>How do marketplace orders work?</h3>
      <p>You can add products from multiple vendors to one cart. Orders may be split by seller for fulfillment, shipping, and support updates.</p>
      <h3>Can I track my order?</h3>
      <p>Yes. Tracking information is shared once the seller or marketplace shipping workflow confirms dispatch.</p>
      <h3>How do returns work?</h3>
      <p>Return requests are submitted from the order flow, reviewed against the listing and policy rules, and then approved, rejected, or escalated for review.</p>
      <h3>How do vendors join?</h3>
      <p>Vendors apply, complete account setup, and must meet platform requirements before selling on the marketplace.</p>
      <h3>Where can I get help?</h3>
      <p>Customers and vendors can contact the marketplace support team through the support and contact channels listed on the storefront.</p>
    `
  },
  {
    title: "About Us",
    slug: "about-us",
    seo: {
      metaTitle: "About Us | MarketSphere",
      metaDescription: "Learn what MarketSphere is building for customers, vendors, and modern multi-vendor commerce."
    },
    content: `
      <h2>Our Marketplace</h2>
      <p>MarketSphere is designed to help independent sellers present products in a cleaner, more professional storefront while giving customers a faster, more reliable path from discovery to checkout.</p>
      <h2>What We Focus On</h2>
      <p>We focus on product clarity, better browsing, stronger seller visibility, and marketplace operations that scale across catalog management, order handling, returns, and support.</p>
      <h2>Who We Serve</h2>
      <p>Our platform serves marketplace operators, growing vendors, and customers who want a more organized shopping experience across multiple storefronts in one place.</p>
    `
  },
  {
    title: "Contact Us",
    slug: "contact-us",
    seo: {
      metaTitle: "Contact Us | MarketSphere",
      metaDescription: "How customers, vendors, partners, and business teams can contact MarketSphere."
    },
    content: `
      <h2>Get in Touch</h2>
      <p>Customers, vendors, and partners can contact MarketSphere for order support, vendor onboarding, policy questions, billing concerns, and partnership enquiries.</p>
      <h3>Support Hours</h3>
      <p>Support is typically available during local business hours, with response times depending on the request type and marketplace volume.</p>
      <h3>Best Ways to Reach Us</h3>
      <p>Use the marketplace contact form, support center, or authenticated messaging features when available so order and account context can be reviewed accurately.</p>
    `
  },
  {
    title: "Payment Options",
    slug: "payment-options",
    seo: {
      metaTitle: "Payment Options | MarketSphere",
      metaDescription: "Supported payment methods, billing review, and checkout expectations on MarketSphere."
    },
    content: `
      <h2>Accepted Methods</h2>
      <p>MarketSphere may support cards, digital payment methods, wallet integrations, bank transfer options, or cash-on-delivery flows depending on the marketplace configuration and region.</p>
      <h2>Payment Review</h2>
      <p>Orders may be delayed, verified, or declined if billing details are incomplete, suspicious, or inconsistent with fraud prevention checks.</p>
      <h2>Refund Timing</h2>
      <p>Refund timing depends on the original payment method, banking network, and the outcome of return or cancellation review.</p>
    `
  },
  {
    title: "How It Works",
    slug: "how-it-works",
    seo: {
      metaTitle: "How It Works | MarketSphere",
      metaDescription: "A simple overview of how customers shop and how vendors sell on MarketSphere."
    },
    content: `
      <h2>For Customers</h2>
      <p>Customers browse categories, compare products, add items from multiple vendors to a single cart, complete checkout, and manage orders from one account experience.</p>
      <h2>For Vendors</h2>
      <p>Vendors create listings, manage inventory, handle orders, respond to customers, and track performance from their seller dashboard.</p>
      <h2>For Marketplace Teams</h2>
      <p>Administrators oversee catalog quality, menus, orders, returns, storefront pages, shipping configuration, reviews, and operational policy settings.</p>
    `
  },
  {
    title: "Sell on MarketSphere",
    slug: "sell-on-marketsphere",
    seo: {
      metaTitle: "Sell on MarketSphere | MarketSphere",
      metaDescription: "Information for businesses and sellers who want to join the MarketSphere marketplace."
    },
    content: `
      <h2>Why Sell Here</h2>
      <p>MarketSphere gives vendors structured product management, order workflows, storefront visibility, analytics, and customer communication tools in one place.</p>
      <h2>Getting Started</h2>
      <p>Prospective sellers submit an application, complete profile and business setup, and follow approval requirements before publishing products.</p>
      <h2>Seller Expectations</h2>
      <p>Vendors are expected to keep listings accurate, maintain service quality, fulfill orders on time, and comply with marketplace policies and legal obligations.</p>
    `
  },
  {
    title: "Buyer Protection",
    slug: "buyer-protection",
    seo: {
      metaTitle: "Buyer Protection | MarketSphere",
      metaDescription: "How MarketSphere approaches order trust, dispute handling, and customer protection."
    },
    content: `
      <h2>Safer Shopping Standards</h2>
      <p>MarketSphere uses account review, order controls, return workflows, moderation, and support escalation to create a safer environment for customers and sellers.</p>
      <h2>When Issues Happen</h2>
      <p>Customers can request help with damaged items, missing packages, incorrect products, and unresolved seller issues through platform support and return channels.</p>
      <h2>Evidence and Decisions</h2>
      <p>Marketplace reviews may consider order details, seller responses, courier scans, images, and policy rules before resolving a dispute.</p>
    `
  }
];

const policyPageSlugs = new Set([
  "privacy-policy",
  "terms-and-conditions",
  "shipping-policy",
  "return-and-refund-policy",
  "disclaimer"
]);

const designedSeoPagesSeed = DESIGNED_SEO_PAGES;

function buildOptionCombinations(options = [], index = 0, current = {}) {
  if (!options.length) return [];
  if (index === options.length) return [{ ...current }];

  const option = options[index];
  return option.values.flatMap((value) =>
    buildOptionCombinations(options, index + 1, { ...current, [option.name]: value })
  );
}

function buildBenefitsHtml(points = []) {
  return `<ul>${points.map((point) => `<li>${point}</li>`).join("")}</ul>`;
}

function buildProductDescription(storeName, blueprint, categoryName) {
  return `
    <p>${blueprint.name} from ${storeName} is positioned in ${categoryName.toLowerCase()} for customers who want cleaner presentation, reliable materials, and polished everyday use.</p>
    <p>${blueprint.shortDescription}</p>
    <h3>Highlights</h3>
    <ul>${(blueprint.highlights || []).map((item) => `<li>${item}</li>`).join("")}</ul>
    <p>This seeded product is intentionally filled with complete catalog data so admin and vendor product modals, storefront cards, filters, search, and detail pages all have richer content to render during development.</p>
  `;
}

function buildProductImages(slug, productName, count = 3) {
  return Array.from({ length: count }, (_, index) => ({
    url: `https://picsum.photos/seed/${slug}-${index + 1}/1200/1200`,
    alt: `${productName} image ${index + 1}`,
    publicId: `${slug}-${index + 1}`
  }));
}

function buildVariantCombinations(blueprint, skuPrefix, images) {
  const combinations = buildOptionCombinations(blueprint.options || []);

  return combinations.map((optionValues, index) => {
    const priceAdjustment = Object.entries(optionValues).reduce(
      (sum, [optionName, optionValue]) => sum + Number(blueprint.optionPriceAdjustments?.[optionName]?.[optionValue] || 0),
      0
    );
    const weightAdjustment = Object.entries(optionValues).reduce(
      (sum, [optionName, optionValue]) => sum + Number(blueprint.optionWeightAdjustments?.[optionName]?.[optionValue] || 0),
      0
    );
    const stockAdjustment = Object.entries(optionValues).reduce(
      (sum, [optionName, optionValue]) => sum + Number(blueprint.optionStockAdjustments?.[optionName]?.[optionValue] || 0),
      0
    );
    const keyParts = Object.values(optionValues).map((value) => slugify(value).toUpperCase());
    const imageOptionName = blueprint.imageOption || blueprint.options?.[0]?.name;
    const imageValue = optionValues?.[imageOptionName] || blueprint.options?.[0]?.values?.[0];
    const imageIndex = Math.max(
      0,
      (blueprint.options?.find((option) => option.name === imageOptionName)?.values || []).indexOf(imageValue)
    );

    return {
      optionValues,
      sku: `${skuPrefix}-${keyParts.join("-") || index + 1}`,
      price: Number((blueprint.price + priceAdjustment).toFixed(2)),
      stock: Math.max(2, 4 + stockAdjustment - index),
      weight: Number((blueprint.weight + weightAdjustment).toFixed(2)),
      image: images[imageIndex % images.length]?.url || images[0]?.url || ""
    };
  });
}

async function ensureAdmin() {
  let admin = await User.findOne({ email: adminCredentials.email }).select("+password");
  if (!admin) {
    admin = new User(adminCredentials);
  } else {
    admin.name = adminCredentials.name;
    admin.role = adminCredentials.role;
    admin.status = adminCredentials.status;
  }
  admin.password = adminCredentials.password;
  await admin.save();
  return admin;
}

async function clearSeedData() {
  const vendorEmails = vendorsSeed.map((vendor) => vendor.email);
  await Product.deleteMany({});
  await User.deleteMany({ email: { $in: vendorEmails } });
  await Category.deleteMany({});
  await Page.deleteMany({ slug: { $in: marketplacePagesSeed.map((page) => page.slug) } });
  await SeoPage.deleteMany({ key: { $in: designedSeoPagesSeed.map((page) => page.key) } });
}

async function seedCategories() {
  const categories = [];
  for (const category of categoriesSeed) {
    const created = await Category.create({
      name: category.name,
      slug: slugify(category.name),
      description: category.description,
      image: category.image,
      seo: category.seo,
      isActive: true
    });
    categories.push(created);
  }
  return categories;
}

async function seedVendors() {
  const vendors = [];
  for (const vendor of vendorsSeed) {
    const created = await User.create({
      name: vendor.name,
      email: vendor.email,
      password: vendor.password,
      role: "vendor",
      status: "active",
      phone: vendor.phone,
      storeName: vendor.storeName,
      storeSlug: slugify(vendor.storeName),
      storeDescription: vendor.storeDescription,
      storeBanner: `https://picsum.photos/seed/${slugify(vendor.storeName)}-banner/1600/900`,
      storeLogo: `https://picsum.photos/seed/${slugify(vendor.storeName)}-logo/400/400`,
      vendorApprovedAt: new Date(),
      addresses: [
        {
          label: "Studio",
          fullName: vendor.name,
          phone: vendor.phone,
          street: "Seeded Marketplace Street 10",
          city: vendor.address.city,
          state: vendor.address.state,
          country: vendor.address.country,
          postalCode: "75000",
          isDefault: true
        }
      ]
    });
    vendors.push({ ...vendor, _id: created._id, storeSlug: created.storeSlug });
  }
  return vendors;
}

async function seedProducts(vendors, categories) {
  const categoryMap = new Map(categories.map((category) => [category.name, category]));
  const products = [];

  for (const vendor of vendors) {
    const blueprints = productBlueprints[vendor.theme];
    for (let index = 0; index < blueprints.length; index += 1) {
      const blueprint = blueprints[index];
      const category = categoryMap.get(blueprint.category);
      const productName = `${vendor.storeName} ${blueprint.name}`;
      const slug = slugify(productName);
      const images = buildProductImages(slug, productName, 3);
      const skuPrefix = `SEED-${slug.toUpperCase()}`;
      const variantCombinations = buildVariantCombinations(blueprint, skuPrefix, images);
      const stock = variantCombinations.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
      const soldCount = 8 + index * 5;

      products.push({
        name: productName,
        slug,
        description: buildProductDescription(vendor.storeName, blueprint, blueprint.category),
        shortDescription: blueprint.shortDescription,
        price: blueprint.price,
        compareAtPrice: blueprint.compareAtPrice,
        vendor: vendor._id,
        category: category._id,
        categorySlug: category.slug,
        images,
        stock,
        weight: blueprint.weight,
        sku: `${skuPrefix}-BASE`,
        variants: blueprint.options,
        variantCombinations,
        benefitsHeading: blueprint.benefitsHeading,
        benefitsText: buildBenefitsHtml(blueprint.benefitsPoints),
        tags: [...blueprint.tags, vendor.storeName, blueprint.category, "seeded", "marketplace"],
        status: "approved",
        seo: {
          metaTitle: `${productName} | MarketSphere`,
          metaDescription: blueprint.shortDescription,
          keywords: [...blueprint.tags, vendor.storeName, blueprint.category, blueprint.name]
        },
        ratingAverage: Number((4.2 + ((index % 4) * 0.2)).toFixed(1)),
        ratingCount: 12 + index * 2,
        soldCount,
        isFeatured: index < 2
      });
    }
  }

  await Product.insertMany(products);
  return products;
}

async function seedPages() {
  const pages = [];

  for (const page of marketplacePagesSeed) {
    const savedPage = await Page.findOneAndUpdate(
      { slug: page.slug },
      {
        $set: {
          type: policyPageSlugs.has(page.slug) ? "policy" : "page",
          title: page.title,
          content: page.content,
          seo: page.seo,
          isPublished: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    pages.push(savedPage);
  }

  return pages;
}

async function seedSeoPages() {
  const pages = [];

  for (const page of designedSeoPagesSeed) {
    const savedPage = await SeoPage.findOneAndUpdate(
      { key: page.key },
      { $set: page },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    pages.push(savedPage);
  }

  return pages;
}

async function seedMenuSettings() {
  const browseMenu = [
    {
      id: "browse_home_decor",
      label: "Home Decor",
      url: "/category/home-decor",
      link: "/category/home-decor",
      type: "category",
      submenu: [
        {
          id: "browse_home_decor_living",
          label: "Living Room Decor",
          url: "/products?category=home-decor&section=living-room",
          link: "/products?category=home-decor&section=living-room",
          type: "custom",
          submenu: [
            { id: "browse_home_decor_living_mirrors", label: "Mirrors", url: "/products?category=home-decor&tag=mirrors", link: "/products?category=home-decor&tag=mirrors", type: "custom", submenu: [] },
            { id: "browse_home_decor_living_lamps", label: "Table Lamps", url: "/products?category=home-decor&tag=lamp", link: "/products?category=home-decor&tag=lamp", type: "custom", submenu: [] },
            { id: "browse_home_decor_living_coffee", label: "Coffee Table Accents", url: "/products?category=home-decor&tag=accent", link: "/products?category=home-decor&tag=accent", type: "custom", submenu: [] },
            { id: "browse_home_decor_living_sale", label: "Living Room Sale", url: "/products?category=home-decor&sort=popular", link: "/products?category=home-decor&sort=popular", type: "custom", submenu: [] }
          ]
        },
        {
          id: "browse_home_decor_bedroom",
          label: "Bedroom Decor",
          url: "/products?category=home-decor&section=bedroom",
          link: "/products?category=home-decor&section=bedroom",
          type: "custom",
          submenu: [
            { id: "browse_home_decor_bedroom_wall", label: "Wall Art", url: "/products?category=home-decor&tag=wall-art", link: "/products?category=home-decor&tag=wall-art", type: "custom", submenu: [] },
            { id: "browse_home_decor_bedroom_textiles", label: "Throws & Textiles", url: "/products?category=home-decor&tag=textiles", link: "/products?category=home-decor&tag=textiles", type: "custom", submenu: [] },
            { id: "browse_home_decor_bedroom_candles", label: "Candles", url: "/products?category=home-decor&tag=candle", link: "/products?category=home-decor&tag=candle", type: "custom", submenu: [] }
          ]
        },
        {
          id: "browse_home_decor_featured",
          label: "New & Featured",
          url: "/products?category=home-decor&sort=newest",
          link: "/products?category=home-decor&sort=newest",
          type: "custom",
          submenu: [
            { id: "browse_home_decor_best", label: "Best Sellers", url: "/products?category=home-decor&sort=popular", link: "/products?category=home-decor&sort=popular", type: "custom", submenu: [] },
            { id: "browse_home_decor_new", label: "New Arrivals", url: "/products?category=home-decor&sort=newest", link: "/products?category=home-decor&sort=newest", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_kitchen_dining",
      label: "Kitchen & Dining",
      url: "/category/kitchen-dining",
      link: "/category/kitchen-dining",
      type: "category",
      submenu: [
        {
          id: "browse_kitchen_tableware",
          label: "Tableware",
          url: "/products?category=kitchen-dining&section=tableware",
          link: "/products?category=kitchen-dining&section=tableware",
          type: "custom",
          submenu: [
            { id: "browse_kitchen_plates", label: "Plates & Bowls", url: "/products?category=kitchen-dining&tag=plates", link: "/products?category=kitchen-dining&tag=plates", type: "custom", submenu: [] },
            { id: "browse_kitchen_serving", label: "Serving Pieces", url: "/products?category=kitchen-dining&tag=serveware", link: "/products?category=kitchen-dining&tag=serveware", type: "custom", submenu: [] },
            { id: "browse_kitchen_glassware", label: "Glassware", url: "/products?category=kitchen-dining&tag=glass", link: "/products?category=kitchen-dining&tag=glass", type: "custom", submenu: [] }
          ]
        },
        {
          id: "browse_kitchen_tools",
          label: "Cook & Prep",
          url: "/products?category=kitchen-dining&section=prep",
          link: "/products?category=kitchen-dining&section=prep",
          type: "custom",
          submenu: [
            { id: "browse_kitchen_tools_prep", label: "Prep Tools", url: "/products?category=kitchen-dining&tag=prep", link: "/products?category=kitchen-dining&tag=prep", type: "custom", submenu: [] },
            { id: "browse_kitchen_tools_storage", label: "Storage", url: "/products?category=kitchen-dining&tag=storage", link: "/products?category=kitchen-dining&tag=storage", type: "custom", submenu: [] },
            { id: "browse_kitchen_tools_sale", label: "Kitchen Sale", url: "/products?category=kitchen-dining&sort=popular", link: "/products?category=kitchen-dining&sort=popular", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_apparel",
      label: "Apparel",
      url: "/category/apparel",
      link: "/category/apparel",
      type: "category",
      submenu: [
        {
          id: "browse_apparel_womens",
          label: "Womenswear",
          url: "/products?category=apparel&section=women",
          link: "/products?category=apparel&section=women",
          type: "custom",
          submenu: [
            { id: "browse_apparel_womens_tops", label: "Tops", url: "/products?category=apparel&tag=tops", link: "/products?category=apparel&tag=tops", type: "custom", submenu: [] },
            { id: "browse_apparel_womens_jackets", label: "Jackets", url: "/products?category=apparel&tag=jacket", link: "/products?category=apparel&tag=jacket", type: "custom", submenu: [] },
            { id: "browse_apparel_womens_sets", label: "Matching Sets", url: "/products?category=apparel&tag=set", link: "/products?category=apparel&tag=set", type: "custom", submenu: [] }
          ]
        },
        {
          id: "browse_apparel_mens",
          label: "Menswear",
          url: "/products?category=apparel&section=men",
          link: "/products?category=apparel&section=men",
          type: "custom",
          submenu: [
            { id: "browse_apparel_mens_shirts", label: "Shirts", url: "/products?category=apparel&tag=shirt", link: "/products?category=apparel&tag=shirt", type: "custom", submenu: [] },
            { id: "browse_apparel_mens_outerwear", label: "Outerwear", url: "/products?category=apparel&tag=outerwear", link: "/products?category=apparel&tag=outerwear", type: "custom", submenu: [] },
            { id: "browse_apparel_mens_sale", label: "Apparel Sale", url: "/products?category=apparel&sort=popular", link: "/products?category=apparel&sort=popular", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_footwear",
      label: "Footwear",
      url: "/category/footwear",
      link: "/category/footwear",
      type: "category",
      submenu: [
        {
          id: "browse_footwear_daily",
          label: "Daily Styles",
          url: "/products?category=footwear&section=daily",
          link: "/products?category=footwear&section=daily",
          type: "custom",
          submenu: [
            { id: "browse_footwear_sneakers", label: "Sneakers", url: "/products?category=footwear&tag=sneakers", link: "/products?category=footwear&tag=sneakers", type: "custom", submenu: [] },
            { id: "browse_footwear_slides", label: "Slides", url: "/products?category=footwear&tag=slides", link: "/products?category=footwear&tag=slides", type: "custom", submenu: [] }
          ]
        },
        {
          id: "browse_footwear_featured",
          label: "Featured",
          url: "/products?category=footwear&sort=popular",
          link: "/products?category=footwear&sort=popular",
          type: "custom",
          submenu: [
            { id: "browse_footwear_new", label: "New Arrivals", url: "/products?category=footwear&sort=newest", link: "/products?category=footwear&sort=newest", type: "custom", submenu: [] },
            { id: "browse_footwear_top", label: "Top Rated", url: "/products?category=footwear&sort=popular", link: "/products?category=footwear&sort=popular", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_bags_accessories",
      label: "Bags & Accessories",
      url: "/category/bags-accessories",
      link: "/category/bags-accessories",
      type: "category",
      submenu: [
        {
          id: "browse_bags_everyday",
          label: "Everyday Carry",
          url: "/products?category=bags-accessories&section=everyday",
          link: "/products?category=bags-accessories&section=everyday",
          type: "custom",
          submenu: [
            { id: "browse_bags_crossbody", label: "Crossbody Bags", url: "/products?category=bags-accessories&tag=crossbody", link: "/products?category=bags-accessories&tag=crossbody", type: "custom", submenu: [] },
            { id: "browse_bags_wallets", label: "Wallets", url: "/products?category=bags-accessories&tag=wallet", link: "/products?category=bags-accessories&tag=wallet", type: "custom", submenu: [] },
            { id: "browse_bags_travel", label: "Travel Bags", url: "/products?category=bags-accessories&tag=travel", link: "/products?category=bags-accessories&tag=travel", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_beauty_skincare",
      label: "Beauty & Skincare",
      url: "/category/beauty-skincare",
      link: "/category/beauty-skincare",
      type: "category",
      submenu: [
        {
          id: "browse_beauty_routine",
          label: "Daily Routine",
          url: "/products?category=beauty-skincare&section=routine",
          link: "/products?category=beauty-skincare&section=routine",
          type: "custom",
          submenu: [
            { id: "browse_beauty_serums", label: "Serums", url: "/products?category=beauty-skincare&tag=serum", link: "/products?category=beauty-skincare&tag=serum", type: "custom", submenu: [] },
            { id: "browse_beauty_moisturizers", label: "Moisturizers", url: "/products?category=beauty-skincare&tag=moisturizer", link: "/products?category=beauty-skincare&tag=moisturizer", type: "custom", submenu: [] },
            { id: "browse_beauty_masks", label: "Masks", url: "/products?category=beauty-skincare&tag=mask", link: "/products?category=beauty-skincare&tag=mask", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_fragrance",
      label: "Fragrance",
      url: "/category/fragrance",
      link: "/category/fragrance",
      type: "category",
      submenu: [
        {
          id: "browse_fragrance_signature",
          label: "Signature Scents",
          url: "/products?category=fragrance&section=signature",
          link: "/products?category=fragrance&section=signature",
          type: "custom",
          submenu: [
            { id: "browse_fragrance_daily", label: "Daily Wear", url: "/products?category=fragrance&tag=daily", link: "/products?category=fragrance&tag=daily", type: "custom", submenu: [] },
            { id: "browse_fragrance_travel", label: "Travel Spray", url: "/products?category=fragrance&tag=travel", link: "/products?category=fragrance&tag=travel", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_tech_gadgets",
      label: "Tech & Gadgets",
      url: "/category/tech-gadgets",
      link: "/category/tech-gadgets",
      type: "category",
      submenu: [
        {
          id: "browse_tech_desktop",
          label: "Desktop Tech",
          url: "/products?category=tech-gadgets&section=desktop",
          link: "/products?category=tech-gadgets&section=desktop",
          type: "custom",
          submenu: [
            { id: "browse_tech_chargers", label: "Chargers", url: "/products?category=tech-gadgets&tag=charger", link: "/products?category=tech-gadgets&tag=charger", type: "custom", submenu: [] },
            { id: "browse_tech_audio", label: "Audio", url: "/products?category=tech-gadgets&tag=audio", link: "/products?category=tech-gadgets&tag=audio", type: "custom", submenu: [] },
            { id: "browse_tech_accessories", label: "Accessories", url: "/products?category=tech-gadgets&tag=accessories", link: "/products?category=tech-gadgets&tag=accessories", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_workspace",
      label: "Workspace",
      url: "/category/workspace",
      link: "/category/workspace",
      type: "category",
      submenu: [
        {
          id: "browse_workspace_furniture",
          label: "Desk Setup",
          url: "/products?category=workspace&section=desk-setup",
          link: "/products?category=workspace&section=desk-setup",
          type: "custom",
          submenu: [
            { id: "browse_workspace_desks", label: "Desk Shelves", url: "/products?category=workspace&tag=desk", link: "/products?category=workspace&tag=desk", type: "custom", submenu: [] },
            { id: "browse_workspace_organizers", label: "Organizers", url: "/products?category=workspace&tag=organizer", link: "/products?category=workspace&tag=organizer", type: "custom", submenu: [] },
            { id: "browse_workspace_lighting", label: "Lighting", url: "/products?category=workspace&tag=lamp", link: "/products?category=workspace&tag=lamp", type: "custom", submenu: [] }
          ]
        }
      ]
    },
    {
      id: "browse_travel",
      label: "Travel Essentials",
      url: "/category/travel-essentials",
      link: "/category/travel-essentials",
      type: "category",
      submenu: [
        {
          id: "browse_travel_packing",
          label: "Packing & Organization",
          url: "/products?category=travel-essentials&section=packing",
          link: "/products?category=travel-essentials&section=packing",
          type: "custom",
          submenu: [
            { id: "browse_travel_packing_cubes", label: "Packing Cubes", url: "/products?category=travel-essentials&tag=packing-cubes", link: "/products?category=travel-essentials&tag=packing-cubes", type: "custom", submenu: [] },
            { id: "browse_travel_bottles", label: "Travel Bottles", url: "/products?category=travel-essentials&tag=travel-bottle", link: "/products?category=travel-essentials&tag=travel-bottle", type: "custom", submenu: [] }
          ]
        }
      ]
    }
  ];

  const footerMenu = [
    { id: "page_about_us", label: "About Us", url: "/about-us", link: "/about-us", type: "custom", submenu: [] },
    { id: "page_faqs", label: "FAQs", url: "/faqs", link: "/faqs", type: "custom", submenu: [] },
    { id: "page_contact_us", label: "Contact Us", url: "/contact-us", link: "/contact-us", type: "custom", submenu: [] },
    { id: "page_payment_options", label: "Payment Options", url: "/pages/payment-options", link: "/pages/payment-options", type: "page", submenu: [] },
    { id: "page_how_it_works", label: "How It Works", url: "/pages/how-it-works", link: "/pages/how-it-works", type: "page", submenu: [] },
    { id: "page_sell_on_marketsphere", label: "Sell on MarketSphere", url: "/pages/sell-on-marketsphere", link: "/pages/sell-on-marketsphere", type: "page", submenu: [] }
  ];

  const policiesMenu = marketplacePagesSeed
    .filter((page) => policyPageSlugs.has(page.slug))
    .map((page) => ({
      id: `policy_${page.slug}`,
      label: page.title.replace(" Policy", ""),
      url: `/policies/${page.slug}`,
      link: `/policies/${page.slug}`,
      type: "policy",
      submenu: []
    }));

  const mainNavMenu = [
    { id: "nav_home", label: "Home", url: "/", link: "/", type: "custom", submenu: [] },
    {
      id: "nav_products",
      label: "Products",
      url: "/products",
      link: "/products",
      type: "custom",
      submenu: [
        { id: "nav_products_new", label: "New Arrivals", url: "/products?sort=newest", link: "/products?sort=newest", type: "custom", submenu: [] },
        { id: "nav_products_popular", label: "Popular Products", url: "/products?sort=popular", link: "/products?sort=popular", type: "custom", submenu: [] },
        { id: "nav_products_sale", label: "Best Value", url: "/products?sort=price_asc", link: "/products?sort=price_asc", type: "custom", submenu: [] }
      ]
    },
    {
      id: "nav_categories",
      label: "Categories",
      url: "/categories",
      link: "/categories",
      type: "custom",
      submenu: [
        { id: "nav_categories_home", label: "Home Decor", url: "/category/home-decor", link: "/category/home-decor", type: "category", submenu: [] },
        { id: "nav_categories_style", label: "Apparel", url: "/category/apparel", link: "/category/apparel", type: "category", submenu: [] },
        { id: "nav_categories_tech", label: "Tech & Gadgets", url: "/category/tech-gadgets", link: "/category/tech-gadgets", type: "category", submenu: [] }
      ]
    },
    { id: "nav_about_us", label: "About Us", url: "/about-us", link: "/about-us", type: "custom", submenu: [] },
    { id: "nav_faqs", label: "FAQs", url: "/faqs", link: "/faqs", type: "custom", submenu: [] },
    { id: "nav_contact_us", label: "Contact Us", url: "/contact-us", link: "/contact-us", type: "custom", submenu: [] },
    { id: "nav_support", label: "Support", url: "/support", link: "/support", type: "custom", submenu: [] }
  ];

  await MenuSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        browseMenu,
        footerMenu,
        policiesMenu,
        mainNavMenu
      },
      $setOnInsert: {
        key: "default",
        topBarMenu: []
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

const seed = async () => {
  await connectDatabase();
  await clearSeedData();
  await ensureAdmin();
  const categories = await seedCategories();
  const vendors = await seedVendors();
  const products = await seedProducts(vendors, categories);
  const pages = await seedPages();
  const seoPages = await seedSeoPages();
  await seedMenuSettings();

  console.log("Admin seeded: admin@marketplace.local / Admin@12345");
  console.log("Vendor accounts:");
  vendors.forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor.storeName} -> ${vendor.email} / Vendor@12345`);
  });
  console.log(`Categories seeded: ${categories.length}`);
  console.log(`Products seeded: ${products.length}`);
  console.log(`Pages seeded: ${pages.length}`);
  console.log(`Designed SEO pages seeded: ${seoPages.length}`);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
