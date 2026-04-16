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

function AdminProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const isEditing = Boolean(productId);
  const { token, error: authError, setError } = useAccessToken("Login with an admin account to manage products.");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [statusNote, setStatusNote] = useState("");

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
        const response = await marketplaceApi.getAdminProduct(token, productId);
        setFormData(buildFormData(response.data));
        if (response.data.vendor?.role === "vendor") {
          setStatusNote("Editing a vendor product will send it back to pending approval until an admin re-approves it.");
        } else {
          setStatusNote("Admin-owned products remain approved after save.");
        }
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
        await marketplaceApi.updateAdminProduct(token, productId, payload);
      } else {
        await marketplaceApi.createAdminProduct(token, payload);
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="p-6">
      <div className="mb-8">
        <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-500">Admin</div>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{isEditing ? "Manage Product" : "Add New Product"}</h1>
      </div>

      {authError ? <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{authError}</div> : null}
      {statusNote ? <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{statusNote}</div> : null}

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

export default function AdminProductPage() {
  return (
    <Suspense fallback={<section className="p-6 text-sm text-slate-600">Loading product form...</section>}>
      <AdminProductPageContent />
    </Suspense>
  );
}
