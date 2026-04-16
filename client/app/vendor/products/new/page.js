"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import ProductForm from "@/components/admin/ProductForm";

const initialFormData = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  price: "",
  comparePrice: "",
  stock: "",
  weight: "",
  sku: "",
  images: [],
  options: [],
  variants: [],
  categories: [],
  benefitsText: "",
  benefitsHeading: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: ""
};

function buildFormData(product) {
  return {
    name: product.name || "",
    slug: product.slug || "",
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    price: product.price?.toString() || "",
    comparePrice: product.compareAtPrice?.toString() || "",
    stock: product.stock?.toString() || "",
    weight: product.weight?.toString() || "",
    sku: product.sku || "",
    images: product.images || [],
    options: product.variants || [],
    variants: (product.variantCombinations || []).map((variant, index) => ({
      id: variant.sku || `variant-${index}`,
      optionValues: variant.optionValues || {},
      sku: variant.sku || "",
      price: variant.price?.toString() || "",
      stock: variant.stock ?? 0,
      weight: variant.weight?.toString() || "",
      image: variant.image || ""
    })),
    categories: product.category?._id ? [product.category._id] : [],
    benefitsText: product.benefitsText || "",
    benefitsHeading: product.benefitsHeading || "",
    metaTitle: product.seo?.metaTitle || "",
    metaDescription: product.seo?.metaDescription || "",
    metaKeywords: (product.seo?.keywords || product.tags || []).join(", ")
  };
}

function VendorProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const isEditing = Boolean(productId);
  const { token, error, setError } = useAccessToken("Login with a vendor account to manage products.");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [productStatus, setProductStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await marketplaceApi.getCategories();
        setCategories(response.data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadCategories();
  }, [setError]);

  useEffect(() => {
    async function loadProduct() {
      if (!token || !productId) return;
      try {
        setLoading(true);
        const response = await marketplaceApi.getVendorProduct(token, productId);
        setFormData(buildFormData(response.data));
        setProductStatus(response.data.status || "");
        setRejectionReason(response.data.rejectionReason || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId, setError, token]);

  async function handleSubmit() {
    if (!token) return;
    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Product description is required.");
      return;
    }
    if (!formData.categories.length) {
      setError("Assign the product to a category.");
      return;
    }
    if (!formData.sku.trim()) {
      setError("Product SKU is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const parsedKeywords = formData.metaKeywords
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim(),
        price: Number(formData.price) || 0,
        compareAtPrice: Number(formData.comparePrice) || 0,
        categoryId: formData.categories[0],
        stock: Number(formData.stock) || 0,
        weight: Number(formData.weight) || 0,
        sku: formData.sku.trim(),
        variants: formData.options,
        variantCombinations: formData.variants.map((variant) => ({
          optionValues: variant.optionValues || {},
          sku: variant.sku || "",
          price: Number(variant.price) || 0,
          stock: Number(variant.stock) || 0,
          weight: Number(variant.weight) || 0,
          image: variant.image || ""
        })),
        benefitsHeading: formData.benefitsHeading.trim(),
        benefitsText: formData.benefitsText,
        tags: parsedKeywords,
        seo: {
          metaTitle: formData.metaTitle.trim(),
          metaDescription: formData.metaDescription.trim(),
          keywords: parsedKeywords
        },
        images: formData.images
      };

      if (isEditing) {
        await marketplaceApi.updateVendorProduct(token, productId, payload);
      } else {
        await marketplaceApi.createVendorProduct(token, payload);
      }

      router.push("/vendor/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container page-section stack">
      <div>
        <div className="eyebrow">Vendor</div>
        <h1 className="page-title">{isEditing ? "Manage product" : "Add product"}</h1>
      </div>
      {error ? <div className="card section small">{error}</div> : null}
      {isEditing ? (
        <div className="glass-card p-4 text-sm text-slate-600">
          Status: <strong className="text-ink">{productStatus || "pending"}</strong>
          {rejectionReason ? <div className="mt-2 text-rose-700">Rejection reason: {rejectionReason}</div> : null}
        </div>
      ) : null}
      <ProductForm
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        onSubmit={handleSubmit}
        isLoading={loading}
        isEditing={isEditing}
      />
    </section>
  );
}

export default function VendorProductPage() {
  return (
    <Suspense fallback={<section className="container page-section text-sm text-slate-600">Loading product form...</section>}>
      <VendorProductPageContent />
    </Suspense>
  );
}
