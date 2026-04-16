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
    description: "Layered decor, sculptural accents, and soft-finish pieces for modern rooms.",
    image: "https://picsum.photos/seed/marketplace-home-decor/1200/800"
  },
  {
    name: "Fashion Essentials",
    description: "Tailored wardrobe staples and polished everyday accessories from independent labels.",
    image: "https://picsum.photos/seed/marketplace-fashion/1200/800"
  },
  {
    name: "Beauty & Wellness",
    description: "Skin, self-care, and wellness products designed for daily routines.",
    image: "https://picsum.photos/seed/marketplace-beauty/1200/800"
  },
  {
    name: "Tech & Desk Setup",
    description: "Thoughtful gadgets and workspace upgrades for focused, connected work.",
    image: "https://picsum.photos/seed/marketplace-tech/1200/800"
  },
  {
    name: "Kitchen & Dining",
    description: "Cookware, table styling, and practical dining pieces with a refined finish.",
    image: "https://picsum.photos/seed/marketplace-kitchen/1200/800"
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
    { name: "Textured Linen Cushion", category: "Home Decor", price: 34, compareAtPrice: 42 },
    { name: "Ceramic Table Lamp", category: "Home Decor", price: 79, compareAtPrice: 99 },
    { name: "Walnut Serving Board", category: "Kitchen & Dining", price: 48, compareAtPrice: 60 },
    { name: "Stoneware Dinner Plate Set", category: "Kitchen & Dining", price: 72, compareAtPrice: 88 },
    { name: "Minimal Wall Mirror", category: "Home Decor", price: 96, compareAtPrice: 118 },
    { name: "Handwoven Throw Blanket", category: "Home Decor", price: 68, compareAtPrice: 84 },
    { name: "Glass Storage Canister Trio", category: "Kitchen & Dining", price: 39, compareAtPrice: 48 },
    { name: "Brass Candle Holder Pair", category: "Home Decor", price: 44, compareAtPrice: 56 },
    { name: "Marble Coaster Set", category: "Kitchen & Dining", price: 28, compareAtPrice: 35 },
    { name: "Oak Entry Tray", category: "Home Decor", price: 31, compareAtPrice: 39 }
  ],
  style: [
    { name: "Structured Everyday Tote", category: "Fashion Essentials", price: 58, compareAtPrice: 74 },
    { name: "Relaxed Cotton Overshirt", category: "Fashion Essentials", price: 64, compareAtPrice: 78 },
    { name: "Hydration Skin Duo", category: "Beauty & Wellness", price: 36, compareAtPrice: 45 },
    { name: "Travel Grooming Kit", category: "Beauty & Wellness", price: 42, compareAtPrice: 52 },
    { name: "Leather Card Holder", category: "Fashion Essentials", price: 29, compareAtPrice: 36 },
    { name: "Signature Scent Roller", category: "Beauty & Wellness", price: 24, compareAtPrice: 30 },
    { name: "Classic Knit Polo", category: "Fashion Essentials", price: 54, compareAtPrice: 68 },
    { name: "Overnight Repair Mask", category: "Beauty & Wellness", price: 32, compareAtPrice: 40 },
    { name: "Soft Pleated Scarf", category: "Fashion Essentials", price: 26, compareAtPrice: 33 },
    { name: "Daily Balance Serum", category: "Beauty & Wellness", price: 38, compareAtPrice: 47 }
  ],
  utility: [
    { name: "Wireless Desk Charger", category: "Tech & Desk Setup", price: 49, compareAtPrice: 59 },
    { name: "Mechanical Keyboard Pad", category: "Tech & Desk Setup", price: 33, compareAtPrice: 41 },
    { name: "Precision Brew Kettle", category: "Kitchen & Dining", price: 67, compareAtPrice: 82 },
    { name: "Noise-Light Desk Lamp", category: "Tech & Desk Setup", price: 71, compareAtPrice: 88 },
    { name: "Stackable Spice Rack", category: "Kitchen & Dining", price: 37, compareAtPrice: 46 },
    { name: "Cable Organizer Dock", category: "Tech & Desk Setup", price: 22, compareAtPrice: 28 },
    { name: "Digital Kitchen Scale", category: "Kitchen & Dining", price: 27, compareAtPrice: 34 },
    { name: "Laptop Stand Pro", category: "Tech & Desk Setup", price: 62, compareAtPrice: 75 },
    { name: "Stainless Prep Bowl Set", category: "Kitchen & Dining", price: 31, compareAtPrice: 39 },
    { name: "Focus Timer Cube", category: "Tech & Desk Setup", price: 19, compareAtPrice: 24 }
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

function buildProductDescription(storeName, productName, categoryName) {
  return `${productName} from ${storeName} is built for customers who want a cleaner ${categoryName.toLowerCase()} experience without sacrificing durability or finish. It uses marketplace-ready copy, solid pricing, and reliable stock so seeded catalog pages feel complete during development and demos.`;
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
  const vendors = await User.find({ email: { $in: vendorEmails } }).select("_id").lean();
  const vendorIds = vendors.map((vendor) => vendor._id);

  if (vendorIds.length) {
    await Product.deleteMany({ vendor: { $in: vendorIds } });
  }

  await User.deleteMany({ email: { $in: vendorEmails } });
  await Category.deleteMany({ slug: { $in: categoriesSeed.map((category) => slugify(category.name)) } });
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
      const stock = 18 + index * 4;
      const soldCount = 5 + index * 3;

      products.push({
        name: productName,
        slug,
        description: buildProductDescription(vendor.storeName, blueprint.name, blueprint.category),
        shortDescription: `${blueprint.name} by ${vendor.storeName} for a cleaner, more polished everyday setup.`,
        price: blueprint.price,
        compareAtPrice: blueprint.compareAtPrice,
        vendor: vendor._id,
        category: category._id,
        categorySlug: category.slug,
        images: [
          {
            url: `https://picsum.photos/seed/${slug}/1200/1200`,
            alt: productName,
            publicId: `${slug}-1`
          }
        ],
        stock,
        sku: `SEED-${slug.toUpperCase().replace(/-/g, "-")}`,
        tags: [vendor.storeName, blueprint.category, "seeded", "marketplace"],
        status: "approved",
        seo: {
          metaTitle: productName,
          metaDescription: `${blueprint.name} from ${vendor.storeName} in the ${blueprint.category} category.`,
          keywords: [vendor.storeName, blueprint.category, blueprint.name]
        },
        ratingAverage: Number((4.2 + ((index % 4) * 0.2)).toFixed(1)),
        ratingCount: 6 + index,
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
    { id: "nav_about_us", label: "About Us", url: "/about-us", link: "/about-us", type: "custom", submenu: [] },
    { id: "nav_faqs", label: "FAQs", url: "/faqs", link: "/faqs", type: "custom", submenu: [] },
    { id: "nav_contact_us", label: "Contact Us", url: "/contact-us", link: "/contact-us", type: "custom", submenu: [] }
  ];

  await MenuSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        footerMenu,
        policiesMenu,
        mainNavMenu
      },
      $setOnInsert: {
        key: "default",
        browseMenu: [],
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
