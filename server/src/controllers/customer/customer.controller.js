import { StatusCodes } from "http-status-codes";
import { Coupon } from "../../models/Coupon.js";
import { Order } from "../../models/Order.js";
import { Product } from "../../models/Product.js";
import { ReturnRequest } from "../../models/ReturnRequest.js";
import { Review } from "../../models/Review.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { splitOrderByVendor } from "../../utils/orderSplitter.js";
import { calculateCouponDiscount, getCouponApplicableSubtotal } from "../../services/payments/pricing.service.js";
import { calculateShippingForItems } from "../../services/shipping/shipping.service.js";

async function resolveCheckoutItems(entries = []) {
  const productIds = [...new Set(entries.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: productIds }, status: "approved" })
    .populate("shippingAreas", "name rules minRate maxRate estimatedDays isActive ownerType owner");

  if (products.length !== productIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Some products are unavailable");
  }

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const stockAdjustments = new Map();

  const items = entries.map((entry) => {
    const product = productMap.get(entry.productId);
    if (!product) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Some products are unavailable");
    }

    const matchingVariant = (product.variantCombinations || []).find((variant) => {
      if (entry.variantSku && variant.sku === entry.variantSku) return true;

      if (!entry.optionValues) return false;

      const selectedEntries = Object.entries(entry.optionValues);
      if (!selectedEntries.length) return false;

      return selectedEntries.every(([key, value]) => variant.optionValues?.get?.(key) === value || variant.optionValues?.[key] === value);
    });

    const isVariantItem = Boolean(matchingVariant);
    const availableStock = isVariantItem ? Number(matchingVariant.stock ?? 0) : Number(product.stock ?? 0);

    if (availableStock < entry.quantity) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient stock for ${product.name}`);
    }

    const variantOptionValues = matchingVariant
      ? Object.fromEntries(
          Object.entries(matchingVariant.optionValues?.toObject?.() || matchingVariant.optionValues || {})
            .filter(([, value]) => value)
        )
      : (entry.optionValues || {});

    const variantLabel = Object.entries(variantOptionValues)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    const price = isVariantItem ? Number(matchingVariant.price ?? product.price) : Number(product.price);
    const weight = isVariantItem && Number(matchingVariant.weight || 0) > 0
      ? Number(matchingVariant.weight || 0)
      : Number(product.weight || 0);
    const image = matchingVariant?.image || product.images?.[0]?.url;
    const adjustmentKey = `${entry.productId}:${entry.variantSku || variantLabel || "default"}`;
    const currentAdjustment = stockAdjustments.get(adjustmentKey) || {
      productId: entry.productId,
      quantity: 0,
      variantSku: matchingVariant?.sku || entry.variantSku || "",
      optionValues: variantOptionValues
    };

    currentAdjustment.quantity += entry.quantity;
    stockAdjustments.set(adjustmentKey, currentAdjustment);

    return {
      product: product._id,
      vendor: product.vendor,
      name: product.name,
      slug: product.slug,
      quantity: entry.quantity,
      price,
      weight,
      image,
      variantSku: matchingVariant?.sku || entry.variantSku || "",
      variantLabel,
      optionValues: variantOptionValues
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { items, subtotal, productMap, stockAdjustments };
}

async function resolveCouponQuote(couponCode, items, subtotal) {
  if (!couponCode) {
    return { coupon: null, discountAmount: 0, applicableSubtotal: 0 };
  }

  const coupon = await Coupon.findOne({
    code: String(couponCode).trim().toUpperCase(),
    isActive: true,
    expiry: { $gte: new Date() }
  }).populate("productId", "name title");

  if (!coupon) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Coupon code is invalid or expired.");
  }

  if (Number(coupon.maxUses || 0) > 0 && Number(coupon.usedCount || 0) >= Number(coupon.maxUses || 0)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Coupon usage limit has been reached.");
  }

  const applicableSubtotal = getCouponApplicableSubtotal(coupon, items, subtotal);
  if (subtotal < Number(coupon.minimumOrderAmount || 0)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Coupon requires a minimum order of ${Number(coupon.minimumOrderAmount || 0).toFixed(2)}.`
    );
  }

  if (coupon.productId && applicableSubtotal <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Coupon is not assigned to any product in your cart.");
  }

  return {
    coupon,
    applicableSubtotal,
    discountAmount: calculateCouponDiscount(coupon, subtotal, items)
  };
}

