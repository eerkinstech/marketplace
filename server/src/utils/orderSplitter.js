export const splitOrderByVendor = (items = []) => {
  const grouped = new Map();

  for (const item of items) {
    if (!grouped.has(String(item.vendor))) {
      grouped.set(String(item.vendor), []);
    }
    grouped.get(String(item.vendor)).push(item);
  }

  return Array.from(grouped.entries()).map(([vendor, vendorItems]) => ({
    vendor,
    items: vendorItems,
    subtotal: vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }));
};
