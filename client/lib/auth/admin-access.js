"use client";

export const adminMenuGroups = [
  {
    groupId: "main",
    groupLabel: "MAIN",
    collapsible: true,
    items: [
      { icon: "home", label: "Dashboard", path: "/admin/dashboard", permissionId: "dashboard" }
    ]
  },
  {
    groupId: "products",
    groupLabel: "PRODUCTS & INVENTORY",
    collapsible: true,
    items: [
      { icon: "package", label: "Products", path: "/admin/products", permissionId: "products" },
      { icon: "plus-circle", label: "Add Product", path: "/admin/products/new", permissionId: "products" },
      { icon: "boxes", label: "Inventory", path: "/admin/inventory", permissionId: "inventory" },
      { icon: "tags", label: "Categories", path: "/admin/categories", permissionId: "categories" },
      { icon: "layer-group", label: "Home Page", path: "/admin/collections", permissionId: "collections" }
    ]
  },
  {
    groupId: "content",
    groupLabel: "MEDIA & CONTENT",
    collapsible: true,
    items: [
      { icon: "image", label: "Media Library", path: "/admin/media", permissionId: "media" },
      { icon: "list", label: "Menus", path: "/admin/menus", permissionId: "menu" },
      { icon: "images", label: "Sliders", path: "/admin/sliders", permissionId: "sliders" },
      { icon: "plus", label: "Dynamic Page", path: "/admin/pages", permissionId: "pages" }
    ]
  },
  {
    groupId: "sales",
    groupLabel: "SALES & ORDERS",
    collapsible: true,
    items: [
      { icon: "clipboard-list", label: "Orders", path: "/admin/orders", permissionId: "orders" },
      { icon: "exchange-alt", label: "Returns", path: "/admin/returns", permissionId: "returns" },
      { icon: "users", label: "Customers", path: "/admin/customers", permissionId: "customers" },
      { icon: "ticket-alt", label: "Coupons", path: "/admin/coupons", permissionId: "coupons" },
      { icon: "store", label: "Vendors", path: "/admin/vendors", permissionId: "vendors" },
      { icon: "truck", label: "Shipping", path: "/admin/shipping", permissionId: "shipping" },
      { icon: "wallet", label: "Payments", path: "/admin/payments", permissionId: "payments" }
    ]
  },
  {
    groupId: "engagement",
    groupLabel: "ENGAGEMENT & SUPPORT",
    collapsible: true,
    items: [
      { icon: "star", label: "Reviews", path: "/admin/reviews", permissionId: "reviews" },
      { icon: "comments", label: "Chat", path: "/admin/chat", permissionId: "chat" },
      { icon: "envelope", label: "Emails", path: "/admin/emails", permissionId: "emails" }
    ]
  },
  {
    groupId: "settings",
    groupLabel: "SETTINGS & INSIGHTS",
    collapsible: true,
    items: [
      { icon: "chart-line", label: "Analytics", path: "/admin/analytics", permissionId: "analytics" },
      { icon: "link", label: "URL Redirects", path: "/admin/redirects", permissionId: "redirects" },
      { icon: "file-alt", label: "Pages & Policies SEO", path: "/admin/pages-seo", permissionId: "pages-seo" },
      { icon: "lock", label: "Roles & Permissions", path: "/admin/roles", permissionId: "roles" },
      { icon: "cog", label: "Store Settings", path: "/admin/settings", permissionId: "settings" }
    ]
  }
];

export const defaultAdminExpandedState = adminMenuGroups.reduce((acc, group) => {
  if (group.collapsible) acc[group.groupId] = false;
  return acc;
}, {});

export function hasAdminPermission(user, permissionId) {
  if (!user) return false;
  if (user.role !== "admin") return false;

  const permissions = Array.isArray(user?.customRole?.permissions) ? user.customRole.permissions : null;
  if (permissions) {
    return permissions.includes(permissionId);
  }

  return true;
}

export function getFirstAccessibleAdminPath(user) {
  for (const group of adminMenuGroups) {
    for (const item of group.items) {
      if (hasAdminPermission(user, item.permissionId)) {
        return item.path;
      }
    }
  }

  return "/login";
}

export function findAdminRoute(pathname) {
  const normalized = pathname?.replace(/\/$/, "") || "/";
  const items = adminMenuGroups.flatMap((group) => group.items);

  return items
    .filter((item) => normalized === item.path || normalized.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0] || null;
}

export function canAccessAdminPath(user, pathname) {
  const route = findAdminRoute(pathname);
  if (!route) return user?.role === "admin";
  return hasAdminPermission(user, route.permissionId);
}
