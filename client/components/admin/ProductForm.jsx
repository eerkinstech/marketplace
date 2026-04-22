"use client";

import { useEffect, useRef, useState } from "react";
import ProductBasicInfo from "./ProductForm/BasicInfo";
import ProductPricing from "./ProductForm/Pricing";
import ProductImages from "./ProductForm/Images";
import ProductOptions from "./ProductForm/Options";
import ProductCategories from "./ProductForm/Categories";
import ProductBenefits from "./ProductForm/Benefits";
import ProductSEO from "./ProductForm/SEO";
import ProductShipping from "./ProductForm/Shipping";
import { marketplaceApi } from "@/lib/api/marketplace";

export default function ProductForm({
  formData,
  setFormData,
  categories,
  onSubmit,
  isLoading,
  isEditing,
  token,
  mediaScope = "vendor",
  shippingScope = "vendor",
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaError, setMediaError] = useState("");
  const [shippingAreas, setShippingAreas] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const formRef = useRef(null);

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "fa-info-circle" },
    { id: "pricing", label: "Pricing & Stock", icon: "fa-tag" },
    { id: "images", label: "Images", icon: "fa-images" },
    { id: "options", label: "Variants & Options", icon: "fa-shapes" },
    { id: "categories", label: "Categories", icon: "fa-folder" },
    { id: "shipping", label: "Shipping", icon: "fa-truck-fast" },
    { id: "benefits", label: "Benefits", icon: "fa-star" },
    { id: "seo", label: "SEO & GMC", icon: "fa-search" },
  ];

  const handleAutoGenerateSlug = () => {
    if (formData.name.trim()) {
      const slug = formData.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
        .replace(/-+/g, "-");
      setFormData({ ...formData, slug });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }
    await onSubmit();
  };

  const loadMediaLibrary = async () => {
    if (!token) return [];

    try {
      setMediaError("");
      const response = mediaScope === "admin"
        ? await marketplaceApi.getAdminMedia(token)
        : await marketplaceApi.getVendorMedia(token);
      const items = response.data || [];
      setMediaItems(items);
      return items;
    } catch (error) {
      setMediaError(error.message || "Failed to load media library.");
      return [];
    }
  };

  const uploadToMediaLibrary = async (images) => {
    if (!token || !images?.length) return [];

    try {
      setMediaError("");
      const response = mediaScope === "admin"
        ? await marketplaceApi.createAdminMedia(token, { images })
        : await marketplaceApi.createVendorMedia(token, { images });
      const createdItems = response.data || [];
      setMediaItems((current) => [...createdItems, ...current]);
      return createdItems;
    } catch (error) {
      setMediaError(error.message || "Failed to upload media.");
      throw error;
    }
  };

  const loadShippingAreas = async () => {
    if (!token) return [];

    try {
      setShippingLoading(true);
      setShippingError("");
      const response = shippingScope === "admin"
        ? await marketplaceApi.getAdminShipping(token)
        : await marketplaceApi.getVendorShippingManagement(token);
      const areas = response?.data?.areas || [];
      setShippingAreas(areas);
      return areas;
    } catch (error) {
      setShippingError(error.message || "Failed to load shipping options.");
      return [];
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    loadMediaLibrary();
  }, [token, mediaScope]);

  useEffect(() => {
    loadShippingAreas();
  }, [token, shippingScope]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 bg-gray-50 overflow-x-auto p-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition duration-200 flex items-center gap-2 ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        <div ref={formRef}>
          {/* Basic Info */}
          {activeTab === "basic" && (
            <ProductBasicInfo
              formData={formData}
              setFormData={setFormData}
              onGenerateSlug={handleAutoGenerateSlug}
            />
          )}

          {/* Pricing & Stock */}
          {activeTab === "pricing" && (
            <ProductPricing formData={formData} setFormData={setFormData} />
          )}

          {/* Images */}
          {activeTab === "images" && (
            <ProductImages
              formData={formData}
              setFormData={setFormData}
              mediaItems={mediaItems}
              mediaError={mediaError}
              onMediaUpload={uploadToMediaLibrary}
              onMediaRefresh={loadMediaLibrary}
            />
          )}

          {/* Options & Variants */}
          {activeTab === "options" && (
            <ProductOptions
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {/* Categories */}
          {activeTab === "categories" && (
            <ProductCategories
              formData={formData}
              setFormData={setFormData}
              categories={categories}
            />
          )}

          {/* Shipping */}
          {activeTab === "shipping" && (
            <ProductShipping
              formData={formData}
              setFormData={setFormData}
              shippingAreas={shippingAreas}
              loading={shippingLoading}
              error={shippingError}
              scopeLabel={shippingScope === "admin" ? "the admin" : "your vendor"}
            />
          )}

          {/* Benefits */}
          {activeTab === "benefits" && (
            <ProductBenefits formData={formData} setFormData={setFormData} />
          )}

          {/* SEO */}
          {activeTab === "seo" && (
            <ProductSEO formData={formData} setFormData={setFormData} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={isLoading}
          className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <span className="animate-spin"><i className="fas fa-spinner"></i></span>}
          {isEditing ? "Update Product" : "Create Product"}
        </button>
      </div>
    </div>
  );
}
