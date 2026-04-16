export const buildProductQuery = (query) => {
  const filters = { status: "approved" };

  if (query.category) filters.categorySlug = query.category;
  if (query.vendorId) filters.vendor = query.vendorId;
  if (query.search) filters.$text = { $search: query.search };
  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.price.$lte = Number(query.maxPrice);
  }

  const sortMap = {
    newest: "-createdAt",
    price_asc: "price",
    price_desc: "-price",
    rating: "-ratingAverage",
    popular: "-soldCount"
  };

  return {
    filters,
    sort: sortMap[query.sort] || "-createdAt",
    page: Number(query.page || 1),
    limit: Math.min(Number(query.limit || 12), 50)
  };
};
