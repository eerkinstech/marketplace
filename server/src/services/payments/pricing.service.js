function getItemProductId(item) {
  return String(item?.product?._id || item?.product || item?.productId || "");
}

export const getCouponApplicableSubtotal = (coupon, items = [], subtotal = 0) => {
  if (!coupon) return 0;
  if (!coupon.productId) return Number(subtotal || 0);

  const assignedProductId = String(coupon.productId?._id || coupon.productId || "");
  return items.reduce((sum, item) => {
    if (getItemProductId(item) !== assignedProductId) return sum;
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);
};

export const calculateCouponDiscount = (coupon, subtotal, items = []) => {
  if (!coupon) return 0;
  if (Number(subtotal || 0) < Number(coupon.minimumOrderAmount || 0)) return 0;

  const applicableSubtotal = getCouponApplicableSubtotal(coupon, items, subtotal);
  if (applicableSubtotal <= 0) return 0;

  if (coupon.discountType === "fixed") return Math.min(applicableSubtotal, Number(coupon.discountValue || 0));
  return Math.min(applicableSubtotal, (applicableSubtotal * Number(coupon.discountValue || 0)) / 100);
};
