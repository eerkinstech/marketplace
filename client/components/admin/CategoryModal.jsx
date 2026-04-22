import React from "react";

export default function CategoryModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleImageUpload,
  handleSave,
  isEditing,
  originalSlug,
  shouldCreateRedirect,
  setShouldCreateRedirect,
  isLoading,
  generateSlug,
  handleNameChange,
  parentOptions = [],
}) {
  if (!isOpen) return null;

  const slugChanged =
    isEditing && originalSlug && formData.slug && originalSlug !== formData.slug;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all bg-white">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Category" : "Add New Category"}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="hover:bg-gray-200 p-2 rounded-lg transition duration-200 text-gray-600 hover:text-gray-900"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category Image
            </label>
            <label className="flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition duration-300">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isLoading}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                <span className="text-sm font-semibold text-gray-900">
                  Click to upload image
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG up to 10MB
                </span>
              </div>
            </label>
            {formData.image && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Preview:
                </p>
                <div className="relative inline-block">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, image: null, imageFile: null })
                    }
                    disabled={isLoading}
                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition duration-200 shadow-lg"
                  >
                    <i className="fas fa-times text-sm"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Parent Category
            </label>
            <select
              value={formData.parentId || ""}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
            >
              <option value="">Main category</option>
              {parentOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.label || option.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={formData.isActive !== false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={isLoading}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm font-semibold text-gray-900">Active category</span>
          </label>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
              placeholder="e.g., electronics"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: <span className="font-semibold">/category/{formData.slug || "your-slug"}</span>
            </p>
          </div>

          {/* Slug Change Warning */}
          {slugChanged && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3">
              <div className="space-y-2 bg-white rounded p-3 border border-amber-200">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Old URL:
                  </p>
                  <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                    /category/{originalSlug}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    New URL:
                  </p>
                  <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                    /category/{formData.slug}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shouldCreateRedirect}
                  onChange={(e) => setShouldCreateRedirect(e.target.checked)}
                  disabled={isLoading}
                  className="rounded w-4 h-4"
                />
                <span className="text-sm font-semibold text-gray-900">
                  Create redirect from old slug
                </span>
              </label>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isLoading}
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
              placeholder="Enter category description"
            />
          </div>

          {/* SEO Section */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-search text-blue-600"></i> SEO Information
            </h3>

            {/* Meta Title */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) =>
                  setFormData({ ...formData, metaTitle: e.target.value })
                }
                disabled={isLoading}
                maxLength="60"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                placeholder="Recommended: 30-60 characters"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.metaTitle.length}/60 characters
              </p>
            </div>

            {/* Meta Description */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metaDescription: e.target.value,
                  })
                }
                disabled={isLoading}
                maxLength="160"
                rows="2"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                placeholder="Recommended: 120-160 characters"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Meta Keywords
              </label>
              <input
                type="text"
                value={formData.metaKeywords}
                onChange={(e) =>
                  setFormData({ ...formData, metaKeywords: e.target.value })
                }
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                placeholder="Comma separated keywords"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter keywords separated by commas
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <span className="animate-spin"><i className="fas fa-spinner"></i></span>}
            {isEditing ? "Update Category" : "Add Category"}
          </button>
        </div>
      </div>
    </div>
  );
}
