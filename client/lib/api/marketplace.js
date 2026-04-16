import { API_URL } from "@/lib/constants/site";

class ApiRequestError extends Error {
  constructor(message, status = 500, cause = null, details = null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.cause = cause;
    this.details = details;
  }
}

async function fetchJson(path, options = {}) {
  let response;
  const requestOptions = {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  };

  if (options.next) {
    requestOptions.next = options.next;
  } else if (options.cache) {
    requestOptions.cache = options.cache;
  } else {
    requestOptions.cache = "no-store";
  }

  try {
    response = await fetch(`${API_URL}${path}`, requestOptions);
  } catch (error) {
    throw new ApiRequestError(`API unavailable for ${path}`, 503, error);
  }
  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch { }
    throw new ApiRequestError(payload?.message || `Request failed: ${response.status}`, response.status, null, payload?.details || null);
  }
  return response.json();
}

const withAuth = (token, options = {}) => ({ ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
const safe = async (request, fallback) => {
  try {
    return await request();
  } catch {
    return fallback;
  }
};

export const marketplaceApi = {
  getProducts: (searchParams = "") => fetchJson(`/catalog/products${searchParams}`),
  getProduct: (slug) => fetchJson(`/catalog/products/${slug}`),
  getPublicReviewSettings: () => fetchJson("/catalog/reviews/settings"),
  getStore: (slug) => fetchJson(`/catalog/stores/${slug}`),
  getStores: () => fetchJson("/catalog/stores", { next: { revalidate: 300 } }),
  getCategories: () => fetchJson("/catalog/categories", { next: { revalidate: 300 } }),
  getHomeSections: () => fetchJson("/catalog/home-sections", { next: { revalidate: 120 } }),
  getPages: () => fetchJson("/catalog/pages", { next: { revalidate: 300 } }),
  getPageBySlug: (slug) => fetchJson(`/catalog/pages/${slug}`, { next: { revalidate: 300 } }),
  getPolicyBySlug: (slug) => fetchJson(`/catalog/policies/${slug}`, { next: { revalidate: 300 } }),
  getSeoPage: (key) => fetchJson(`/catalog/seo-pages/${key}`, { next: { revalidate: 300 } }),
  resolveRedirect: (path) => fetchJson(`/catalog/redirects/resolve?path=${encodeURIComponent(path)}`),
  getPublicMenuSettings: () => fetchJson("/catalog/menus", { next: { revalidate: 300 } }),
  login: (body) => fetchJson("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => fetchJson("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  getAuthProfile: (token) => fetchJson("/auth/me", withAuth(token)),
  updateAuthProfile: (token, body) => fetchJson("/auth/me", { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  subscribeNewsletter: (body) => fetchJson("/catalog/newsletter/subscribe", { method: "POST", body: JSON.stringify(body) }),
  quoteShipping: (body, token = "") => fetchJson(
    "/catalog/shipping/quote",
    token
      ? { method: "POST", body: JSON.stringify(body), ...withAuth(token) }
      : { method: "POST", body: JSON.stringify(body) }
  ),
  quoteCoupon: (body, token = "") => fetchJson(
    "/catalog/coupons/quote",
    token
      ? { method: "POST", body: JSON.stringify(body), ...withAuth(token) }
      : { method: "POST", body: JSON.stringify(body) }
  ),
  submitContact: (body, token = "") => fetchJson(
    "/catalog/contact",
    token
      ? { method: "POST", body: JSON.stringify(body), ...withAuth(token) }
      : { method: "POST", body: JSON.stringify(body) }
  ),
  createReturnRequest: (body, token = "") => fetchJson(
    "/catalog/returns",
    token
      ? { method: "POST", body: JSON.stringify(body), ...withAuth(token) }
      : { method: "POST", body: JSON.stringify(body) }
  ),

  getCustomerOrders: (token) => fetchJson("/customer/orders", withAuth(token)),
  getCustomerOrder: (token, id) => fetchJson(`/customer/orders/${id}`, withAuth(token)),
  getCustomerReturns: (token) => fetchJson("/customer/returns", withAuth(token)),
  getConversations: (token) => fetchJson("/customer/conversations", withAuth(token)),
  createConversation: (token, body) => fetchJson("/customer/conversations", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  getMessages: (token, id) => fetchJson(`/customer/conversations/${id}/messages`, withAuth(token)),
  sendCustomerMessage: (token, id, body) => fetchJson(`/customer/conversations/${id}/messages`, { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),

  getVendorDashboard: (token) => fetchJson("/vendor/dashboard", withAuth(token)),
  getVendorProfile: (token) => fetchJson("/vendor/profile", withAuth(token)),
  updateVendorProfile: (token, body) => fetchJson("/vendor/profile", { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  getVendorAnalytics: (token) => fetchJson("/vendor/analytics", withAuth(token)),
  getVendorProducts: (token) => fetchJson("/vendor/products", withAuth(token)),
  getVendorProductsList: (token) => fetchJson("/vendor/products/list", withAuth(token)),
  getVendorProduct: (token, id) => fetchJson(`/vendor/products/${id}`, withAuth(token)),
  createVendorProduct: (token, body) => fetchJson("/vendor/products", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateVendorProduct: (token, id, body) => fetchJson(`/vendor/products/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteVendorProduct: (token, id) => fetchJson(`/vendor/products/${id}`, { method: "DELETE", ...withAuth(token) }),
  getVendorOrders: (token) => fetchJson("/vendor/orders", withAuth(token)),
  getVendorOrder: (token, id) => fetchJson(`/vendor/orders/${id}`, withAuth(token)),
  updateVendorOrderStatus: (token, body) => fetchJson("/vendor/orders/status", { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  getVendorInventory: (token) => fetchJson("/vendor/inventory", withAuth(token)),
  getVendorMedia: (token) => fetchJson("/vendor/media", withAuth(token)),
  getVendorAnnouncements: (token) => fetchJson("/vendor/announcements", withAuth(token)),
  createVendorMedia: (token, body) => fetchJson("/vendor/media", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  deleteVendorMedia: (token, id) => fetchJson(`/vendor/media/${id}`, { method: "DELETE", ...withAuth(token) }),
  bulkDeleteVendorMedia: (token, body) => fetchJson("/vendor/media/bulk-delete", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  getVendorCustomers: (token) => fetchJson("/vendor/customers", withAuth(token)),
  getVendorConversations: (token, searchParams = "") => fetchJson(`/vendor/conversations${searchParams}`, withAuth(token)),
  createVendorConversation: (token, body) => fetchJson("/vendor/conversations", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  getVendorMessages: (token, id) => fetchJson(`/vendor/conversations/${id}/messages`, withAuth(token)),
  sendVendorMessage: (token, id, body) => fetchJson(`/vendor/conversations/${id}/messages`, { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  getVendorReviews: (token) => fetchJson("/vendor/reviews", withAuth(token)),
  updateVendorReviewStatus: (token, id, body) => fetchJson(`/vendor/reviews/${id}/status`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  deleteVendorReview: (token, id) => fetchJson(`/vendor/reviews/${id}`, { method: "DELETE", ...withAuth(token) }),
  getVendorShipping: (token) => fetchJson("/vendor/shipping", withAuth(token)),
  getVendorShippingManagement: (token) => fetchJson("/vendor/shipping/manage", withAuth(token)),
  createVendorShippingArea: (token, body) => fetchJson("/vendor/shipping/areas", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateVendorShippingArea: (token, id, body) => fetchJson(`/vendor/shipping/areas/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteVendorShippingArea: (token, id) => fetchJson(`/vendor/shipping/areas/${id}`, { method: "DELETE", ...withAuth(token) }),
  assignVendorShippingAreas: (token, id, body) => fetchJson(`/vendor/shipping/products/${id}`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  getVendorReturns: (token) => fetchJson("/vendor/returns", withAuth(token)),
  updateVendorReturnStatus: (token, id, body) => fetchJson(`/vendor/returns/${id}/status`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),

  getAdminDashboard: (token) => fetchJson("/admin/dashboard", withAuth(token)),
  getAdminAnalytics: (token) => fetchJson("/admin/analytics", withAuth(token)),
  getAdminVendors: (token) => fetchJson("/admin/vendors", withAuth(token)),
  getAdminCustomers: (token) => fetchJson("/admin/customers", withAuth(token)),
  getAdminUsers: (token) => fetchJson("/admin/admin-users", withAuth(token)),
  createAdminUser: (token, body) => fetchJson("/admin/admin-users", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminRoles: (token) => fetchJson("/admin/roles", withAuth(token)),
  createAdminRole: (token, body) => fetchJson("/admin/roles", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateAdminRole: (token, id, body) => fetchJson(`/admin/roles/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteAdminRole: (token, id) => fetchJson(`/admin/roles/${id}`, { method: "DELETE", ...withAuth(token) }),
  assignAdminUserRole: (token, id, body) => fetchJson(`/admin/admin-users/${id}/role`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  updateVendorStatus: (token, id, body) => fetchJson(`/admin/vendors/${id}/status`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminProducts: (token) => fetchJson("/admin/products", withAuth(token)),
  getAdminProduct: (token, id) => fetchJson(`/admin/products/${id}`, withAuth(token)),
  createAdminProduct: (token, body) => fetchJson("/admin/products", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateAdminProduct: (token, id, body) => fetchJson(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteAdminProduct: (token, id) => fetchJson(`/admin/products/${id}`, { method: "DELETE", ...withAuth(token) }),
  getAdminInventory: (token) => fetchJson("/admin/inventory", withAuth(token)),
  getAdminMedia: (token) => fetchJson("/admin/media", withAuth(token)),
  createAdminMedia: (token, body) => fetchJson("/admin/media", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  deleteAdminMedia: (token, id) => fetchJson(`/admin/media/${id}`, { method: "DELETE", ...withAuth(token) }),
  bulkDeleteAdminMedia: (token, body) => fetchJson("/admin/media/bulk-delete", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateProductStatus: (token, id, body) => fetchJson(`/admin/products/${id}/status`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminOrders: (token) => fetchJson("/admin/orders", withAuth(token)),
  getAdminOrder: (token, id) => fetchJson(`/admin/orders/${id}`, withAuth(token)),
  getAdminReturns: (token) => fetchJson("/admin/returns", withAuth(token)),
  updateAdminReturnStatus: (token, id, body) => fetchJson(`/admin/returns/${id}/status`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  updateOrderStatus: (token, id, body) => fetchJson(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminCategories: (token) => fetchJson("/admin/categories", withAuth(token)),
  getAdminHomeSections: (token) => fetchJson("/admin/home-sections", withAuth(token)),
  createAdminHomeSection: (token, body) => fetchJson("/admin/home-sections", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateAdminHomeSection: (token, id, body) => fetchJson(`/admin/home-sections/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteAdminHomeSection: (token, id) => fetchJson(`/admin/home-sections/${id}`, { method: "DELETE", ...withAuth(token) }),
  createCategory: (token, body) => fetchJson("/admin/categories", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateCategory: (token, id, body) => fetchJson(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteCategory: (token, id) => fetchJson(`/admin/categories/${id}`, { method: "DELETE", ...withAuth(token) }),
  getAdminReviews: (token) => fetchJson("/admin/reviews", withAuth(token)),
  getAdminReviewSettings: (token) => fetchJson("/admin/reviews/settings", withAuth(token)),
  updateAdminReviewSettings: (token, body) => fetchJson("/admin/reviews/settings", { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  updateAdminReviewStatus: (token, id, body) => fetchJson(`/admin/reviews/${id}/status`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),
  deleteAdminReview: (token, id) => fetchJson(`/admin/reviews/${id}`, { method: "DELETE", ...withAuth(token) }),
  getAdminCoupons: (token) => fetchJson("/admin/coupons", withAuth(token)),
  createCoupon: (token, body) => fetchJson("/admin/coupons", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateCoupon: (token, id, body) => fetchJson(`/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteCoupon: (token, id) => fetchJson(`/admin/coupons/${id}`, { method: "DELETE", ...withAuth(token) }),
  getVendorCoupons: (token) => fetchJson("/vendor/coupons", withAuth(token)),
  createVendorCoupon: (token, body) => fetchJson("/vendor/coupons", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateVendorCoupon: (token, id, body) => fetchJson(`/vendor/coupons/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteVendorCoupon: (token, id) => fetchJson(`/vendor/coupons/${id}`, { method: "DELETE", ...withAuth(token) }),
  getAdminPages: (token) => fetchJson("/admin/pages", withAuth(token)),
  getAdminSeoPages: (token) => fetchJson("/admin/seo-pages", withAuth(token)),
  createPage: (token, body) => fetchJson("/admin/pages", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updatePage: (token, id, body) => fetchJson(`/admin/pages/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  updateSeoPage: (token, key, body) => fetchJson(`/admin/seo-pages/${key}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminRedirects: (token) => fetchJson("/admin/redirects", withAuth(token)),
  createRedirect: (token, body) => fetchJson("/admin/redirects", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateRedirect: (token, id, body) => fetchJson(`/admin/redirects/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteRedirect: (token, id) => fetchJson(`/admin/redirects/${id}`, { method: "DELETE", ...withAuth(token) }),
  getAdminAnnouncements: (token) => fetchJson("/admin/announcements", withAuth(token)),
  createAnnouncement: (token, body) => fetchJson("/admin/announcements", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateAnnouncement: (token, id, body) => fetchJson(`/admin/announcements/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminMenus: (token) => fetchJson("/admin/menus", withAuth(token)),
  getAdminMenuSettings: (token) => fetchJson("/admin/menus/settings", withAuth(token)),
  createMenu: (token, body) => fetchJson("/admin/menus", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateMenu: (token, id, body) => fetchJson(`/admin/menus/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteMenu: (token, id) => fetchJson(`/admin/menus/${id}`, { method: "DELETE", ...withAuth(token) }),
  updateAdminMenuSettings: (token, body) => fetchJson("/admin/menus/settings", { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminConversations: (token) => fetchJson("/admin/conversations", withAuth(token)),
  getAdminMessages: (token, id) => fetchJson(`/admin/conversations/${id}/messages`, withAuth(token)),
  sendAdminMessage: (token, id, body) => fetchJson(`/admin/conversations/${id}/messages`, { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminContactSubmissions: (token) => fetchJson("/admin/contact-submissions", withAuth(token)),
  getAdminNewsletterSubscribers: (token) => fetchJson("/admin/newsletter/subscribers", withAuth(token)),
  getAdminNewsletterCampaigns: (token) => fetchJson("/admin/newsletter/campaigns", withAuth(token)),
  sendLatestCategoriesNewsletter: (token, body) => fetchJson("/admin/newsletter/send-latest-categories", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  getAdminShipping: (token) => fetchJson("/admin/shipping", withAuth(token)),
  createAdminShippingArea: (token, body) => fetchJson("/admin/shipping/areas", { method: "POST", body: JSON.stringify(body), ...withAuth(token) }),
  updateAdminShippingArea: (token, id, body) => fetchJson(`/admin/shipping/areas/${id}`, { method: "PUT", body: JSON.stringify(body), ...withAuth(token) }),
  deleteAdminShippingArea: (token, id) => fetchJson(`/admin/shipping/areas/${id}`, { method: "DELETE", ...withAuth(token) }),
  assignAdminShippingAreas: (token, id, body) => fetchJson(`/admin/shipping/products/${id}`, { method: "PATCH", body: JSON.stringify(body), ...withAuth(token) }),

  safeGetProducts: (searchParams = "") => safe(() => fetchJson(`/catalog/products${searchParams}`), { success: true, data: { items: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } } }),
  safeGetProduct: (slug) => safe(() => fetchJson(`/catalog/products/${slug}`), { success: false, data: null }),
  safeGetCategories: () => safe(() => fetchJson("/catalog/categories", { next: { revalidate: 300 } }), { success: true, data: [] }),
  safeGetHomeSections: () => safe(() => fetchJson("/catalog/home-sections", { next: { revalidate: 120 } }), { success: true, data: [] }),
  safeGetStore: (slug) => safe(() => fetchJson(`/catalog/stores/${slug}`), { success: false, data: null }),
  safeGetStores: () => safe(() => fetchJson("/catalog/stores", { next: { revalidate: 300 } }), { success: true, data: [] }),
  safeGetPageBySlug: (slug) => safe(() => fetchJson(`/catalog/pages/${slug}`, { next: { revalidate: 300 } }), { success: false, data: null }),
  safeGetPolicyBySlug: (slug) => safe(() => fetchJson(`/catalog/policies/${slug}`, { next: { revalidate: 300 } }), { success: false, data: null }),
  safeGetSeoPage: (key) => safe(() => fetchJson(`/catalog/seo-pages/${key}`, { next: { revalidate: 300 } }), { success: false, data: null })
};

export { ApiRequestError };
