import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/ApiError.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareNullable(left, right) {
  if (left === null && right === null) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left - right;
}

export function normalizeShippingRules(rules = [], fallbackMinRate = 0, fallbackMaxRate = 0) {
  const normalizedRules = (Array.isArray(rules) ? rules : [])
    .map((rule) => ({
      minWeight: toNullableNumber(rule?.minWeight),
      maxWeight: toNullableNumber(rule?.maxWeight),
      minPrice: toNullableNumber(rule?.minPrice),
      maxPrice: toNullableNumber(rule?.maxPrice),
      rate: toNumber(rule?.rate, 0),
      isFreeShipping: Boolean(rule?.isFreeShipping)
    }))
    .filter((rule) => {
      const hasWeight = rule.minWeight !== null || rule.maxWeight !== null;
      const hasPrice = rule.minPrice !== null || rule.maxPrice !== null;
      return hasWeight || hasPrice || rule.isFreeShipping || rule.rate >= 0;
    })
    .map((rule) => ({
      ...rule,
      rate: rule.isFreeShipping ? 0 : rule.rate
    }))
    .sort((left, right) => {
      const weightStart = compareNullable(left.minWeight, right.minWeight);
      if (weightStart !== 0) return weightStart;
      const weightEnd = compareNullable(left.maxWeight, right.maxWeight);
      if (weightEnd !== 0) return weightEnd;
      const priceStart = compareNullable(left.minPrice, right.minPrice);
      if (priceStart !== 0) return priceStart;
      const priceEnd = compareNullable(left.maxPrice, right.maxPrice);
      if (priceEnd !== 0) return priceEnd;
      if (left.rate !== right.rate) return left.rate - right.rate;
      return Number(left.isFreeShipping) - Number(right.isFreeShipping);
    });

  if (normalizedRules.length) return normalizedRules;

  if (toNumber(fallbackMaxRate, 0) > 0 || toNumber(fallbackMinRate, 0) > 0) {
    return [
      {
        minWeight: null,
        maxWeight: null,
        minPrice: null,
        maxPrice: null,
        rate: Math.max(toNumber(fallbackMinRate, 0), toNumber(fallbackMaxRate, 0)),
        isFreeShipping: false
      }
    ];
  }

  return [];
}

function matchesRange(value, min, max) {
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function ruleSpecificity(rule) {
  return [
    rule.minWeight !== null || rule.maxWeight !== null ? 1 : 0,
    rule.minPrice !== null || rule.maxPrice !== null ? 1 : 0,
    rule.isFreeShipping ? 1 : 0
  ].reduce((sum, value) => sum + value, 0);
}

export function getMatchingShippingRule(area, context) {
  const normalizedWeight = Math.max(0, toNumber(context?.weight, 0));
  const normalizedPrice = Math.max(0, toNumber(context?.price, 0));
  const rules = normalizeShippingRules(area?.rules, area?.minRate, area?.maxRate);

  const matches = rules
    .filter((rule) => {
      const weightMatch = matchesRange(normalizedWeight, rule.minWeight, rule.maxWeight);
      const priceMatch = matchesRange(normalizedPrice, rule.minPrice, rule.maxPrice);
      return weightMatch && priceMatch;
    })
    .sort((left, right) => {
      const specificity = ruleSpecificity(right) - ruleSpecificity(left);
      if (specificity !== 0) return specificity;
      if (left.isFreeShipping !== right.isFreeShipping) return Number(right.isFreeShipping) - Number(left.isFreeShipping);
      return left.rate - right.rate;
    });

  return matches[0] || null;
}

export function getBestShippingMatch(areas = [], context) {
  const matches = (areas || [])
    .filter((area) => area?.isActive !== false)
    .map((area) => {
      const rule = getMatchingShippingRule(area, context);
      return rule ? { area, rule } : null;
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.rule.isFreeShipping !== right.rule.isFreeShipping) {
        return Number(right.rule.isFreeShipping) - Number(left.rule.isFreeShipping);
      }
      if (left.rule.rate !== right.rule.rate) return left.rule.rate - right.rule.rate;
      return String(left.area?.name || "").localeCompare(String(right.area?.name || ""));
    });

  return matches[0] || null;
}

export function describeRule(rule) {
  const parts = [];
  if (rule.minWeight !== null || rule.maxWeight !== null) {
    parts.push(`${rule.minWeight ?? 0}kg to ${rule.maxWeight ?? "above"}kg`);
  }
  if (rule.minPrice !== null || rule.maxPrice !== null) {
    parts.push(`price ${rule.minPrice ?? 0} to ${rule.maxPrice ?? "above"}`);
  }
  parts.push(rule.isFreeShipping ? "free shipping" : `${rule.rate}`);
  return parts.join(" • ");
}

export function buildShippingPreview(product) {
  const areas = product?.shippingAreas || [];
  const baseWeight = toNumber(product?.weight, 0);
  const basePrice = toNumber(product?.price, 0);
  const variants = product?.variantCombinations || [];
  const variantContexts = variants
    .map((variant) => ({
      weight: toNumber(variant?.weight, 0) > 0 ? toNumber(variant?.weight, 0) : baseWeight,
      price: toNumber(variant?.price, 0) > 0 ? toNumber(variant?.price, 0) : basePrice
    }))
    .filter((entry) => entry.weight > 0 || entry.price > 0);

  if (!areas.length) {
    return { label: "Not assigned", minRate: null, maxRate: null };
  }

  const contexts = variantContexts.length ? variantContexts : [{ weight: baseWeight, price: basePrice }];
  const matches = contexts
    .map((context) => getBestShippingMatch(areas, context))
    .filter(Boolean);

  if (!matches.length) {
    return { label: "Missing matching rule", minRate: null, maxRate: null };
  }

  const rates = matches.map((match) => match.rule.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const hasFreeShipping = matches.some((match) => match.rule.isFreeShipping);

  return {
    label: hasFreeShipping ? "Free shipping available" : matches[0].area.name,
    minRate,
    maxRate
  };
}

export function calculateShippingForItems(items = [], productMap = new Map()) {
  const lines = items.map((item) => {
    const product = productMap.get(String(item.product));
    if (!product) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Unable to calculate shipping for one or more products");
    }

    const areas = product.shippingAreas || [];
    if (!areas.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `No shipping name assigned for ${item.name}`);
    }

    const effectiveWeight = Math.max(0, toNumber(item.weight, 0));
    const unitPrice = Math.max(0, toNumber(item.price, 0));
    const match = getBestShippingMatch(areas, { weight: effectiveWeight, price: unitPrice });

    if (!match) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `No shipping rule matches ${item.name} for weight ${effectiveWeight} kg and price ${unitPrice}`
      );
    }

    return {
      product: item.product,
      name: item.name,
      quantity: toNumber(item.quantity, 0),
      weight: effectiveWeight,
      unitPrice,
      shippingName: match.area.name,
      eta: match.area.estimatedDays || "",
      isFreeShipping: Boolean(match.rule.isFreeShipping),
      rate: match.rule.rate,
      lineTotal: match.rule.rate * toNumber(item.quantity, 0)
    };
  });

  return {
    shippingAmount: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    lines
  };
}
