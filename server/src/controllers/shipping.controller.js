import { StatusCodes } from "http-status-codes";
import { Product } from "../models/Product.js";
import { ShippingArea } from "../models/ShippingArea.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  buildShippingPreview,
  calculateShippingForItems,
  normalizeShippingRules
} from "../services/shipping/shipping.service.js";

async function ensureAreasAccessible(areaIds = [], filter = {}) {
  const normalizedIds = (areaIds || []).filter(Boolean);
  const areas = await ShippingArea.find({ _id: { $in: normalizedIds }, ...filter }).select("_id").lean();
  if (areas.length !== normalizedIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "One or more shipping areas are invalid");
  }
  return normalizedIds;
}

function toAreaPayload(body = {}) {
  const rules = normalizeShippingRules(body.rules || [], body.minRate, body.maxRate).map((rule) => {
    const nextRule = {
      rate: rule.rate,
      isFreeShipping: Boolean(rule.isFreeShipping)
    };

    if (rule.minWeight !== null) nextRule.minWeight = rule.minWeight;
    if (rule.maxWeight !== null) nextRule.maxWeight = rule.maxWeight;
    if (rule.minPrice !== null) nextRule.minPrice = rule.minPrice;
    if (rule.maxPrice !== null) nextRule.maxPrice = rule.maxPrice;

    return nextRule;
  });

  return {
    name: String(body.name || "").trim(),
    rules,
    minRate: rules.length ? Math.min(...rules.map((rule) => rule.rate)) : 0,
    maxRate: rules.length ? Math.max(...rules.map((rule) => rule.rate)) : 0,
    estimatedDays: String(body.estimatedDays || "").trim(),
    isActive: body.isActive !== false
  };
}