export const quoteCoupon = asyncHandler(async (req, res) => {
  const { items: requestedItems, couponCode } = req.validatedBody;
  const { items, subtotal } = await resolveCheckoutItems(requestedItems);
  const { coupon, applicableSubtotal, discountAmount } = await resolveCouponQuote(couponCode, items, subtotal);

  res.json({
    success: true,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue || 0),
      minimumOrderAmount: Number(coupon.minimumOrderAmount || 0),
      discountAmount,
      applicableSubtotal,
      product: coupon.productId
        ? {
            _id: String(coupon.productId?._id || ""),
            name: coupon.productId?.title || coupon.productId?.name || ""
          }
        : null
    }
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const payload = req.validatedBody;
  const normalizedCustomerEmail = String(payload.customerEmail || req.user?.email || "").trim().toLowerCase();
  const normalizedCustomerName = String(payload.shippingAddress?.fullName || req.user?.name || "").trim();
  const normalizedCustomerPhone = String(payload.shippingAddress?.phone || req.user?.phone || "").trim();

  if (!req.user && !normalizedCustomerEmail) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required for guest checkout");
  }

  const { items, subtotal, productMap, stockAdjustments } = await resolveCheckoutItems(payload.items);
  const { coupon, discountAmount } = await resolveCouponQuote(payload.couponCode, items, subtotal);
  const { shippingAmount } = calculateShippingForItems(items, productMap);
  const totalAmount = subtotal + shippingAmount - discountAmount;

  const order = await Order.create({
    user: req.user?._id || null,
    customerName: normalizedCustomerName,
    customerEmail: normalizedCustomerEmail,
    customerPhone: normalizedCustomerPhone,
    items,
    shippingAddress: payload.shippingAddress,
    billingAddress: payload.billingAddress,
    paymentMethod: payload.paymentMethod,
    paymentStatus: "paid",
    totalAmount,
    shippingAmount,
    discountAmount,
    coupon: coupon?._id,
    vendorBreakdown: splitOrderByVendor(items).map((entry) => ({
      vendor: entry.vendor,
      subtotal: entry.subtotal
    }))
  });

  const adjustmentsByProduct = Array.from(stockAdjustments.values()).reduce((grouped, adjustment) => {
    const current = grouped.get(adjustment.productId) || [];
    current.push(adjustment);
    grouped.set(adjustment.productId, current);
    return grouped;
  }, new Map());

  await Promise.all(
    Array.from(adjustmentsByProduct.entries()).map(async ([productId, adjustments]) => {
      const product = productMap.get(productId);
      const totalQuantity = adjustments.reduce((sum, adjustment) => sum + adjustment.quantity, 0);

      product.stock = Math.max(0, Number(product.stock || 0) - totalQuantity);
      product.soldCount = Number(product.soldCount || 0) + totalQuantity;

      adjustments.forEach((adjustment) => {
        if (!adjustment.variantSku && !Object.keys(adjustment.optionValues || {}).length) return;

        const variant = (product.variantCombinations || []).find((entry) => {
          if (adjustment.variantSku && entry.sku === adjustment.variantSku) return true;

          const selectedEntries = Object.entries(adjustment.optionValues || {});
          if (!selectedEntries.length) return false;

          return selectedEntries.every(([key, value]) => entry.optionValues?.get?.(key) === value || entry.optionValues?.[key] === value);
        });

        if (!variant) return;
        variant.stock = Math.max(0, Number(variant.stock || 0) - adjustment.quantity);
      });

      await product.save();
    })
  );

  if (coupon) {
    coupon.usedCount += 1;
    await coupon.save();
  }

  res.status(StatusCodes.CREATED).json({ success: true, data: order });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt").lean();
  res.json({ success: true, data: orders });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate("coupon", "code").lean();
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  res.json({ success: true, data: order });
});

export const listMyReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ customer: req.user._id })
    .populate("product", "name slug sku images")
    .populate("vendor", "name storeName email")
    .populate("order", "createdAt")
    .sort("-createdAt")
    .lean();

  res.json({
    success: true,
    data: returns.map((entry) => ({
      ...entry,
      vendorLabel: entry.vendor?.storeName || entry.vendor?.name || entry.vendor?.email || "Marketplace"
    }))
  });
});

export const createReview = asyncHandler(async (req, res) => {
  const payload = req.validatedBody;
  const order = await Order.findOne({ _id: payload.orderId, user: req.user._id }).lean();
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");

  const orderedProduct = order.items.find((item) => String(item.product) === payload.productId);
  if (!orderedProduct) throw new ApiError(StatusCodes.BAD_REQUEST, "Product not found in order");

  const review = await Review.create({
    product: payload.productId,
    user: req.user._id,
    order: payload.orderId,
    rating: payload.rating,
    comment: payload.comment,
    status: "pending"
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: review });
});
