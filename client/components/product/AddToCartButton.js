"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cartStore } from "@/lib/utils/cart-store";

function buildVariantKey(optionValues = {}) {
  const entries = Object.entries(optionValues);
  if (!entries.length) return "default";
  return entries
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

export function AddToCartButton({
  product,
  selectedVariant = null,
  selectedImage = "",
  disabled = false,
  quantity = 1,
  className = ""
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const cartKey = useMemo(
    () => `${product._id}:${selectedVariant?.sku || buildVariantKey(selectedVariant?.optionValues)}`,
    [product._id, selectedVariant]
  );

  useEffect(() => {
    setAdded(false);
  }, [cartKey]);

  return (
    <button
      className={`btn btn-primary ${className}`.trim()}
      type="button"
      disabled={disabled}
      onClick={(event) => {
        cartStore.add({
          cartKey,
          productId: product._id,
          variantSku: selectedVariant?.sku || "",
          optionValues: selectedVariant?.optionValues || {},
          variantLabel: Object.entries(selectedVariant?.optionValues || {}).map(([key, value]) => `${key}: ${value}`).join(" | "),
          quantity: Math.max(1, Number(quantity) || 1),
          name: product.name,
          price: selectedVariant?.price ?? product.price,
          weight: Number(selectedVariant?.weight || 0) > 0 ? Number(selectedVariant?.weight || 0) : Number(product.weight || 0),
          image: selectedImage || selectedVariant?.image || product.images?.[0]?.url || "",
          slug: product.slug
        });
        if (typeof window !== "undefined") {
          const rect = event.currentTarget.getBoundingClientRect();
          window.dispatchEvent(new CustomEvent("cart:add-animation", {
            detail: {
              sourceRect: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
              },
              quantity: Math.max(1, Number(quantity) || 1)
            }
          }));
        }
        setAdded(true);
        router.refresh();
      }}
    >
      {disabled ? "Out of stock" : added ? "Added" : "Add to cart"}
    </button>
  );
}