function validateAreaPayload(payload) {
  if (!payload.name) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Shipping name is required");
  }

  if (!payload.rules.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Add at least one weight rule");
  }

  payload.rules.forEach((rule, index) => {
    const hasWeight = rule.minWeight !== null || rule.maxWeight !== null;
    const hasPrice = rule.minPrice !== null || rule.maxPrice !== null;

    if (!hasWeight && !hasPrice) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Rule ${index + 1} must use weight, price, or both`);
    }

    if (rule.minWeight !== null && rule.maxWeight !== null && rule.maxWeight < rule.minWeight) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Rule ${index + 1} has an invalid weight range`);
    }

    if (rule.minPrice !== null && rule.maxPrice !== null && rule.maxPrice < rule.minPrice) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Rule ${index + 1} has an invalid price range`);
    }

    const nextRule = payload.rules[index + 1];
    const sameWeightWindow = nextRule
      && rule.minWeight === nextRule.minWeight
      && rule.maxWeight === nextRule.maxWeight;
    const samePriceWindow = nextRule
      && rule.minPrice === nextRule.minPrice
      && rule.maxPrice === nextRule.maxPrice;
    if (nextRule && sameWeightWindow && samePriceWindow) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Duplicate shipping rules are not allowed");
    }
  });
}

function toAreaView(area) {
  const rules = normalizeShippingRules(area.rules, area.minRate, area.maxRate);
  return {
    ...area,
    rules,
    minRate: rules.length ? Math.min(...rules.map((rule) => rule.rate)) : 0,
    maxRate: rules.length ? Math.max(...rules.map((rule) => rule.rate)) : 0
  };
}

async function buildShippingResponse({ ownerType, owner = null, productFilter = {}, includeVendorSummary = false }) {
  const areaFilter = ownerType === "admin"
    ? { ownerType: "admin", owner: null }
    : { ownerType: "vendor", owner };

  const [areas, products] = await Promise.all([
    ShippingArea.find(areaFilter).sort("name").lean(),
    Product.find(productFilter)
      .select("name slug sku status shippingAreas vendor weight price variantCombinations")
      .populate("shippingAreas", "name rules minRate maxRate estimatedDays isActive ownerType owner")
      .populate("vendor", "name storeName email")
      .sort("name")
      .lean()
  ]);

  const normalizedAreas = areas.map((area) => {
    const normalizedArea = toAreaView(area);
    const assignedProducts = products.filter((product) =>
      (product.shippingAreas || []).some((productArea) => String(productArea._id) === String(area._id))
    ).length;

    return {
      ...normalizedArea,
      assignedProducts
    };
  });
  const response = {
    areas: normalizedAreas,
    products: products.map((product) => {
      const normalizedProductAreas = (product.shippingAreas || []).map(toAreaView);
      const preview = buildShippingPreview({ ...product, shippingAreas: normalizedProductAreas });

      return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        status: product.status,
        vendor: product.vendor || null,
        shippingAreas: normalizedProductAreas,
        weight: Number(product.weight || 0),
        price: Number(product.price || 0),
        hasVariantWeights: (product.variantCombinations || []).some((variant) => Number(variant.weight || 0) > 0),
        minVariantWeight: (product.variantCombinations || []).reduce((min, variant) => {
          const weight = Number(variant.weight || 0);
          if (weight <= 0) return min;
          return min === null ? weight : Math.min(min, weight);
        }, null),
        maxVariantWeight: (product.variantCombinations || []).reduce((max, variant) => {
          const weight = Number(variant.weight || 0);
          if (weight <= 0) return max;
          return max === null ? weight : Math.max(max, weight);
        }, null),
        minVariantPrice: (product.variantCombinations || []).reduce((min, variant) => {
          const price = Number(variant.price || 0);
          if (price <= 0) return min;
          return min === null ? price : Math.min(min, price);
        }, null),
        maxVariantPrice: (product.variantCombinations || []).reduce((max, variant) => {
          const price = Number(variant.price || 0);
          if (price <= 0) return max;
          return max === null ? price : Math.max(max, price);
        }, null),
        shippingPreview: preview
      };
    })
  };

  if (includeVendorSummary) {
    const [vendors, vendorAreas, vendorProducts] = await Promise.all([
      User.find({ role: "vendor" }).select("name storeName email").sort("storeName name").lean(),
      ShippingArea.find({ ownerType: "vendor" })
        .populate("owner", "name storeName email")
        .sort("name")
        .lean(),
      Product.find({})
        .select("vendor shippingAreas")
        .populate("vendor", "name storeName email")
        .lean()
    ]);

    response.vendorShippingAreas = vendorAreas.map((area) => {
      const assignedProducts = vendorProducts.filter((product) =>
        String(product.vendor?._id || "") === String(area.owner?._id || area.owner || "")
        && (product.shippingAreas || []).some((productAreaId) => String(productAreaId) === String(area._id))
      ).length;

      return {
        ...toAreaView(area),
        vendor: area.owner
          ? {
              _id: area.owner._id,
              vendorName: area.owner.storeName || area.owner.name || area.owner.email,
              contact: area.owner.email
            }
          : null,
        assignedProducts
      };
    });

    response.vendorSummary = vendors.map((vendor) => {
      const vendorOwnedProducts = vendorProducts.filter((product) => String(product.vendor?._id || "") === String(vendor._id));
      const ownedAreas = vendorAreas.filter((area) => String(area.owner?._id || area.owner || "") === String(vendor._id));
      const assignedProductCount = vendorOwnedProducts.filter((product) =>
        (product.shippingAreas || []).some((productAreaId) =>
          ownedAreas.some((area) => String(area._id) === String(productAreaId))
        )
      ).length;

      return {
        _id: vendor._id,
        vendorName: vendor.storeName || vendor.name || vendor.email,
        contact: vendor.email,
        shippingAreas: ownedAreas.length,
        assignedShippingAreas: ownedAreas.filter((area) =>
          vendorOwnedProducts.some((product) =>
            (product.shippingAreas || []).some((productAreaId) => String(productAreaId) === String(area._id))
          )
        ).length,
        productCount: vendorOwnedProducts.length,
        assignedProductCount
      };
    });
  }

  return response;
}

async function quoteShippingFromItems(items = []) {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: productIds }, status: "approved" })
    .populate("shippingAreas", "name rules minRate maxRate estimatedDays isActive ownerType owner");

  if (products.length !== productIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Some products are unavailable");
  }

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const resolvedItems = items.map((entry) => {
    const product = productMap.get(String(entry.productId));
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

    const weight = matchingVariant && Number(matchingVariant.weight || 0) > 0
      ? Number(matchingVariant.weight || 0)
      : Number(product.weight || 0);
    const price = matchingVariant && Number(matchingVariant.price || 0) > 0
      ? Number(matchingVariant.price || 0)
      : Number(product.price || 0);

    return {
      product: product._id,
      name: product.name,
      quantity: Number(entry.quantity || 0),
      weight,
      price
    };
  });

  return calculateShippingForItems(resolvedItems, productMap);
}

export const quoteCatalogShipping = asyncHandler(async (req, res) => {
  const data = await quoteShippingFromItems(req.validatedBody.items || []);
  res.json({ success: true, data });
});

export const getAdminShipping = asyncHandler(async (req, res) => {
  const data = await buildShippingResponse({
    ownerType: "admin",
    owner: null,
    productFilter: { vendor: req.user._id },
    includeVendorSummary: true
  });

  res.json({ success: true, data });
});

export const createAdminShippingArea = asyncHandler(async (req, res) => {
  const payload = toAreaPayload(req.body);
  validateAreaPayload(payload);

  const area = await ShippingArea.create({
    ...payload,
    ownerType: "admin",
    owner: null
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: toAreaView(area.toObject()) });
});

export const updateAdminShippingArea = asyncHandler(async (req, res) => {
  const area = await ShippingArea.findOne({ _id: req.params.id, ownerType: "admin", owner: null });
  if (!area) throw new ApiError(StatusCodes.NOT_FOUND, "Shipping area not found");

  const payload = toAreaPayload(req.body);
  validateAreaPayload(payload);
  Object.assign(area, payload);
  await area.save();

  res.json({ success: true, data: toAreaView(area.toObject()) });
});

export const deleteAdminShippingArea = asyncHandler(async (req, res) => {
  const area = await ShippingArea.findOneAndDelete({ _id: req.params.id, ownerType: "admin", owner: null });
  if (!area) throw new ApiError(StatusCodes.NOT_FOUND, "Shipping area not found");

  await Product.updateMany({ shippingAreas: area._id, vendor: req.user._id }, { $pull: { shippingAreas: area._id } });
  res.json({ success: true, message: "Shipping area deleted" });
});

export const assignAdminShippingAreasToProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");

  const incomingAreaIds = await ensureAreasAccessible(req.body.shippingAreaIds || [], { ownerType: "admin", owner: null });
  product.shippingAreas = [...new Set([...(product.shippingAreas || []).map((id) => String(id)), ...incomingAreaIds])];
  await product.save();

  await product.populate("shippingAreas", "name rules minRate maxRate estimatedDays isActive");
  res.json({ success: true, data: { ...product.toObject(), shippingAreas: (product.shippingAreas || []).map(toAreaView) } });
});

export const getVendorShippingManagement = asyncHandler(async (req, res) => {
  const data = await buildShippingResponse({
    ownerType: "vendor",
    owner: req.user._id,
    productFilter: { vendor: req.user._id }
  });

  res.json({ success: true, data });
});

export const createVendorShippingArea = asyncHandler(async (req, res) => {
  const payload = toAreaPayload(req.body);
  validateAreaPayload(payload);

  const area = await ShippingArea.create({
    ...payload,
    ownerType: "vendor",
    owner: req.user._id
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: toAreaView(area.toObject()) });
});

export const updateVendorShippingArea = asyncHandler(async (req, res) => {
  const area = await ShippingArea.findOne({ _id: req.params.id, ownerType: "vendor", owner: req.user._id });
  if (!area) throw new ApiError(StatusCodes.NOT_FOUND, "Shipping area not found");

  const payload = toAreaPayload(req.body);
  validateAreaPayload(payload);
  Object.assign(area, payload);
  await area.save();

  res.json({ success: true, data: toAreaView(area.toObject()) });
});

export const deleteVendorShippingArea = asyncHandler(async (req, res) => {
  const area = await ShippingArea.findOneAndDelete({ _id: req.params.id, ownerType: "vendor", owner: req.user._id });
  if (!area) throw new ApiError(StatusCodes.NOT_FOUND, "Shipping area not found");

  await Product.updateMany({ shippingAreas: area._id, vendor: req.user._id }, { $pull: { shippingAreas: area._id } });
  res.json({ success: true, message: "Shipping area deleted" });
});

export const assignVendorShippingAreasToProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");

  const incomingAreaIds = await ensureAreasAccessible(req.body.shippingAreaIds || [], { ownerType: "vendor", owner: req.user._id });
  product.shippingAreas = [...new Set([...(product.shippingAreas || []).map((id) => String(id)), ...incomingAreaIds])];
  await product.save();

  await product.populate("shippingAreas", "name rules minRate maxRate estimatedDays isActive");
  res.json({ success: true, data: { ...product.toObject(), shippingAreas: (product.shippingAreas || []).map(toAreaView) } });
});
